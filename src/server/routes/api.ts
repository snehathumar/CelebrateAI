import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import {
  GeneratePlanRequestSchema,
  VendorNegotiateRequestSchema,
  ChatAssistantRequestSchema,
} from '../validation/schemas';
import {
  generateEventPlanWithAI,
  generateVendorNegotiateWithAI,
  generateConciergeReplyWithAI,
} from '../services/gemini';
import {
  generateFallbackPlan,
  generateFallbackNegotiation,
} from '../fallback/templates';
import { planCache, MemoryCache } from '../cache';
import { getValidPhases } from '../../utils/eventCalculations';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_AI_MAX } from '../constants';
import { EventPlan } from '../../types/event';

export const apiRouter = Router();

/**
 * Strict rate limiter for Gemini AI endpoints (10 requests/minute per IP)
 */
export const aiEndpointsLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_AI_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: 'AI request limit reached. Please wait a moment before initiating another generation (limit: 10 req/min).',
  },
});

// 1. Generate Complete Event Plan
apiRouter.post('/generate-plan', aiEndpointsLimiter, async (req: Request, res: Response) => {
  const parseResult = GeneratePlanRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request data. Please verify event type allowlist (wedding, birthday, community), YYYY-MM-DD date, and numeric boundaries.',
      details: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
    });
  }

  const data = parseResult.data;
  const cacheKey = MemoryCache.hashKey('plan', data);

  // Check in-memory TTL cache
  const cached = planCache.get<EventPlan>(cacheKey);
  if (cached) {
    res.setHeader('X-Cache-Status', 'HIT');
    return res.json({ success: true, plan: cached, source: 'cache' });
  }

  res.setHeader('X-Cache-Status', 'MISS');

  const eventTitle = data.title || `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Celebration`;
  const validPhases = getValidPhases(data.date);
  const now = new Date();
  const eventDateObj = new Date(data.date + 'T00:00:00');
  const daysRemaining = Math.max(0, Math.ceil((eventDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Try AI first
  const aiPlan = await generateEventPlanWithAI(data, eventTitle, daysRemaining, validPhases);
  if (aiPlan) {
    planCache.set(cacheKey, aiPlan);
    return res.json({ success: true, plan: aiPlan, source: 'gemini' });
  }

  // Fallback high-fidelity smart generator
  const fallbackPlan = generateFallbackPlan(
    data.type,
    eventTitle,
    data.date,
    data.location,
    data.guestCount,
    data.totalBudget,
    data.currency,
    data.vibe
  );

  planCache.set(cacheKey, fallbackPlan);
  return res.json({ success: true, plan: fallbackPlan, source: 'template' });
});

// 2. Generate Vendor Negotiation & Inquiry Letters
apiRouter.post('/vendor-negotiate', aiEndpointsLimiter, async (req: Request, res: Response) => {
  const parseResult = VendorNegotiateRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid vendor negotiation parameters.',
      details: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
    });
  }

  const data = parseResult.data;
  const cacheKey = MemoryCache.hashKey('vendor', data);

  const cached = planCache.get<{ inquiryEmail: string; negotiationPitch: string; questionsToCheck: string[] }>(cacheKey);
  if (cached) {
    res.setHeader('X-Cache-Status', 'HIT');
    return res.json({
      success: true,
      inquiryEmail: cached.inquiryEmail,
      negotiationPitch: cached.negotiationPitch,
      questionsToCheck: cached.questionsToCheck,
      source: 'cache',
    });
  }

  res.setHeader('X-Cache-Status', 'MISS');

  const effectiveVendorName = data.vendorName.trim() || 'Prospective Vendor';
  const effectiveQuoteAmount = Number(data.quoteAmount) || 2500;
  const effectiveTargetBudget = Number(data.targetBudget) || Math.round(effectiveQuoteAmount * 0.85);
  const effectiveDate = data.eventDate.trim() || 'the scheduled celebration date';

  const aiResult = await generateVendorNegotiateWithAI(
    data,
    effectiveVendorName,
    effectiveQuoteAmount,
    effectiveTargetBudget,
    effectiveDate
  );

  if (aiResult) {
    planCache.set(cacheKey, aiResult);
    return res.json({
      success: true,
      inquiryEmail: aiResult.inquiryEmail,
      negotiationPitch: aiResult.negotiationPitch,
      questionsToCheck: aiResult.questionsToCheck,
      source: 'gemini',
    });
  }

  const fallback = generateFallbackNegotiation(
    data.eventTitle,
    data.vendorCategory,
    effectiveVendorName,
    data.eventType,
    effectiveDate,
    data.currency,
    effectiveQuoteAmount,
    effectiveTargetBudget
  );

  planCache.set(cacheKey, fallback);
  return res.json({
    success: true,
    inquiryEmail: fallback.inquiryEmail,
    negotiationPitch: fallback.negotiationPitch,
    questionsToCheck: fallback.questionsToCheck,
    source: 'template',
  });
});

// 3. AI Event Concierge Chat
apiRouter.post('/chat-assistant', aiEndpointsLimiter, async (req: Request, res: Response) => {
  const parseResult = ChatAssistantRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid chat parameters. Messages array max 20 items and text max 1000 characters.',
      details: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
    });
  }

  const aiReply = await generateConciergeReplyWithAI(parseResult.data);
  if (aiReply) {
    return res.json({
      success: true,
      reply: aiReply,
      suggestions: [
        'How can I trim 10% off the catering budget?',
        'Suggest 3 fun icebreaker games for our guests',
        'What should be in our day-of emergency kit?',
      ],
      source: 'gemini',
    });
  }

  // Fallback intelligent concierge response
  const userMessages = parseResult.data.messages;
  const latestMessage = (userMessages.length > 0 ? userMessages[userMessages.length - 1].text : '').toLowerCase();

  let reply = `Here are expert recommendations for "${parseResult.data.currentPlan?.title || 'your event'}":\n\n• **Budget Optimization:** Focus major investment on food, beverage, and music—these account for 85% of guest memories!\n• **Timeline Precision:** Build a 20-minute buffer before speeches and food service to account for guest mingling.\n• **Vendor Coordination:** Share a single 1-page Run of Show with all key vendors 7 days in advance.`;

  if (latestMessage.includes('budget') || latestMessage.includes('cut') || latestMessage.includes('save') || latestMessage.includes('cost')) {
    reply = `### Smart Ways to Trim 10-15% From Your Budget:\n1. **Catering Strategy:** Switch from plated dinner to interactive gourmet stations or family-style service to reduce staffing costs.\n2. **Floral Repurposing:** Move ceremony arches or aisle arrangements directly to the reception head table and bar.\n3. **Signature Sips:** Offer two signature cocktails and local wine/beer instead of a costly full top-shelf open bar.\n4. **Digital Invites:** Use interactive RSVP portals to save on print, envelopes, and postage.`;
  } else if (latestMessage.includes('game') || latestMessage.includes('activity') || latestMessage.includes('fun') || latestMessage.includes('idea')) {
    reply = `### High-Engagement Activities for Your Guests:\n1. **The Audio Guestbook:** An antique rotary telephone where guests record funny voice memos.\n2. **Polaroid Memory Wall:** Instant mini cameras with metallic markers for guest selfies and well-wishes.\n3. **Trivia or Video Tribute:** A fast 5-minute kahoot or interactive trivia celebrating funny trivia about the guest(s) of honor!`;
  } else if (latestMessage.includes('timeline') || latestMessage.includes('schedule') || latestMessage.includes('run of show')) {
    reply = `### Day-of Timeline Golden Rules:\n• **Pacing:** Never let dinner service exceed 75 minutes so guests don't get restless.\n• **Speeches:** Keep each toast strictly under 3 minutes; schedule them between meal courses.\n• **Golden Hour:** Schedule portraits 45 minutes before sunset for the most flattering lighting!`;
  }

  return res.json({
    success: true,
    reply,
    suggestions: [
      'Give me a checklist for the Day-Of Emergency Kit',
      'How to seat guests with different dietary restrictions?',
      'Draft a warm welcome speech opening',
    ],
    source: 'template',
  });
});
