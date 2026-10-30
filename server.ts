import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { EventPlan, EventType, CurrencyCode, TimelineTask, BudgetItem, VendorItem, EventIdeas } from './src/types/event';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to sanitize and parse JSON safely
function cleanAndParseJson<T>(raw: string, fallback: T): T {
  try {
    let clean = raw.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(clean);
  } catch (err) {
    console.warn('Failed to parse AI response as JSON, falling back:', err);
    return fallback;
  }
}

// 1. Generate Complete Event Plan
app.post('/api/generate-plan', async (req: Request, res: Response) => {
  const {
    type = 'wedding',
    title = '',
    date = '2026-12-15',
    location = 'Local Venue',
    guestCount = 100,
    totalBudget = 20000,
    currency = 'USD',
    vibe = 'Elegant, celebratory, memorable',
    preferences = '',
  } = req.body;

  const eventTitle = title || `${type.charAt(0).toUpperCase() + type.slice(1)} Celebration`;

  if (ai) {
    try {
      const prompt = `
You are a world-class celebrity event planner and budget strategist.
Create a comprehensive, production-ready event plan for:
Event Type: ${type}
Title: "${eventTitle}"
Date: ${date}
Location: ${location}
Expected Guests: ${guestCount}
Total Budget: ${currency} ${totalBudget}
Vibe/Aesthetic: ${vibe}
Special Notes/Preferences: ${preferences || 'None'}

Return ONLY a valid JSON object strictly adhering to this schema (no extra explanation or markdown quotes):
{
  "title": "${eventTitle}",
  "type": "${type}",
  "date": "${date}",
  "location": "${location}",
  "guestCount": ${guestCount},
  "totalBudget": ${totalBudget},
  "currency": "${currency}",
  "vibe": "${vibe}",
  "colorPalette": [
    { "name": "Color Name", "hex": "#HEX" } // exactly 4-5 complementary colors
  ],
  "budgetItems": [
    {
      "id": "b1",
      "category": "Venue | Catering & Bar | Decor & Florals | Photo & Video | Music & Entertainment | Attire & Beauty | Favors & Gifts | Logistics & Tech | Emergency Buffer",
      "name": "Line item name",
      "estimatedCost": number,
      "actualCost": 0,
      "paid": false,
      "notes": "strategic allocation tip"
    } // at least 7-9 items summing reasonably to the total budget
  ],
  "timeline": [
    {
      "id": "t1",
      "title": "Actionable task",
      "phase": "12-6_months | 6-3_months | 3-1_months | final_weeks | day_of",
      "targetDate": "YYYY-MM-DD",
      "dayOfTime": "HH:MM AM/PM (only for day_of phase, e.g. 02:00 PM)",
      "completed": false,
      "priority": "high | medium | low",
      "assignee": "e.g. Lead Planner / Host",
      "notes": "tips"
    } // provide 12-16 tasks including at least 5 chronological day-of run-of-show milestones
  ],
  "vendors": [
    {
      "id": "v1",
      "category": "e.g. Venue, Catering, Photography, DJ & Sound, Florist",
      "name": "Suggested Vendor Name or Style",
      "contactPerson": "Contact Name",
      "status": "researching | contacted | quoted | booked | paid",
      "quoteAmount": number,
      "depositPaid": 0,
      "notes": "what to verify",
      "checklist": ["3 specific vetting questions or requirements"]
    } // 4 to 6 essential vendor categories for this event type
  ],
  "ideas": {
    "themeName": "Creative Theme Concept",
    "themeDescription": "Vivid description of the look and feel",
    "colorPalette": [ { "name": "...", "hex": "..." } ],
    "uniqueActivities": [
      { "title": "...", "description": "..." } // 3 personalized, interactive memorable activities
    ],
    "signatureFoodAndDrink": [
      { "name": "...", "type": "drink | food | dessert", "description": "..." } // 3-4 custom menu items
    ],
    "decorVibes": [
      { "title": "...", "tips": "..." } // 3 specific lighting/decor styling elements
    ],
    "musicAndVibeTips": [
      "string tip 1", "string tip 2", "string tip 3"
    ],
    "favorsAndGifts": [
      "unique guest favor 1", "unique guest favor 2", "unique guest favor 3"
    ]
  }
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text || '';
      const parsed = cleanAndParseJson<Partial<EventPlan>>(text, null as any);

      if (parsed && parsed.budgetItems && parsed.timeline) {
        const fullPlan: EventPlan = {
          id: `plan-${Date.now()}`,
          title: parsed.title || eventTitle,
          type: type as EventType,
          date: parsed.date || date,
          location: parsed.location || location,
          guestCount: Number(parsed.guestCount) || guestCount,
          totalBudget: Number(parsed.totalBudget) || totalBudget,
          currency: (parsed.currency as CurrencyCode) || currency,
          vibe: parsed.vibe || vibe,
          colorPalette: parsed.colorPalette || [
            { name: 'Rose Gold', hex: '#B76E79' },
            { name: 'Champagne', hex: '#F7E7CE' },
            { name: 'Deep Emerald', hex: '#046307' },
            { name: 'Soft Pearl', hex: '#F8F6F0' },
          ],
          budgetItems: parsed.budgetItems.map((b, idx) => ({
            id: b.id || `b-${idx + 1}`,
            category: b.category as any || 'Logistics & Tech',
            name: b.name || 'Expense',
            estimatedCost: Number(b.estimatedCost) || 500,
            actualCost: Number(b.actualCost) || 0,
            paid: Boolean(b.paid),
            notes: b.notes || '',
          })),
          timeline: parsed.timeline.map((t, idx) => ({
            id: t.id || `t-${idx + 1}`,
            title: t.title || 'Event Milestone',
            phase: t.phase || 'final_weeks',
            targetDate: t.targetDate || date,
            dayOfTime: t.dayOfTime || (t.phase === 'day_of' ? '12:00 PM' : undefined),
            completed: Boolean(t.completed),
            priority: (t.priority as any) || 'medium',
            assignee: t.assignee || 'Host',
            notes: t.notes || '',
          })),
          vendors: (parsed.vendors || []).map((v, idx) => ({
            id: v.id || `v-${idx + 1}`,
            category: v.category || 'Service',
            name: v.name || 'Vendor Partner',
            contactPerson: v.contactPerson || 'Coordinator',
            status: (v.status as any) || 'researching',
            quoteAmount: Number(v.quoteAmount) || 0,
            depositPaid: Number(v.depositPaid) || 0,
            notes: v.notes || '',
            checklist: v.checklist || ['Review contract terms', 'Confirm date availability'],
          })),
          ideas: parsed.ideas || {
            themeName: `${vibe} Gathering`,
            themeDescription: `A tailored ${type} experience crafted around ${vibe}.`,
            colorPalette: parsed.colorPalette || [],
            uniqueActivities: [
              { title: 'Interactive Guest Memory Station', description: 'Guests share photos and handwritten notes.' },
              { title: 'Signature Toast & Spotlight Moment', description: 'Curated speeches with personal tribute montage.' },
            ],
            signatureFoodAndDrink: [
              { name: 'Celebration Spritz', type: 'drink', description: 'Crisp sparkling blend with fresh citrus & herbs.' },
            ],
            decorVibes: [
              { title: 'Ambient Uplighting', tips: 'Warm tone LEDs to accentuate architectural venue lines.' },
            ],
            musicAndVibeTips: ['Build tempo from ambient acoustic to high-energy dance.'],
            favorsAndGifts: ['Custom keepsake gift with personalized monogram.'],
          },
          guests: [
            { id: 'g1', name: 'Primary Host & Partner', group: 'VIP', rsvpStatus: 'attending', plusOne: true, table: 'Table 1' },
            { id: 'g2', name: 'Close Family Lead', group: 'Family', rsvpStatus: 'attending', plusOne: true, table: 'Table 1' },
            { id: 'g3', name: 'Best Friend & Keynote Speaker', group: 'Friends', rsvpStatus: 'attending', plusOne: false, table: 'Table 2' },
          ],
        };

        return res.json({ success: true, plan: fullPlan, source: 'gemini' });
      }
    } catch (apiError) {
      console.error('Gemini API call failed, generating procedural fallback plan:', apiError);
    }
  }

  // Fallback high-fidelity smart generator
  const fallbackPlan = generateFallbackPlan(type, eventTitle, date, location, guestCount, totalBudget, currency, vibe);
  return res.json({ success: true, plan: fallbackPlan, source: 'smart-template' });
});

// 2. Generate Vendor Negotiation & Inquiry Letters
app.post('/api/vendor-negotiate', async (req: Request, res: Response) => {
  const { vendorCategory, vendorName, quoteAmount, targetBudget, eventTitle, eventType, currency, requirements } = req.body;

  const prompt = `
You are an expert event procurement and budget negotiator.
Event: "${eventTitle}" (${eventType})
Vendor Category: ${vendorCategory}
Vendor Name: ${vendorName || 'Prospective Vendor'}
Current Quote: ${currency} ${quoteAmount}
Target Budget: ${currency} ${targetBudget || Math.round(quoteAmount * 0.85)}
Special Requirements: ${requirements || 'High standard of service and reliable execution'}

Provide a JSON response with:
1. "inquiryEmail": A warm, polished initial reach-out/inquiry email asking for availability and pricing breakdown.
2. "negotiationPitch": A polite, respectful, and tactful email pitch to negotiate or request bundled value-adds (e.g. extra hour, waived setup fee, seasonal discount) while staying within our target budget.
3. "questionsToCheck": An array of 5 crucial vetting questions every host must ask this specific vendor type before signing.
Return ONLY valid JSON.
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const data = cleanAndParseJson(response.text || '', null);
      if (data) {
        return res.json({ success: true, ...data });
      }
    } catch (e) {
      console.warn('Vendor negotiate AI failed:', e);
    }
  }

  // Fallback negotiation kit
  return res.json({
    success: true,
    inquiryEmail: `Subject: Inquiry for ${eventTitle} - ${vendorCategory} Services\n\nDear ${vendorName} Team,\n\nWe love your work and would love to check your availability for our upcoming ${eventType}, "${eventTitle}".\n\nEvent Details:\n- Date: Upcoming celebration\n- Services Needed: ${vendorCategory}\n\nCould you please share your package options, rate sheet, and what is included in standard setup/tear-down?\n\nWarm regards,\nEvent Planning Team`,
    negotiationPitch: `Subject: Follow-up & Package Alignment - ${eventTitle}\n\nHi ${vendorName},\n\nThank you for sharing your comprehensive proposal of ${currency} ${quoteAmount}. Your portfolio is our top choice!\n\nWe have a strictly allocated budget of ${currency} ${targetBudget} for ${vendorCategory}. We would love to move forward with you if we can find a creative way to align—perhaps by adjusting service hours, streamlining deliverables, or including an early-booking courtesy. Could we schedule a 5-minute call to finalize terms?\n\nThank you for your flexibility!\nWarm regards`,
    questionsToCheck: [
      `What is your policy and timeline on date rescheduling or force majeure?`,
      `Are all travel, overtime, and equipment breakdown fees included in this estimate?`,
      `Do you carry comprehensive commercial general liability insurance?`,
      `Who will be our primary point of contact on-site the day of the event?`,
      `What is the exact payment schedule and deposit milestone breakdown?`,
    ],
  });
});

// 3. AI Event Concierge Chat
app.post('/api/chat-assistant', async (req: Request, res: Response) => {
  const { messages, currentPlan } = req.body;
  const userQuery = messages && messages.length > 0 ? messages[messages.length - 1].text : '';

  if (ai) {
    try {
      const systemContext = `
You are the Event Concierge AI, a cheerful, deeply knowledgeable celebrity event planner and logistics wizard.
Current Event Context:
- Title: ${currentPlan?.title || 'Celebration'}
- Type: ${currentPlan?.type || 'Event'}
- Date: ${currentPlan?.date || 'Upcoming'}
- Budget: ${currentPlan?.currency || '$'} ${currentPlan?.totalBudget || 0}
- Guests: ${currentPlan?.guestCount || 0}
- Vibe: ${currentPlan?.vibe || 'Festive'}
- Top Vendors: ${(currentPlan?.vendors || []).map((v: any) => v.category + ': ' + v.name).join(', ')}

Answer user questions with punchy, actionable advice, creative ideas, budget tips, or speech/timeline recommendations. Keep formatting clean with bullet points and bold highlights.
`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemContext}\n\nUser Question: ${userQuery}`,
      });

      return res.json({
        success: true,
        reply: response.text || 'I would be happy to help tailor your celebration plan! What would you like to explore next?',
        suggestions: [
          'How can I trim 10% off the catering budget?',
          'Suggest 3 fun icebreaker games for our guests',
          'What should be in our day-of emergency kit?',
        ],
      });
    } catch (e) {
      console.warn('Chat assistant AI error:', e);
    }
  }

  // Fallback intelligent concierge responses
  const q = userQuery.toLowerCase();
  let reply = `Here are expert recommendations for "${currentPlan?.title || 'your event'}":\n\n• **Budget Optimization:** Focus major investment on food, beverage, and music—these account for 85% of guest memories!\n• **Timeline Precision:** Build a 20-minute buffer before speeches and food service to account for guest mingling.\n• **Vendor Coordination:** Share a single 1-page Run of Show with all key vendors 7 days in advance.`;
  
  if (q.includes('budget') || q.includes('cut') || q.includes('save') || q.includes('cost')) {
    reply = `### Smart Ways to Trim 10-15% From Your Budget:\n1. **Catering Strategy:** Switch from plated dinner to interactive gourmet stations or family-style service to reduce staffing costs.\n2. **Floral Repurposing:** Move ceremony arches or aisle arrangements directly to the reception head table and bar.\n3. **Signature Sips:** Offer two signature cocktails and local wine/beer instead of a costly full top-shelf open bar.\n4. **Digital Invites:** Use interactive RSVP portals to save on print, envelopes, and postage.`;
  } else if (q.includes('game') || q.includes('activity') || q.includes('fun') || q.includes('idea')) {
    reply = `### High-Engagement Activities for Your Guests:\n1. **The Audio Guestbook:** An antique rotary telephone where guests record funny voice memos.\n2. **Polaroid Memory Wall:** Instant mini cameras with metallic markers for guest selfies and well-wishes.\n3. **Trivia or Video Tribute:** A fast 5-minute kahoot or interactive trivia celebrating funny trivia about the guest(s) of honor!`;
  } else if (q.includes('timeline') || q.includes('schedule') || q.includes('run of show')) {
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
  });
});

// Procedural high-fidelity generator fallback
function generateFallbackPlan(
  type: string,
  title: string,
  date: string,
  location: string,
  guestCount: number,
  totalBudget: number,
  currency: CurrencyCode,
  vibe: string
): EventPlan {
  const isWedding = type === 'wedding';
  const isBirthday = type === 'birthday';

  const colorPalette = isWedding
    ? [
        { name: 'Champagne Gold', hex: '#EEDC82' },
        { name: 'Sage Green', hex: '#8FBC8F' },
        { name: 'Blush Rose', hex: '#F4C2C2' },
        { name: 'Ivory Cream', hex: '#FAF9F6' },
        { name: 'Eucalyptus Leaf', hex: '#3B5345' },
      ]
    : isBirthday
    ? [
        { name: 'Neon Electric Pink', hex: '#FF007F' },
        { name: 'Arcade Teal', hex: '#00F0FF' },
        { name: 'Midnight Indigo', hex: '#1E1B4B' },
        { name: 'Vibrant Amber', hex: '#F59E0B' },
      ]
    : [
        { name: 'Harvest Orange', hex: '#EA580C' },
        { name: 'Forest Green', hex: '#166534' },
        { name: 'Warm Marigold', hex: '#CA8A04' },
        { name: 'Earth Linen', hex: '#F3F4F6' },
      ];

  const budgetItems: BudgetItem[] = [
    { id: 'b1', category: 'Venue', name: 'Primary Venue Space Rental', estimatedCost: Math.round(totalBudget * 0.32), actualCost: 0, paid: false, notes: 'Includes tables, chairs, staging' },
    { id: 'b2', category: 'Catering & Bar', name: 'Food Stations & Beverage Package', estimatedCost: Math.round(totalBudget * 0.35), actualCost: 0, paid: false, notes: `${guestCount} guests catered` },
    { id: 'b3', category: 'Photo & Video', name: 'Professional Photographer & Content Creator', estimatedCost: Math.round(totalBudget * 0.12), actualCost: 0, paid: false, notes: 'Coverage, edits, high-res gallery' },
    { id: 'b4', category: 'Music & Entertainment', name: 'DJ Sound System & Live Performer', estimatedCost: Math.round(totalBudget * 0.08), actualCost: 0, paid: false, notes: 'Wireless mics, lighting rigs' },
    { id: 'b5', category: 'Decor & Florals', name: 'Atmospheric Styling & Centerpieces', estimatedCost: Math.round(totalBudget * 0.06), actualCost: 0, paid: false, notes: 'Focal photo backdrop and tables' },
    { id: 'b6', category: 'Favors & Gifts', name: 'Personalized Keepsakes', estimatedCost: Math.round(totalBudget * 0.03), actualCost: 0, paid: false, notes: 'Handcrafted custom favors' },
    { id: 'b7', category: 'Emergency Buffer', name: 'Contingency & Incidentals Fund', estimatedCost: Math.round(totalBudget * 0.04), actualCost: 0, paid: false, notes: 'Reserved for last-minute needs' },
  ];

  const timeline: TimelineTask[] = [
    { id: 't1', title: 'Lock venue agreement and secure date deposit', phase: '12-6_months', targetDate: date, completed: true, priority: 'high', notes: 'Capacity verified' },
    { id: 't2', title: 'Curate caterer menu tasting and signature cocktail selection', phase: '6-3_months', targetDate: date, completed: true, priority: 'high' },
    { id: 't3', title: 'Distribute digital save-the-dates and launch RSVP tracker', phase: '6-3_months', targetDate: date, completed: true, priority: 'medium' },
    { id: 't4', title: 'Book sound, lighting, and DJ playlist preferences', phase: '3-1_months', targetDate: date, completed: false, priority: 'medium' },
    { id: 't5', title: 'Finalize headcount, dietary accommodations & floor layout', phase: 'final_weeks', targetDate: date, completed: false, priority: 'high' },
    { id: 't6', title: 'Pack day-of emergency kit, vendor checks & tip envelopes', phase: 'final_weeks', targetDate: date, completed: false, priority: 'high' },
    { id: 't7', title: 'Vendor access and setup begins', phase: 'day_of', dayOfTime: '10:00 AM', completed: false, priority: 'high', assignee: 'Coordinator' },
    { id: 't8', title: 'Audio soundcheck & lighting ambience check', phase: 'day_of', dayOfTime: '01:00 PM', completed: false, priority: 'medium', assignee: 'Sound Tech' },
    { id: 't9', title: 'Guest arrival & welcome reception drinks', phase: 'day_of', dayOfTime: '03:00 PM', completed: false, priority: 'high', assignee: 'Hospitality Team' },
    { id: 't10', title: 'Main event kickoff & keynote celebration program', phase: 'day_of', dayOfTime: '04:00 PM', completed: false, priority: 'high', assignee: 'Host / MC' },
    { id: 't11', title: 'Dinner service / food stations open', phase: 'day_of', dayOfTime: '05:30 PM', completed: false, priority: 'high', assignee: 'Catering Lead' },
    { id: 't12', title: 'Party dance floor, dessert bar & photo moments', phase: 'day_of', dayOfTime: '07:30 PM', completed: false, priority: 'low', assignee: 'DJ' },
    { id: 't13', title: 'Grand finale celebration & sparkler send-off', phase: 'day_of', dayOfTime: '10:00 PM', completed: false, priority: 'medium', assignee: 'All' },
  ];

  const vendors: VendorItem[] = [
    {
      id: 'v1',
      category: 'Venue',
      name: 'Grand Horizon Space',
      contactPerson: 'Alex Taylor',
      status: 'booked',
      quoteAmount: Math.round(totalBudget * 0.32),
      depositPaid: Math.round(totalBudget * 0.15),
      checklist: ['Permit verified', 'Insurance uploaded', 'Tear down curfew checked'],
    },
    {
      id: 'v2',
      category: 'Catering',
      name: 'Artisan Feast Co.',
      contactPerson: 'Chef Maria Rossi',
      status: 'quoted',
      quoteAmount: Math.round(totalBudget * 0.35),
      depositPaid: 0,
      checklist: ['Tasting scheduled', 'Vegan/GF options confirmed', 'Bar service included'],
    },
    {
      id: 'v3',
      category: 'Photography',
      name: 'Apex Visual Stories',
      contactPerson: 'Chris Vance',
      status: 'researching',
      quoteAmount: Math.round(totalBudget * 0.12),
      depositPaid: 0,
      checklist: ['Review portfolio galleries', 'Inquire drone permit', 'Check second shooter fee'],
    },
    {
      id: 'v4',
      category: 'DJ & Sound',
      name: 'Pulse Audio Dynamics',
      contactPerson: 'DJ Jordan Lee',
      status: 'contacted',
      quoteAmount: Math.round(totalBudget * 0.08),
      depositPaid: 0,
      checklist: ['Confirm wireless microphones', 'Provide custom playlist', 'Verify setup duration'],
    },
  ];

  const ideas: EventIdeas = {
    themeName: `${vibe} Splendor`,
    themeDescription: `A tailored ${type} atmosphere emphasizing unforgettable hospitality, seamless flow, and vivid aesthetic touches.`,
    colorPalette,
    uniqueActivities: [
      { title: 'Interactive Guest Memory Gallery', description: 'Guests add polaroids and personal written memories to a large aesthetic grid board.' },
      { title: 'Signature Spotlight Moment', description: 'Curated speeches accompanied by an acoustic backing melody and dynamic lighting.' },
      { title: 'Late-Night Surprise Snack Bar', description: 'Hot gourmet bite-sized snacks handed out to guests on the dance floor in custom branded cones.' },
    ],
    signatureFoodAndDrink: [
      { name: 'Sparkling Lavender Elixir', type: 'drink', description: 'Prosecco, wild lavender syrup, freshly squeezed lemon juice, and an edible floral garnish.' },
      { name: 'Smoked Honey Bourbon Old Fashioned', type: 'drink', description: 'Small-batch bourbon, smoked honey reduction, walnut bitters, and flamed orange zest.' },
      { name: 'Artisan Flatbread & Charcuterie Boards', type: 'food', description: 'Local cheeses, prosciutto, fig jam, roasted grapes, and warm sourdough crispbreads.' },
      { name: 'Miniature Warm Beignet Bites', type: 'dessert', description: 'Dusted in vanilla sugar and served with salted caramel dipping cups.' },
    ],
    decorVibes: [
      { title: 'Layered Warm Amber Illumination', tips: 'Combine hanging fairy light curtains with warm-toned tabletop hurricane lanterns.' },
      { title: 'Botanical Statement Archway', tips: 'Create a dramatic entrance arch with lush greenery and seasonal blooms that acts as the primary photo spot.' },
      { title: 'Custom Monogram Welcome Sign', tips: 'A modern matte acrylic or linen signage board with brass stand and floral base.' },
    ],
    musicAndVibeTips: [
      'Pre-event & Cocktail: Upbeat French acoustic jazz and soft indie melodic covers.',
      'Program & Speeches: Clear speech audio with subtle warm low-volume ambient pads.',
      'Celebration Finale: Seamless transition into energetic crowd-favorite dance anthems.',
    ],
    favorsAndGifts: [
      'Artisan mini local honey jars with personalized wooden dippers.',
      'Botanical hand-poured soy travel candles in brass tins.',
      'Custom printed canvas tote bags celebrating the occasion.',
    ],
  };

  const guests: GuestItem[] = [
    { id: 'g1', name: 'Guest of Honor / Hosts', group: 'VIP', rsvpStatus: 'attending', plusOne: true, table: 'Table 1' },
    { id: 'g2', name: 'Primary Family Representatives', group: 'Family', rsvpStatus: 'attending', plusOne: true, table: 'Table 1' },
    { id: 'g3', name: 'Close Circle Friends', group: 'Friends', rsvpStatus: 'attending', plusOne: true, table: 'Table 2' },
    { id: 'g4', name: 'Community Leaders & Mentors', group: 'VIP', rsvpStatus: 'pending', plusOne: false, table: 'Table 3' },
  ];

  return {
    id: `plan-${Date.now()}`,
    title,
    type: type as EventType,
    date,
    location,
    guestCount,
    totalBudget,
    currency,
    vibe,
    colorPalette,
    budgetItems,
    timeline,
    vendors,
    ideas,
    guests,
  };
}

// Full-stack Vite handling
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Celebration & Event Planner server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
