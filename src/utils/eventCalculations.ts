import { BudgetItem, TimelineTask, GuestItem, CurrencyCode, TimelinePhase, EventPlan, EventType } from '../types/event';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
};

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export interface BudgetSummary {
  totalBudget: number;
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  remainingBudget: number;
  isOverBudget: boolean;
  percentSpent: number;
  byCategory: Record<string, { estimated: number; actual: number; count: number }>;
}

export function calculateBudgetSummary(items: BudgetItem[], totalBudget: number): BudgetSummary {
  let totalEstimated = 0;
  let totalActual = 0;
  let totalPaid = 0;
  const byCategory: Record<string, { estimated: number; actual: number; count: number }> = {};

  for (const item of items) {
    totalEstimated += item.estimatedCost || 0;
    const actual = item.actualCost > 0 ? item.actualCost : item.estimatedCost;
    totalActual += item.actualCost || 0;
    if (item.paid) {
      totalPaid += (item.actualCost > 0 ? item.actualCost : item.estimatedCost);
    }

    if (!byCategory[item.category]) {
      byCategory[item.category] = { estimated: 0, actual: 0, count: 0 };
    }
    byCategory[item.category].estimated += item.estimatedCost;
    byCategory[item.category].actual += item.actualCost;
    byCategory[item.category].count += 1;
  }

  const effectiveSpent = totalActual > 0 ? totalActual : totalEstimated;
  const remainingBudget = totalBudget - effectiveSpent;
  const percentSpent = totalBudget > 0 ? Math.min(100, Math.round((effectiveSpent / totalBudget) * 100)) : 0;

  return {
    totalBudget,
    totalEstimated,
    totalActual,
    totalPaid,
    remainingBudget,
    isOverBudget: remainingBudget < 0,
    percentSpent,
    byCategory,
  };
}

export interface ProgressSummary {
  total: number;
  completed: number;
  percent: number;
  urgentPending: number;
}

export function calculateProgress(tasks: TimelineTask[]): ProgressSummary {
  if (tasks.length === 0) {
    return { total: 0, completed: 0, percent: 0, urgentPending: 0 };
  }
  const completed = tasks.filter(t => t.completed).length;
  const urgentPending = tasks.filter(t => !t.completed && t.priority === 'high').length;
  const percent = Math.round((completed / tasks.length) * 100);

  return {
    total: tasks.length,
    completed,
    percent,
    urgentPending,
  };
}

export interface GuestStats {
  total: number;
  attending: number;
  declined: number;
  pending: number;
  totalWithPlusOnes: number;
  dietaryCounts: Record<string, number>;
}

export function calculateGuestStats(guests: GuestItem[]): GuestStats {
  let attending = 0;
  let declined = 0;
  let pending = 0;
  let totalWithPlusOnes = 0;
  const dietaryCounts: Record<string, number> = {};

  for (const g of guests) {
    if (g.rsvpStatus === 'attending') {
      attending += 1;
      totalWithPlusOnes += g.plusOne ? 2 : 1;
    } else if (g.rsvpStatus === 'declined') {
      declined += 1;
    } else {
      pending += 1;
    }

    if (g.dietary && g.dietary.trim() !== '') {
      const diet = g.dietary.trim();
      dietaryCounts[diet] = (dietaryCounts[diet] || 0) + (g.rsvpStatus === 'attending' ? (g.plusOne ? 2 : 1) : 1);
    }
  }

  return {
    total: guests.length,
    attending,
    declined,
    pending,
    totalWithPlusOnes,
    dietaryCounts,
  };
}

export function getPhaseLabel(phase: TimelinePhase): string {
  switch (phase) {
    case '12-6_months':
      return '12 to 6 Months Before';
    case '6-3_months':
      return '6 to 3 Months Before';
    case '3-1_months':
      return '3 to 1 Month Before';
    case 'final_weeks':
      return 'Final 2-4 Weeks Before';
    case 'day_of':
      return 'Day-Of Run of Show (Schedule)';
  }
}

export function normalizeBudgetItems(items: BudgetItem[], targetTotal: number): BudgetItem[] {
  if (items.length === 0 || targetTotal <= 0) return items;
  const currentTotal = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  if (currentTotal === 0) {
    const split = Math.floor(targetTotal / items.length);
    const remainder = targetTotal - split * items.length;
    return items.map((item, idx) => ({
      ...item,
      estimatedCost: split + (idx === items.length - 1 ? remainder : 0),
    }));
  }

  let runningSum = 0;
  return items.map((item, idx) => {
    if (idx === items.length - 1) {
      const lastCost = Math.max(0, targetTotal - runningSum);
      return { ...item, estimatedCost: lastCost };
    }
    const proportional = Math.round((item.estimatedCost / currentTotal) * targetTotal);
    runningSum += proportional;
    return { ...item, estimatedCost: proportional };
  });
}

export function getValidPhases(eventDateStr: string, fromDate: Date = new Date()): TimelinePhase[] {
  const eventDate = new Date(eventDateStr + 'T00:00:00');
  const diffDays = Math.ceil((eventDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

  const valid: TimelinePhase[] = ['day_of'];
  if (diffDays >= 7) {
    valid.unshift('final_weeks');
  }
  if (diffDays >= 30) {
    valid.unshift('3-1_months');
  }
  if (diffDays >= 90) {
    valid.unshift('6-3_months');
  }
  if (diffDays >= 180) {
    valid.unshift('12-6_months');
  }
  return valid;
}

export function getSampleWeddingPlan(): EventPlan {
  return {
    id: 'sample-wedding-1',
    title: 'Aria & Liam’s Modern Botanical Wedding',
    type: 'wedding',
    date: '2026-11-20',
    location: 'The Glasshouse Pavilion, San Francisco, CA',
    guestCount: 140,
    totalBudget: 35000,
    currency: 'USD',
    vibe: 'Romantic, Organic Modern, Warm Candlelight & Eucalyptus Greens',
    colorPalette: [
      { name: 'Sage Green', hex: '#8FBC8F' },
      { name: 'Champagne Gold', hex: '#EEDC82' },
      { name: 'Warm Terracotta', hex: '#E07A5F' },
      { name: 'Cream Ivory', hex: '#FDFBF7' },
      { name: 'Deep Forest', hex: '#2D4A3E' },
    ],
    budgetItems: [
      { id: 'b1', category: 'Venue', name: 'Glasshouse Ceremony & Reception Hall', estimatedCost: 11000, actualCost: 10500, paid: true, notes: 'Includes tables, chairs, and security deposit' },
      { id: 'b2', category: 'Catering & Bar', name: 'Farm-to-Table 3-Course Plated Dinner & Open Bar', estimatedCost: 12500, actualCost: 12200, paid: false, notes: '$85/guest + $20/guest cocktail package' },
      { id: 'b3', category: 'Photo & Video', name: 'Full-day Photography & Cinematic Drone Video', estimatedCost: 4200, actualCost: 4000, paid: true, notes: 'Includes engagement shoot and raw footage' },
      { id: 'b4', category: 'Decor & Florals', name: 'Floral Arch, Floating Candle Centerpieces, Bouquets', estimatedCost: 3500, actualCost: 3300, paid: false, notes: 'White roses, eucalyptus garlands, olive branches' },
      { id: 'b5', category: 'Music & Entertainment', name: 'Live Acoustic Duo for Ceremony + DJ for Reception', estimatedCost: 2200, actualCost: 2200, paid: true, notes: 'Custom first dance edit included' },
      { id: 'b6', category: 'Attire & Beauty', name: 'Gown Alterations, Tux Rental, Bridal Hair & Makeup', estimatedCost: 1800, actualCost: 1650, paid: false, notes: 'Trial session completed' },
      { id: 'b7', category: 'Favors & Gifts', name: 'Artisan Olive Oil Bottles with Custom Name Tags', estimatedCost: 650, actualCost: 580, paid: false, notes: '140 units ordered from local organic farm' },
      { id: 'b8', category: 'Emergency Buffer', name: 'Weather Backup & Last-Minute Gratuities', estimatedCost: 1500, actualCost: 0, paid: false, notes: 'Reserved for unexpected extras' },
    ],
    timeline: [
      { id: 't1', title: 'Lock venue date and sign rental contract', phase: '12-6_months', targetDate: '2026-04-15', completed: true, priority: 'high', notes: 'Deposit paid' },
      { id: 't2', title: 'Book primary photographer and videographer', phase: '12-6_months', targetDate: '2026-05-10', completed: true, priority: 'high' },
      { id: 't3', title: 'Draft preliminary guest list and budget ceiling', phase: '12-6_months', targetDate: '2026-05-25', completed: true, priority: 'medium' },
      { id: 't4', title: 'Conduct menu tasting and select signature cocktails', phase: '6-3_months', targetDate: '2026-08-01', completed: true, priority: 'medium' },
      { id: 't5', title: 'Send formal wedding invitations with RSVP link', phase: '6-3_months', targetDate: '2026-08-20', completed: true, priority: 'high' },
      { id: 't6', title: 'Finalize florist floral mockups and table settings', phase: '6-3_months', targetDate: '2026-09-15', completed: true, priority: 'low' },
      { id: 't7', title: 'Confirm final headcount with caterer and seating chart', phase: '3-1_months', targetDate: '2026-10-25', completed: false, priority: 'high' },
      { id: 't8', title: 'DJ playlist meeting (must-play and do-not-play lists)', phase: '3-1_months', targetDate: '2026-11-02', completed: false, priority: 'medium' },
      { id: 't9', title: 'Rehearsal dinner walk-through with wedding party', phase: 'final_weeks', targetDate: '2026-11-19', completed: false, priority: 'high' },
      { id: 't10', title: 'Prepare vendor tip envelopes in labeled pouches', phase: 'final_weeks', targetDate: '2026-11-18', completed: false, priority: 'medium' },
      { id: 't11', title: 'Bridal party hair & makeup session starts', phase: 'day_of', dayOfTime: '08:30 AM', completed: false, priority: 'high', assignee: 'Bridal Suite' },
      { id: 't12', title: 'Photographer arrives for detail shots & getting-ready', phase: 'day_of', dayOfTime: '11:00 AM', completed: false, priority: 'high', assignee: 'Liam / Lead Photo' },
      { id: 't13', title: 'First Look in the botanical garden', phase: 'day_of', dayOfTime: '01:30 PM', completed: false, priority: 'medium', assignee: 'Coordinator' },
      { id: 't14', title: 'Guests arrive & welcome acoustic music starts', phase: 'day_of', dayOfTime: '03:30 PM', completed: false, priority: 'high', assignee: 'Ushers' },
      { id: 't15', title: 'Wedding Ceremony Begins', phase: 'day_of', dayOfTime: '04:00 PM', completed: false, priority: 'high', assignee: 'Officiant' },
      { id: 't16', title: 'Cocktail Hour & Passed Hors d’Oeuvres', phase: 'day_of', dayOfTime: '04:45 PM', completed: false, priority: 'medium', assignee: 'Catering Lead' },
      { id: 't17', title: 'Grand Entrance & First Dance', phase: 'day_of', dayOfTime: '06:00 PM', completed: false, priority: 'high', assignee: 'DJ & MC' },
      { id: 't18', title: 'Plated Dinner & Speeches', phase: 'day_of', dayOfTime: '06:30 PM', completed: false, priority: 'medium', assignee: 'Maid of Honor / Best Man' },
      { id: 't19', title: 'Dance Floor opens & Dessert Station', phase: 'day_of', dayOfTime: '08:00 PM', completed: false, priority: 'low', assignee: 'DJ' },
      { id: 't20', title: 'Sparkler Grand Exit', phase: 'day_of', dayOfTime: '10:30 PM', completed: false, priority: 'high', assignee: 'Coordinator' },
    ],
    vendors: [
      {
        id: 'v1',
        category: 'Venue',
        name: 'The Glasshouse Pavilion',
        contactPerson: 'Elena Vance',
        email: 'events@glasshousepavilion.com',
        phone: '(415) 882-9011',
        status: 'booked',
        quoteAmount: 10500,
        depositPaid: 5000,
        notes: 'Access permitted at 10 AM on event day for vendor load-in.',
        checklist: ['Signed agreement on file', 'Sound ordinance review', 'Insurance certificate submitted'],
      },
      {
        id: 'v2',
        category: 'Catering',
        name: 'Heirloom Culinary Collective',
        contactPerson: 'Chef Marcus Ray',
        email: 'marcus@heirloomcatering.co',
        phone: '(415) 441-2090',
        status: 'booked',
        quoteAmount: 12200,
        depositPaid: 3500,
        notes: 'Includes 6 passed appetizers, plated dual entree (halibut / braised short rib) and vegan risotto.',
        checklist: ['Final head count due 10 days prior', 'Bar liquor license verified', 'Cake cutting fee waived'],
      },
      {
        id: 'v3',
        category: 'Photography',
        name: 'Luminary Visuals Co.',
        contactPerson: 'Sophia Chen',
        email: 'sophia@luminaryvisuals.com',
        phone: '(510) 902-3118',
        status: 'booked',
        quoteAmount: 4000,
        depositPaid: 4000,
        notes: '10 hours coverage, second shooter included, online gallery delivery in 4 weeks.',
        checklist: ['Shot list sent', 'Sunset golden hour time marked for 5:15 PM', 'Paid in full'],
      },
      {
        id: 'v4',
        category: 'DJ & Sound',
        name: 'Soundwave Collective',
        contactPerson: 'DJ David Cruz',
        email: 'david@soundwaveca.com',
        phone: '(415) 301-4478',
        status: 'booked',
        quoteAmount: 2200,
        depositPaid: 1000,
        notes: 'Brings wireless lapel mic for officiant and battery speakers for outdoor courtyard.',
        checklist: ['Spotify playlist shared', 'No line dances rule requested', 'Equipment setup time confirmed for 1:00 PM'],
      },
      {
        id: 'v5',
        category: 'Florist',
        name: 'Botanica Atelier',
        contactPerson: 'Claire Duprès',
        email: 'hello@botanicaatelier.com',
        phone: '(415) 779-1120',
        status: 'quoted',
        quoteAmount: 3300,
        depositPaid: 0,
        notes: 'Awaiting revised proposal with seasonal white ranunculus and lush foliage.',
        checklist: ['Review floral arch dimensions', 'Decide on bridesmaid bouquet sizes', 'Request candle rental discount'],
      },
    ],
    ideas: {
      themeName: 'Modern Botanical Elegance',
      themeDescription: 'A blend of crisp architectural lines and lush garden foliage, illuminated by hundreds of floating pillar candles and warm amber glow.',
      colorPalette: [
        { name: 'Sage Green', hex: '#8FBC8F' },
        { name: 'Champagne Gold', hex: '#EEDC82' },
        { name: 'Warm Terracotta', hex: '#E07A5F' },
        { name: 'Cream Ivory', hex: '#FDFBF7' },
        { name: 'Deep Forest', hex: '#2D4A3E' },
      ],
      uniqueActivities: [
        { title: 'Audio Guestbook in a Vintage Rotary Telephone', description: 'Guests pick up an antique cream rotary phone to record heartfelt spoken voice messages and memories.' },
        { title: 'Live Watercolor Guest Portraits', description: 'An artist paints miniature 5-minute whimsical watercolor portraits of guests as an unforgettable keepsake.' },
        { title: 'Late-Night Gourmet Pretzel & Cider Bar', description: 'Warm Bavarian soft pretzels with artisanal beer cheeses and spiced warm cider handed out at 9:30 PM.' },
      ],
      signatureFoodAndDrink: [
        { name: 'The Rosemary Whisper', type: 'drink', description: 'Botanical gin, freshly pressed grapefruit juice, elderflower liqueur, topped with a torched sprig of garden rosemary.' },
        { name: 'Fig & Honey Old Fashioned', type: 'drink', description: 'Bourbon infused with mission figs, clover honey syrup, angostura bitters, orange peel.' },
        { name: 'Mini Brioche Truffle Grilled Cheeses', type: 'food', description: 'Passed hors d’oeuvre paired with petite shooters of roasted San Marzano tomato bisque.' },
        { name: 'Earl Grey Lavender Mille-Feuille', type: 'dessert', description: 'Crisp caramelized puff pastry layered with fragrant tea cream and honeycomb crunch.' },
      ],
      decorVibes: [
        { title: 'Hanging Greenery Chandeliers', tips: 'Suspend Italian ruscus and smilax vines from the venue wooden beams to bring the garden canopy indoors.' },
        { title: 'Taper Candle Table Runners', tips: 'Mix ribbed amber glass candleholders of varying heights with ribbed ivory tapers for organic dimension.' },
        { title: 'Calligraphed Linen Welcome Tapestry', tips: 'A lightweight oatmeal linen banner with handwritten gold calligraphy welcoming guests at the entrance.' },
      ],
      musicAndVibeTips: [
        'Ceremony processional: Acoustic fingerstyle guitar cover of "Beyond" by Leon Bridges.',
        'Cocktail hour: Upbeat retro soul, French jazz, and chill bossa nova.',
        'Reception transition: Build tempo smoothly from Motown classics to modern indie pop and 2000s singalongs.',
      ],
      favorsAndGifts: [
        'Miniature glass flasks of infused rosemary olive oil with calligraphed thank you tags.',
        'Custom wildflower seed packets titled "Let Love Grow".',
        'Hand-poured travel tin soy candles scented with cedar and sweet fig.',
      ],
    },
    guests: [
      { id: 'g1', name: 'Sophia Miller', group: 'Family', rsvpStatus: 'attending', plusOne: true, dietary: 'Vegetarian', table: 'Table 1 - Head Table' },
      { id: 'g2', name: 'Ethan Miller', group: 'Family', rsvpStatus: 'attending', plusOne: false, dietary: 'None', table: 'Table 1 - Head Table' },
      { id: 'g3', name: 'Dr. Rahul Patel', group: 'Friends', rsvpStatus: 'attending', plusOne: true, dietary: 'Vegan', table: 'Table 2 - College Crew' },
      { id: 'g4', name: 'Maya Lin', group: 'Friends', rsvpStatus: 'attending', plusOne: false, dietary: 'Gluten-Free', table: 'Table 2 - College Crew' },
      { id: 'g5', name: 'Uncle Robert Sterling', group: 'Family', rsvpStatus: 'declined', plusOne: false, dietary: '', table: '' },
      { id: 'g6', name: 'Chloe Davenport', group: 'Colleagues', rsvpStatus: 'pending', plusOne: true, dietary: '', table: 'Table 3 - Tech Tribe' },
      { id: 'g7', name: 'Marcus Brody', group: 'VIP', rsvpStatus: 'attending', plusOne: true, dietary: 'Nut Allergy', table: 'Table 4 - Mentors' },
    ],
  };
}

export function getSampleBirthdayPlan(): EventPlan {
  return {
    id: 'sample-birthday-1',
    title: 'Neon Retro Arcade: Leo’s Milestone 30th Birthday',
    type: 'birthday',
    date: '2026-11-14',
    location: 'Upstairs Loft & Game Bar, Austin, TX',
    guestCount: 65,
    totalBudget: 6500,
    currency: 'USD',
    vibe: '80s Synthwave, Neon Glow, Cyberpunk Arcade & Craft Cocktails',
    colorPalette: [
      { name: 'Electric Cyan', hex: '#00F0FF' },
      { name: 'Neon Magenta', hex: '#FF007F' },
      { name: 'Arcade Purple', hex: '#7928CA' },
      { name: 'Obsidian Black', hex: '#111827' },
      { name: 'Glow Yellow', hex: '#FFE600' },
    ],
    budgetItems: [
      { id: 'bb1', category: 'Venue', name: 'Retro Loft Private Rental (6 hours)', estimatedCost: 1800, actualCost: 1750, paid: true, notes: 'Includes arcade machines on free-play mode' },
      { id: 'bb2', category: 'Catering & Bar', name: 'Gourmet Slider Bar, Truffle Fries & Craft Kegs', estimatedCost: 2200, actualCost: 2100, paid: false, notes: 'Pre-ordered 150 sliders + vegan jackfruit options' },
      { id: 'bb3', category: 'Music & Entertainment', name: 'Synthwave DJ & Chiptune Remix Performer', estimatedCost: 800, actualCost: 800, paid: true, notes: 'Includes laser light package' },
      { id: 'bb4', category: 'Decor & Florals', name: 'Custom Neon Sign ("Level 30 Unlocked") & Glow Sticks', estimatedCost: 600, actualCost: 550, paid: true, notes: 'Sign doubles as living room wall art after the party' },
      { id: 'bb5', category: 'Favors & Gifts', name: 'Custom Pixel Art Enamel Pins & Retro Candy Pouches', estimatedCost: 350, actualCost: 320, paid: false, notes: 'Ring Pops, Pop Rocks, custom 8-bit packaging' },
      { id: 'bb6', category: 'Photo & Video', name: 'Roaming Polaroids + LED Photobooth with GIF Printer', estimatedCost: 750, actualCost: 700, paid: false, notes: 'Unlimited guest prints' },
    ],
    timeline: [
      { id: 'bt1', title: 'Confirm loft venue and free-play arcade game list', phase: '6-3_months', targetDate: '2026-08-15', completed: true, priority: 'high' },
      { id: 'bt2', title: 'Commission custom neon acrylic sign', phase: '3-1_months', targetDate: '2026-09-20', completed: true, priority: 'medium' },
      { id: 'bt3', title: 'Send digital animated pixel art invitations', phase: '3-1_months', targetDate: '2026-10-01', completed: true, priority: 'high' },
      { id: 'bt4', title: 'Finalize slider menu choices and signature drink recipes', phase: 'final_weeks', targetDate: '2026-10-28', completed: false, priority: 'medium' },
      { id: 'bt5', title: 'Curate high-energy synthwave & 90s dance pre-game playlist', phase: 'final_weeks', targetDate: '2026-11-05', completed: false, priority: 'low' },
      { id: 'bt6', title: 'Venue access for neon lighting setup and soundcheck', phase: 'day_of', dayOfTime: '05:00 PM', completed: false, priority: 'high', assignee: 'Host / DJ' },
      { id: 'bt7', title: 'Doors open & Welcome cocktails served', phase: 'day_of', dayOfTime: '07:00 PM', completed: false, priority: 'high', assignee: 'Bartender' },
      { id: 'bt8', title: 'Smash Bros / Mario Kart Tournament Begins', phase: 'day_of', dayOfTime: '08:30 PM', completed: false, priority: 'medium', assignee: 'Tournament MC' },
      { id: 'bt9', title: 'Birthday Toast & Giant Pixel Cake Cutting', phase: 'day_of', dayOfTime: '10:00 PM', completed: false, priority: 'high', assignee: 'All' },
      { id: 'bt10', title: 'Neon Dance Party & Arcade Finale', phase: 'day_of', dayOfTime: '10:30 PM', completed: false, priority: 'low', assignee: 'DJ' },
    ],
    vendors: [
      {
        id: 'bv1',
        category: 'Venue',
        name: 'The Pixel Loft & Arcade',
        contactPerson: 'Zack Morales',
        email: 'zack@pixelloftaustin.com',
        phone: '(512) 555-0199',
        status: 'booked',
        quoteAmount: 1750,
        depositPaid: 1750,
        notes: 'Unlimited Pac-Man, Galaga, Time Crisis 2, and Street Fighter II.',
        checklist: ['Sound check permit approved', 'BYOB rules checked'],
      },
      {
        id: 'bv2',
        category: 'Catering',
        name: 'Atomic Slider Kitchen',
        contactPerson: 'Chef Samira K.',
        email: 'events@atomicsliders.com',
        phone: '(512) 555-8821',
        status: 'booked',
        quoteAmount: 2100,
        depositPaid: 700,
        notes: 'Wagyu smash sliders, Nashville hot chicken, crispy loaded tots, vegan sliders.',
        checklist: ['Setup hot warmers at 6:30 PM', 'Provide allergen signage'],
      },
      {
        id: 'bv3',
        category: 'Signage & Decor',
        name: 'GlowCraft Studio',
        contactPerson: 'Nina Vance',
        email: 'orders@glowcraft.studio',
        phone: '(512) 555-3312',
        status: 'booked',
        quoteAmount: 550,
        depositPaid: 550,
        notes: '"Level 30 Unlocked" LED neon sign with dimmer controller and hanging chain.',
        checklist: ['Shipped and inspected', 'Tested with wall plug'],
      },
    ],
    ideas: {
      themeName: 'Level 30 Unlocked: Cyber Retro Arcade',
      themeDescription: 'High-octane nostalgic celebration channeling the electric energy of 1980s retro arcades, synthwave beats, glow accents, and competitive party games.',
      colorPalette: [
        { name: 'Electric Cyan', hex: '#00F0FF' },
        { name: 'Neon Magenta', hex: '#FF007F' },
        { name: 'Arcade Purple', hex: '#7928CA' },
        { name: 'Obsidian Black', hex: '#111827' },
        { name: 'Glow Yellow', hex: '#FFE600' },
      ],
      uniqueActivities: [
        { title: 'Mario Kart 64 High Score Bracket', description: 'Projected on a giant brick wall with bracket chalkboard and a customized champion wrestling belt trophy.' },
        { title: 'Retro Polaroids with Neon Gel Pens', description: 'Guests snap instant film photos and write birthday wisdom using neon chalk pens on a black felt memory board.' },
        { title: 'Glow Pong & LED Foosball', description: 'Illuminated table games for casual multiplayer fun throughout the evening.' },
      ],
      signatureFoodAndDrink: [
        { name: 'The Cyberpunk Mule', type: 'drink', description: 'Vodka, blue curaçao, spicy ginger beer, and lime juice served with an edible glow stirrer.' },
        { name: 'Power-Up Punch (Mocktail available)', type: 'drink', description: 'Passionfruit, guava nectar, sparkling soda, and butterfly pea tea that shifts colors when stirred.' },
        { name: 'Loaded Arcade Waffle Tots', type: 'food', description: 'Crispy potato tots tossed in furikake, queso blanco, scallions, and chipotle aioli.' },
        { name: '8-Bit Rubik’s Cube Birthday Cake', type: 'dessert', description: 'Multi-flavor cube cake with dark chocolate fudge, salted caramel, and red velvet squares.' },
      ],
      decorVibes: [
        { title: 'Blacklight Neon Graffiti Wall', tips: 'Hang black butcher paper with UV markers where guests leave glowing birthday messages and funny doodles.' },
        { title: 'Pixel Cloud Ceiling Balloon Installation', tips: 'Organic balloon garland in electric pink, turquoise, and chrome mirror finishes suspended above the bar.' },
      ],
      musicAndVibeTips: [
        'Open with nostalgic Daft Punk, Justice, and Kavinsky synthwave.',
        'Transition into 90s/2000s hip hop and energetic millennial dance anthems after the cake toast.',
      ],
      favorsAndGifts: [
        'Custom 8-bit enamel pins celebrating Leo’s 30th birthday.',
        'Miniature retro arcade cabinet keychains with functional button clicks.',
        'Custom designed stickers and retro sour candy bundles.',
      ],
    },
    guests: [
      { id: 'bg1', name: 'Leo Martinez', group: 'VIP', rsvpStatus: 'attending', plusOne: false, dietary: 'None' },
      { id: 'bg2', name: 'Maya Lin', group: 'Friends', rsvpStatus: 'attending', plusOne: true, dietary: 'Vegetarian' },
      { id: 'bg3', name: 'Carlos Mendez', group: 'Friends', rsvpStatus: 'attending', plusOne: false, dietary: 'Gluten-Free' },
      { id: 'bg4', name: 'Tasha Vance', group: 'Friends', rsvpStatus: 'attending', plusOne: true, dietary: 'None' },
      { id: 'bg5', name: 'Jason Wu', group: 'Colleagues', rsvpStatus: 'pending', plusOne: false, dietary: '' },
    ],
  };
}

export function getSampleCommunityPlan(): EventPlan {
  return {
    id: 'sample-community-1',
    title: 'Oakwood Harvest & Culture Street Festival',
    type: 'community',
    date: '2026-11-08',
    location: 'Oakwood Downtown Plaza & Greenway, Portland, OR',
    guestCount: 850,
    totalBudget: 18000,
    currency: 'USD',
    vibe: 'Festive, Inclusive, Earthy Autumn, Local Makers & Live Acoustic Bands',
    colorPalette: [
      { name: 'Pumpkin Orange', hex: '#D95C2B' },
      { name: 'Warm Marigold', hex: '#EAA221' },
      { name: 'Olive Green', hex: '#586E37' },
      { name: 'Rich Chestnut', hex: '#5A2A18' },
      { name: 'Oatmeal Beige', hex: '#EFE7DA' },
    ],
    budgetItems: [
      { id: 'cb1', category: 'Logistics & Tech', name: 'City Street Closure Permit, Police & Waste Management', estimatedCost: 3500, actualCost: 3400, paid: true, notes: 'Approved by City Council' },
      { id: 'cb2', category: 'Venue', name: 'Mainstage Canopy, Portable Power Generators & Porta-Potties', estimatedCost: 4200, actualCost: 4000, paid: true, notes: 'Delivered Saturday morning 6:00 AM' },
      { id: 'cb3', category: 'Music & Entertainment', name: '4 Local Bands, Cultural Dance Troupe & Stage Sound Engineer', estimatedCost: 3600, actualCost: 3500, paid: false, notes: 'Stipends for performers + PA system' },
      { id: 'cb4', category: 'Decor & Florals', name: 'Hay Bales, Corn Stalks, Overhead Festoon Lighting & Banners', estimatedCost: 1800, actualCost: 1650, paid: false, notes: 'Decor donated in part by local nursery' },
      { id: 'cb5', category: 'Logistics & Tech', name: 'Community Tents, Folding Tables & Trash/Recycling Stations', estimatedCost: 2400, actualCost: 2200, paid: false, notes: '40 artisan booth spaces set up' },
      { id: 'cb6', category: 'Emergency Buffer', name: 'Contingency & First Aid Station Supplies', estimatedCost: 1500, actualCost: 500, paid: false, notes: 'St. John Ambulance volunteer coordination' },
      { id: 'cb7', category: 'Favors & Gifts', name: 'Festival Map Booklets, Reusable Tote Bags & Volunteer T-shirts', estimatedCost: 1000, actualCost: 950, paid: true, notes: 'Eco-friendly organic cotton totes' },
    ],
    timeline: [
      { id: 'ct1', title: 'Submit municipal event permit and noise variance application', phase: '12-6_months', targetDate: '2026-05-01', completed: true, priority: 'high' },
      { id: 'ct2', title: 'Launch vendor booth open call for local artisans & food trucks', phase: '6-3_months', targetDate: '2026-07-15', completed: true, priority: 'high' },
      { id: 'ct3', title: 'Book headlining indie folk band and regional cultural dancers', phase: '6-3_months', targetDate: '2026-08-10', completed: true, priority: 'medium' },
      { id: 'ct4', title: 'Recruit 35 neighborhood community volunteers', phase: '3-1_months', targetDate: '2026-09-25', completed: true, priority: 'high' },
      { id: 'ct5', title: 'Print eco tote bags and distribute promotional posters around city', phase: 'final_weeks', targetDate: '2026-10-20', completed: false, priority: 'medium' },
      { id: 'ct6', title: 'Street barrier closure and police detail in position', phase: 'day_of', dayOfTime: '06:00 AM', completed: false, priority: 'high', assignee: 'Permit Lead' },
      { id: 'ct7', title: 'Food trucks & artisan vendors load-in and health inspection check', phase: 'day_of', dayOfTime: '07:30 AM', completed: false, priority: 'high', assignee: 'Vendor Coordinator' },
      { id: 'ct8', title: 'Sound check on main stage for performers', phase: 'day_of', dayOfTime: '09:15 AM', completed: false, priority: 'medium', assignee: 'Audio Engineer' },
      { id: 'ct9', title: 'Festival opens to public & Mayor’s Welcome Speech', phase: 'day_of', dayOfTime: '10:00 AM', completed: false, priority: 'high', assignee: 'Community Board' },
      { id: 'ct10', title: 'Kids Pumpkin Painting & Scarecrow Contest', phase: 'day_of', dayOfTime: '11:30 AM', completed: false, priority: 'low', assignee: 'Youth Volunteers' },
      { id: 'ct11', title: 'Cultural Dance Performances & Acoustic Showcase', phase: 'day_of', dayOfTime: '02:00 PM', completed: false, priority: 'medium', assignee: 'Stage Manager' },
      { id: 'ct12', title: 'Festival closes, street sweep and community cleanup', phase: 'day_of', dayOfTime: '06:00 PM', completed: false, priority: 'high', assignee: 'Green Team Volunteers' },
    ],
    vendors: [
      {
        id: 'cv1',
        category: 'Audio & Staging',
        name: 'Cascade Audio Solutions',
        contactPerson: 'Dave Hensley',
        email: 'dave@cascadeaudio.org',
        phone: '(503) 555-4011',
        status: 'booked',
        quoteAmount: 3500,
        depositPaid: 1500,
        notes: 'Includes line-array speakers, 3 wireless mics, mixing engineer for 9 hours.',
        checklist: ['Sound permit approved', 'Weatherproof tarps ready'],
      },
      {
        id: 'cv2',
        category: 'Waste & Sanitation',
        name: 'GreenEarth Clean Events',
        contactPerson: 'Kelly Nguyen',
        email: 'events@greenearthclean.com',
        phone: '(503) 555-8832',
        status: 'booked',
        quoteAmount: 2200,
        depositPaid: 1000,
        notes: 'Delivering 8 clean porta-potties + 2 ADA units and 12 three-stream sorting bins.',
        checklist: ['Placement map finalized', 'Handwash stations verified'],
      },
      {
        id: 'cv3',
        category: 'Food Truck Fleet',
        name: 'Pacific Rim & Harvest Bites Association',
        contactPerson: 'Chef Hector Cruz',
        email: 'foodtrucks@oakwoodharvest.com',
        phone: '(503) 555-9118',
        status: 'booked',
        quoteAmount: 0,
        depositPaid: 0,
        notes: '6 food trucks paying $150 booth fee to community fund. Serves street tacos, cider donuts, woodfired pizza.',
        checklist: ['Health Department permits verified', 'Fire extinguisher checks passed'],
      },
    ],
    ideas: {
      themeName: 'Harvest Horizons: Roots & Rhythm',
      themeDescription: 'A multi-generational autumn gathering celebrating neighborhood artisans, local agriculture, vibrant world rhythms, and community bonding.',
      colorPalette: [
        { name: 'Pumpkin Orange', hex: '#D95C2B' },
        { name: 'Warm Marigold', hex: '#EAA221' },
        { name: 'Olive Green', hex: '#586E37' },
        { name: 'Rich Chestnut', hex: '#5A2A18' },
        { name: 'Oatmeal Beige', hex: '#EFE7DA' },
      ],
      uniqueActivities: [
        { title: 'Community Giant Chalk Mural', description: 'A 50-foot asphalt stretch where kids and adults collaborate on a giant neighborhood story mural.' },
        { title: 'Local Baker Apple Pie Championship', description: 'Amateur neighborhood bakers submit pies for blind judging by local firefighters and senior center leaders.' },
        { title: 'Upcycled Instrument Workshop for Kids', description: 'Children build shakers and cigar-box ukuleles from recycled materials, culminating in a parade.' },
      ],
      signatureFoodAndDrink: [
        { name: 'Spiced Honey Honeycrisp Cider', type: 'drink', description: 'Fresh orchard cider pressed on site with cinnamon sticks, star anise, and orange zest.' },
        { name: 'Roasted Butternut Squash & Poblano Tacos', type: 'food', description: 'Woodfire roasted squash with cotija cheese, pickled red onions, and pumpkin seed salsa.' },
        { name: 'Maple Glazed Apple Cider Donuts', type: 'dessert', description: 'Hot from the fry kettle, dusted in organic cinnamon sugar and sea salt.' },
      ],
      decorVibes: [
        { title: 'Overhead Warm Edison String Lights', tips: 'Zig-zag warm LED cafe bulbs across the tree canopy between utility poles for a magical night glow.' },
        { title: 'Straw Bale Lounge Clusters', tips: 'Group straw bales draped with washable flannel blankets around safe smokeless fire pits.' },
      ],
      musicAndVibeTips: [
        'Morning: Bluegrass, acoustic folk, and regional fiddlers.',
        'Midday: Afrobeat, Latin brass ensemble, and community choir.',
        'Late Afternoon: Upbeat indie rock and brass band grand finale.',
      ],
      favorsAndGifts: [
        'Oakwood Community harvest tote bag filled with local business coupons.',
        'Seed paper bookmarks that sprout into native pollinator flowers when planted.',
        'Oakwood community recipe book containing 20 treasured family dishes from neighbors.',
      ],
    },
    guests: [
      { id: 'cg1', name: 'Councilwoman Ramirez', group: 'VIP', rsvpStatus: 'attending', plusOne: true, dietary: 'Vegetarian' },
      { id: 'cg2', name: 'Oakwood Volunteer Corps (35 pax)', group: 'Community', rsvpStatus: 'attending', plusOne: false, dietary: 'Mixed' },
      { id: 'cg3', name: 'Downtown Business Association (12 reps)', group: 'Colleagues', rsvpStatus: 'attending', plusOne: true, dietary: 'None' },
    ],
  };
}
