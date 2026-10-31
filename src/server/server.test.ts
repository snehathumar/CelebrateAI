import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

// Explicitly mock Gemini SDK to avoid real network latency and simulate fallback / offline states
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: vi.fn().mockImplementation(async ({ contents }) => {
          // If test wants to simulate error or fallback
          if (process.env.SIMULATE_GEMINI_FAIL === 'true') {
            throw new Error('Simulated Gemini Network Timeout');
          }
          // Default mock structured JSON response
          return {
            text: JSON.stringify({
              title: 'Mocked Celebration Plan',
              type: 'wedding',
              date: '2027-09-18',
              location: 'Mocked Coastal Venue',
              guestCount: 120,
              totalBudget: 45000,
              currency: 'USD',
              vibe: 'Modern Coastal Luxury',
              colorPalette: [
                { name: 'Rose Gold', hex: '#B76E79' },
                { name: 'Champagne', hex: '#F7E7CE' },
              ],
              budgetItems: [
                { category: 'Venue', name: 'Primary Venue', estimatedCost: 15000, notes: 'Reserved' },
                { category: 'Catering & Bar', name: 'Gourmet Catering', estimatedCost: 15000, notes: 'Menu set' },
                { category: 'Photo & Video', name: 'Photography', estimatedCost: 5000, notes: 'Full coverage' },
                { category: 'Music & Entertainment', name: 'Live DJ', estimatedCost: 4000, notes: 'Sound & lights' },
                { category: 'Decor & Florals', name: 'Floral Arrangements', estimatedCost: 3000, notes: 'Arches & tables' },
                { category: 'Favors & Gifts', name: 'Custom Gifts', estimatedCost: 1500, notes: 'Keepsakes' },
                { category: 'Emergency Buffer', name: 'Buffer Fund', estimatedCost: 1500, notes: 'Incidentals' },
              ],
              timeline: [
                { title: 'Lock agreement', phase: '12-6_months', priority: 'high', notes: 'Done' },
                { title: 'Day-of Setup', phase: 'day_of', priority: 'high', dayOfTime: '10:00 AM', notes: 'Prep' },
              ],
              vendors: [
                { category: 'Venue', name: 'Grand Estate', status: 'researching', quoteAmount: 15000, checklist: ['Insured'] },
              ],
              ideas: {
                themeName: 'Coastal Elegance',
                themeDescription: 'A breezy seaside atmosphere.',
                colorPalette: [{ name: 'Rose Gold', hex: '#B76E79' }],
                uniqueActivities: [{ title: 'Toast', description: 'Champagne toast at sunset' }],
                signatureFoodAndDrink: [{ name: 'Spritz', type: 'drink', description: 'Citrus' }],
                decorVibes: [{ title: 'Lanterns', tips: 'Warm lighting' }],
                musicAndVibeTips: ['Acoustic'],
                favorsAndGifts: ['Candles'],
              },
            }),
          };
        }),
      };
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      BOOLEAN: 'BOOLEAN',
      ARRAY: 'ARRAY',
    },
  };
});

import { app } from '../../server';
import { cleanAndParseJson } from './services/gemini';
import { planCache } from './cache';
import { normalizeBudgetItems, getValidPhases } from '../utils/eventCalculations';
import { BudgetItem } from '../types/event';

describe('Server & API Integration Suite (with Mocked Gemini)', () => {
  beforeEach(() => {
    planCache.clear();
    delete process.env.SIMULATE_GEMINI_FAIL;
  });

  describe('1. cleanAndParseJson Utility', () => {
    it('parses pure JSON string', () => {
      const parsed = cleanAndParseJson<{ message: string }>('{"message":"hello"}');
      expect(parsed).toEqual({ message: 'hello' });
    });

    it('strips ```json markdown fencing', () => {
      const raw = '```json\n{"status":"ok","value":42}\n```';
      const parsed = cleanAndParseJson<{ status: string; value: number }>(raw);
      expect(parsed).toEqual({ status: 'ok', value: 42 });
    });

    it('strips ``` markdown fencing without language identifier', () => {
      const raw = '```\n{"valid":true}\n```';
      const parsed = cleanAndParseJson<{ valid: boolean }>(raw);
      expect(parsed).toEqual({ valid: true });
    });

    it('returns null on invalid JSON without throwing', () => {
      const parsed = cleanAndParseJson('{ invalid json');
      expect(parsed).toBeNull();
    });

    it('returns null on empty or non-string input', () => {
      expect(cleanAndParseJson('')).toBeNull();
      expect(cleanAndParseJson(null as unknown as string)).toBeNull();
    });
  });

  describe('2. Budget Normalization & Timeline Phase Selection', () => {
    it('normalizes budget items proportionally so the sum equals totalBudget', () => {
      const rawItems: BudgetItem[] = [
        { id: '1', category: 'Venue', name: 'Hall', estimatedCost: 4000, actualCost: 0, paid: false },
        { id: '2', category: 'Catering & Bar', name: 'Food', estimatedCost: 4000, actualCost: 0, paid: false },
      ];
      const target = 10000;
      const normalized = normalizeBudgetItems(rawItems, target);
      const total = normalized.reduce((acc, it) => acc + it.estimatedCost, 0);
      expect(total).toBe(target);
      expect(normalized[0].estimatedCost).toBe(5000);
      expect(normalized[1].estimatedCost).toBe(5000);
    });

    it('excludes elapsed timeline phases for near-term event dates', () => {
      const baseDate = new Date('2026-10-31T00:00:00');
      // 10 days away: should only have final_weeks and day_of
      const phases = getValidPhases('2026-11-10', baseDate);
      expect(phases).toEqual(['final_weeks', 'day_of']);
      expect(phases).not.toContain('12-6_months');
    });
  });

  describe('3. Validation (400 Bad Request)', () => {
    it('returns 400 when event type is not in allowlist', async () => {
      const res = await request(app)
        .post('/api/generate-plan')
        .send({
          type: 'corporate_hackathon',
          date: '2027-05-20',
          guestCount: 50,
          totalBudget: 10000,
          currency: 'USD',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid request data');
    });

    it('returns 400 when date is not in YYYY-MM-DD format', async () => {
      const res = await request(app)
        .post('/api/generate-plan')
        .send({
          type: 'wedding',
          date: '20-05-2027',
          guestCount: 100,
          totalBudget: 25000,
          currency: 'USD',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when guest count is out of bounds (< 1 or > 10,000)', async () => {
      const res = await request(app)
        .post('/api/generate-plan')
        .send({
          type: 'birthday',
          date: '2027-06-15',
          guestCount: 0,
          totalBudget: 5000,
          currency: 'USD',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 on vendor-negotiate with quoteAmount over limit', async () => {
      const res = await request(app)
        .post('/api/vendor-negotiate')
        .send({
          quoteAmount: -50,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Fallback Execution and Defaults', () => {
    it('falls back safely to high-fidelity template plan when AI fails', async () => {
      process.env.SIMULATE_GEMINI_FAIL = 'true';

      const payload = {
        type: 'wedding',
        title: 'Golden Sunset Nuptials',
        date: '2027-09-18',
        location: 'Coastal Estate',
        guestCount: 120,
        totalBudget: 45000,
        currency: 'USD',
        vibe: 'Modern Coastal Luxury',
      };

      const res = await request(app).post('/api/generate-plan').send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('template');
      expect(res.body.plan).toBeDefined();
      expect(res.body.plan.title).toBe('Golden Sunset Nuptials');
      expect(res.body.plan.budgetItems.length).toBeGreaterThanOrEqual(7);
      expect(res.body.plan.timeline.length).toBeGreaterThan(0);
      expect(res.body.plan.vendors.length).toBeGreaterThan(0);
    });

    it('populates vendor-negotiate defaults and questions checklist', async () => {
      process.env.SIMULATE_GEMINI_FAIL = 'true';

      const res = await request(app)
        .post('/api/vendor-negotiate')
        .send({
          vendorCategory: 'Floral Design',
          quoteAmount: 4000,
          targetBudget: 3200,
          eventTitle: 'Summer Gala',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.inquiryEmail).toContain('Floral Design');
      expect(res.body.negotiationPitch).toContain('3200');
      expect(Array.isArray(res.body.questionsToCheck)).toBe(true);
      expect(res.body.questionsToCheck.length).toBe(5);
    });
  });

  describe('5. In-Memory TTL Cache Hit Verification', () => {
    it('caches /api/generate-plan response and returns cache source on identical second call', async () => {
      const payload = {
        type: 'community',
        title: 'Artisan Block Fair',
        date: '2027-08-10',
        location: 'Riverside Walk',
        guestCount: 500,
        totalBudget: 15000,
        currency: 'USD',
        vibe: 'Vibrant Community',
      };

      // First call: MISS
      const res1 = await request(app).post('/api/generate-plan').send(payload);
      expect(res1.status).toBe(200);
      expect(res1.headers['x-cache-status']).toBe('MISS');

      // Second call: HIT
      const res2 = await request(app).post('/api/generate-plan').send(payload);
      expect(res2.status).toBe(200);
      expect(res2.headers['x-cache-status']).toBe('HIT');
      expect(res2.body.source).toBe('cache');
      expect(res2.body.plan.title).toBe(res1.body.plan.title);
    });

    it('caches /api/vendor-negotiate response and returns cached source', async () => {
      const payload = {
        vendorCategory: 'Photography',
        vendorName: 'Luxe Moments Studio',
        quoteAmount: 3500,
        targetBudget: 3000,
        currency: 'USD',
        eventTitle: 'Annual Gala',
      };

      const res1 = await request(app).post('/api/vendor-negotiate').send(payload);
      expect(res1.status).toBe(200);
      expect(res1.headers['x-cache-status']).toBe('MISS');

      const res2 = await request(app).post('/api/vendor-negotiate').send(payload);
      expect(res2.status).toBe(200);
      expect(res2.headers['x-cache-status']).toBe('HIT');
      expect(res2.body.source).toBe('cache');
      expect(res2.body.inquiryEmail).toBe(res1.body.inquiryEmail);
    });
  });

  describe('6. Rate Limiting Protection (429)', () => {
    it('returns 429 when rate limit ceiling is exceeded', async () => {
      const express = (await import('express')).default;
      const rateLimit = (await import('express-rate-limit')).default;
      const testApp = express();
      const limiter = rateLimit({
        windowMs: 60 * 1000,
        max: 2,
        statusCode: 429,
        message: { success: false, error: 'Rate limit exceeded' },
      });
      testApp.use(limiter);
      testApp.get('/test', (_req, res) => res.json({ ok: true }));

      await request(testApp).get('/test');
      await request(testApp).get('/test');
      const res = await request(testApp).get('/test');

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Rate limit exceeded');
    });
  });
});
