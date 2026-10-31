import { EventPlan, EventType, CurrencyCode, TimelineTask, TimelinePhase, BudgetItem, VendorItem, EventIdeas, GuestItem } from '../../types/event';
import { normalizeBudgetItems, getValidPhases } from '../../utils/eventCalculations';

export interface VendorNegotiateResponse {
  inquiryEmail: string;
  negotiationPitch: string;
  questionsToCheck: string[];
}

/**
 * Procedural high-fidelity plan generator used when AI is offline or unavailable
 */
export function generateFallbackPlan(
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
  const validPhases = getValidPhases(date);
  const eventDateObj = new Date(date + 'T00:00:00');

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

  const rawBudgetItems: BudgetItem[] = [
    { id: 'b1', category: 'Venue', name: 'Primary Venue Space Rental', estimatedCost: Math.round(totalBudget * 0.32), actualCost: 0, paid: false, notes: 'Includes tables, chairs, staging' },
    { id: 'b2', category: 'Catering & Bar', name: 'Food Stations & Beverage Package', estimatedCost: Math.round(totalBudget * 0.35), actualCost: 0, paid: false, notes: `${guestCount} guests catered` },
    { id: 'b3', category: 'Photo & Video', name: 'Professional Photographer & Content Creator', estimatedCost: Math.round(totalBudget * 0.12), actualCost: 0, paid: false, notes: 'Coverage, edits, high-res gallery' },
    { id: 'b4', category: 'Music & Entertainment', name: 'DJ Sound System & Live Performer', estimatedCost: Math.round(totalBudget * 0.08), actualCost: 0, paid: false, notes: 'Wireless mics, lighting rigs' },
    { id: 'b5', category: 'Decor & Florals', name: 'Atmospheric Styling & Centerpieces', estimatedCost: Math.round(totalBudget * 0.06), actualCost: 0, paid: false, notes: 'Focal photo backdrop and tables' },
    { id: 'b6', category: 'Favors & Gifts', name: 'Personalized Keepsakes', estimatedCost: Math.round(totalBudget * 0.03), actualCost: 0, paid: false, notes: 'Handcrafted custom favors' },
    { id: 'b7', category: 'Emergency Buffer', name: 'Contingency & Incidentals Fund', estimatedCost: Math.round(totalBudget * 0.04), actualCost: 0, paid: false, notes: 'Reserved for last-minute needs' },
  ];

  const budgetItems = normalizeBudgetItems(rawBudgetItems, totalBudget);

  const computeTargetDate = (phase: TimelinePhase): string => {
    const daysBefore = phase === '12-6_months' ? 240
      : phase === '6-3_months' ? 120
      : phase === '3-1_months' ? 45
      : phase === 'final_weeks' ? 10
      : 0;
    const target = new Date(eventDateObj.getTime() - daysBefore * 24 * 60 * 60 * 1000);
    return target.toISOString().split('T')[0];
  };

  const candidateTimeline: TimelineTask[] = [
    { id: 't1', title: 'Lock venue agreement and secure date deposit', phase: '12-6_months', targetDate: computeTargetDate('12-6_months'), completed: false, priority: 'high', notes: 'Capacity verified' },
    { id: 't2', title: 'Curate caterer menu tasting and signature cocktail selection', phase: '6-3_months', targetDate: computeTargetDate('6-3_months'), completed: false, priority: 'high' },
    { id: 't3', title: 'Distribute digital save-the-dates and launch RSVP tracker', phase: '6-3_months', targetDate: computeTargetDate('6-3_months'), completed: false, priority: 'medium' },
    { id: 't4', title: 'Book sound, lighting, and DJ playlist preferences', phase: '3-1_months', targetDate: computeTargetDate('3-1_months'), completed: false, priority: 'medium' },
    { id: 't5', title: 'Finalize headcount, dietary accommodations & floor layout', phase: 'final_weeks', targetDate: computeTargetDate('final_weeks'), completed: false, priority: 'high' },
    { id: 't6', title: 'Pack day-of emergency kit, vendor checks & tip envelopes', phase: 'final_weeks', targetDate: computeTargetDate('final_weeks'), completed: false, priority: 'high' },
    { id: 't7', title: 'Vendor access and setup begins', phase: 'day_of', targetDate: date, dayOfTime: '10:00 AM', completed: false, priority: 'high', assignee: 'Coordinator' },
    { id: 't8', title: 'Audio soundcheck & lighting ambience check', phase: 'day_of', targetDate: date, dayOfTime: '01:00 PM', completed: false, priority: 'medium', assignee: 'Sound Tech' },
    { id: 't9', title: 'Guest arrival & welcome reception drinks', phase: 'day_of', targetDate: date, dayOfTime: '03:00 PM', completed: false, priority: 'high', assignee: 'Hospitality Team' },
    { id: 't10', title: 'Main event kickoff & keynote celebration program', phase: 'day_of', targetDate: date, dayOfTime: '04:00 PM', completed: false, priority: 'high', assignee: 'Host / MC' },
    { id: 't11', title: 'Dinner service / food stations open', phase: 'day_of', targetDate: date, dayOfTime: '05:30 PM', completed: false, priority: 'high', assignee: 'Catering Lead' },
    { id: 't12', title: 'Party dance floor, dessert bar & photo moments', phase: 'day_of', targetDate: date, dayOfTime: '07:30 PM', completed: false, priority: 'low', assignee: 'DJ' },
    { id: 't13', title: 'Grand finale celebration & sparkler send-off', phase: 'day_of', targetDate: date, dayOfTime: '10:00 PM', completed: false, priority: 'medium', assignee: 'All' },
  ];

  const timeline = candidateTimeline.filter((t) => validPhases.includes(t.phase));

  const vendors: VendorItem[] = [
    {
      id: 'v1',
      category: 'Venue',
      name: 'Grand Horizon Space',
      contactPerson: 'Alex Taylor',
      status: 'researching',
      quoteAmount: Math.round(totalBudget * 0.32),
      depositPaid: 0,
      checklist: ['Permit verified', 'Insurance uploaded', 'Tear down curfew checked'],
    },
    {
      id: 'v2',
      category: 'Catering',
      name: 'Artisan Feast Co.',
      contactPerson: 'Chef Maria Rossi',
      status: 'researching',
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
      status: 'researching',
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

/**
 * Procedural fallback for vendor negotiation
 */
export function generateFallbackNegotiation(
  eventTitle: string,
  vendorCategory: string,
  vendorName: string,
  eventType: string,
  date: string,
  currency: string,
  quoteAmount: number,
  targetBudget: number
): VendorNegotiateResponse {
  return {
    inquiryEmail: `Subject: Inquiry for ${eventTitle} - ${vendorCategory} Services\n\nDear ${vendorName} Team,\n\nWe love your work and would love to check your availability for our upcoming ${eventType}, "${eventTitle}".\n\nEvent Details:\n- Date: ${date}\n- Services Needed: ${vendorCategory}\n\nCould you please share your package options, rate sheet, and what is included in standard setup/tear-down?\n\nWarm regards,\nEvent Planning Team`,
    negotiationPitch: `Subject: Follow-up & Package Alignment - ${eventTitle}\n\nHi ${vendorName},\n\nThank you for sharing your comprehensive proposal of ${currency} ${quoteAmount}. Your portfolio is our top choice!\n\nWe have a strictly allocated budget of ${currency} ${targetBudget} for ${vendorCategory}. We would love to move forward with you if we can find a creative way to align—perhaps by adjusting service hours, streamlining deliverables, or including an early-booking courtesy. Could we schedule a 5-minute call to finalize terms?\n\nThank you for your flexibility!\nWarm regards`,
    questionsToCheck: [
      `What is your policy and timeline on date rescheduling or force majeure?`,
      `Are all travel, overtime, and equipment breakdown fees included in this estimate?`,
      `Do you carry comprehensive commercial general liability insurance?`,
      `Who will be our primary point of contact on-site the day of the event?`,
      `What is the exact payment schedule and deposit milestone breakdown?`,
    ],
  };
}
