import { z } from 'zod';
import { ALLOWED_CURRENCIES, VALID_BUDGET_CATEGORIES } from '../constants';

/**
 * Zod Schemas for Runtime Validation across API and AI responses
 */

export const GeneratePlanRequestSchema = z.object({
  type: z.enum(['wedding', 'birthday', 'community']),
  title: z.string().max(120).optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  location: z.string().max(200).optional().default('Local Venue'),
  guestCount: z.number().int().min(1).max(10000),
  totalBudget: z.number().min(1).max(1000000000),
  currency: z.enum(ALLOWED_CURRENCIES).default('USD'),
  vibe: z.string().max(200).optional().default('Elegant, celebratory, memorable'),
  preferences: z.string().max(500).optional().default(''),
});

export type GeneratePlanRequest = z.infer<typeof GeneratePlanRequestSchema>;

export const VendorNegotiateRequestSchema = z.object({
  vendorCategory: z.string().max(200).optional().default('Vendor Service'),
  vendorName: z.string().max(200).optional().default('Prospective Vendor'),
  quoteAmount: z.number().min(0).max(1000000000).optional().default(2500),
  targetBudget: z.number().min(0).max(1000000000).optional(),
  eventTitle: z.string().max(120).optional().default('Celebration Event'),
  eventType: z.string().max(100).optional().default('event'),
  eventDate: z.string().max(100).optional().default(''),
  currency: z.enum(ALLOWED_CURRENCIES).default('USD'),
  requirements: z.string().max(500).optional().default('High standard of service and reliable execution'),
});

export type VendorNegotiateRequest = z.infer<typeof VendorNegotiateRequestSchema>;

export const ChatMessageInputSchema = z.object({
  id: z.string().max(100).optional(),
  sender: z.string().max(50),
  text: z.string().max(1000),
  timestamp: z.string().max(100).optional(),
  suggestions: z.array(z.string().max(200)).optional(),
  source: z.string().max(50).optional(),
});

export type ChatMessageInput = z.infer<typeof ChatMessageInputSchema>;

export const UntrustedPlanInputSchema = z
  .object({
    id: z.string().max(100).optional(),
    title: z.string().max(120).optional().default('Celebration'),
    type: z.string().max(50).optional().default('wedding'),
    date: z.string().max(100).optional().default(''),
    location: z.string().max(200).optional().default('Venue'),
    guestCount: z.number().int().min(0).max(10000).optional().default(100),
    totalBudget: z.number().min(0).max(1000000000).optional().default(20000),
    currency: z.string().max(10).optional().default('USD'),
    vibe: z.string().max(200).optional().default('Festive'),
    budgetItems: z
      .array(
        z.object({
          id: z.string().max(100).optional(),
          category: z.string().max(100).optional(),
          name: z.string().max(150).catch('Expense'),
          estimatedCost: z.number().nonnegative().max(1000000000).optional().default(0),
          actualCost: z.number().nonnegative().max(1000000000).optional().default(0),
          paid: z.boolean().optional().default(false),
          notes: z.string().max(500).optional().default(''),
        })
      )
      .max(100)
      .optional()
      .default([]),
    timeline: z
      .array(
        z.object({
          id: z.string().max(100).optional(),
          title: z.string().max(150).catch('Milestone'),
          phase: z.string().max(50).optional(),
          targetDate: z.string().max(100).optional(),
          dayOfTime: z.string().max(50).optional(),
          completed: z.boolean().optional().default(false),
          priority: z.string().max(50).optional().default('medium'),
          assignee: z.string().max(100).optional().default('Host'),
          notes: z.string().max(500).optional().default(''),
        })
      )
      .max(100)
      .optional()
      .default([]),
    vendors: z
      .array(
        z.object({
          id: z.string().max(100).optional(),
          category: z.string().max(100).catch('Service'),
          name: z.string().max(150).catch('Vendor Partner'),
          contactPerson: z.string().max(100).optional().default('Coordinator'),
          status: z.string().max(50).optional().default('researching'),
          quoteAmount: z.number().nonnegative().max(1000000000).optional().default(0),
          depositPaid: z.number().nonnegative().max(1000000000).optional().default(0),
          notes: z.string().max(500).optional().default(''),
          checklist: z.array(z.string().max(200)).max(30).optional().default([]),
        })
      )
      .max(50)
      .optional()
      .default([]),
    guests: z
      .array(
        z.object({
          id: z.string().max(100).optional(),
          name: z.string().max(150).catch('Guest'),
          group: z.string().max(50).optional().default('General'),
          rsvpStatus: z.string().max(50).optional().default('pending'),
          plusOne: z.boolean().optional().default(false),
          table: z.string().max(50).optional(),
          dietary: z.string().max(200).optional(),
        })
      )
      .max(1000)
      .optional()
      .default([]),
  })
  .passthrough();

export type UntrustedPlanInput = z.infer<typeof UntrustedPlanInputSchema>;

export const ChatAssistantRequestSchema = z.object({
  messages: z.array(ChatMessageInputSchema).max(20),
  currentPlan: UntrustedPlanInputSchema.optional(),
});

export type ChatAssistantRequest = z.infer<typeof ChatAssistantRequestSchema>;

export const BudgetItemZod = z.object({
  id: z.string().optional(),
  category: z.enum(VALID_BUDGET_CATEGORIES).catch('Logistics & Tech'),
  name: z.string().min(1).catch('General Expense'),
  estimatedCost: z.number().nonnegative().catch(500),
  actualCost: z.number().optional().default(0),
  paid: z.boolean().optional().default(false),
  notes: z.string().optional().default(''),
});

export const TimelineTaskZod = z.object({
  id: z.string().optional(),
  title: z.string().min(1).catch('Milestone'),
  phase: z.enum(['12-6_months', '6-3_months', '3-1_months', 'final_weeks', 'day_of']).catch('final_weeks'),
  targetDate: z.string().optional(),
  dayOfTime: z.string().optional(),
  completed: z.boolean().optional().default(false),
  priority: z.enum(['high', 'medium', 'low']).catch('medium'),
  assignee: z.string().optional().default('Host'),
  notes: z.string().optional().default(''),
});

export const VendorItemZod = z.object({
  id: z.string().optional(),
  category: z.string().min(1).catch('Service'),
  name: z.string().min(1).catch('Vendor Partner'),
  contactPerson: z.string().optional().default('Coordinator'),
  status: z.enum(['researching', 'contacted', 'quoted', 'booked', 'paid']).catch('researching'),
  quoteAmount: z.number().nonnegative().catch(0),
  depositPaid: z.number().optional().default(0),
  notes: z.string().optional().default(''),
  checklist: z.array(z.string()).optional().default([]),
});

export const ColorSwatchZod = z.object({
  name: z.string().catch('Accent'),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).catch('#8FBC8F'),
});

export const EventIdeasZod = z.object({
  themeName: z.string().catch('Celebration Concept'),
  themeDescription: z.string().catch('A tailored aesthetic atmosphere.'),
  colorPalette: z.array(ColorSwatchZod).catch([]),
  uniqueActivities: z
    .array(
      z.object({
        title: z.string().catch('Activity'),
        description: z.string().catch('Interactive moment for guests.'),
      })
    )
    .catch([]),
  signatureFoodAndDrink: z
    .array(
      z.object({
        name: z.string().catch('Specialty Drink'),
        type: z.enum(['drink', 'food', 'dessert']).catch('drink'),
        description: z.string().catch('Signature menu choice.'),
      })
    )
    .catch([]),
  decorVibes: z
    .array(
      z.object({
        title: z.string().catch('Decor Styling'),
        tips: z.string().catch('Atmospheric visual cue.'),
      })
    )
    .catch([]),
  musicAndVibeTips: z.array(z.string()).catch([]),
  favorsAndGifts: z.array(z.string()).catch([]),
});

export const EventPlanZod = z.object({
  title: z.string().optional(),
  type: z.enum(['wedding', 'birthday', 'community', 'custom']).optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  guestCount: z.number().positive().optional(),
  totalBudget: z.number().positive().optional(),
  currency: z.enum(ALLOWED_CURRENCIES).optional(),
  vibe: z.string().optional(),
  colorPalette: z.array(ColorSwatchZod).optional(),
  budgetItems: z.array(BudgetItemZod).min(1),
  timeline: z.array(TimelineTaskZod).min(1),
  vendors: z.array(VendorItemZod).optional().default([]),
  ideas: EventIdeasZod.optional(),
});
