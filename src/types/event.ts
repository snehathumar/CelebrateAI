export type EventType = 'wedding' | 'birthday' | 'community' | 'custom';

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export type TimelinePhase = 
  | '12-6_months' 
  | '6-3_months' 
  | '3-1_months' 
  | 'final_weeks' 
  | 'day_of';

export interface BudgetItem {
  id: string;
  category: 'Venue' | 'Catering & Bar' | 'Decor & Florals' | 'Photo & Video' | 'Music & Entertainment' | 'Attire & Beauty' | 'Favors & Gifts' | 'Logistics & Tech' | 'Emergency Buffer';
  name: string;
  estimatedCost: number;
  actualCost: number;
  paid: boolean;
  notes?: string;
}

export interface TimelineTask {
  id: string;
  title: string;
  phase: TimelinePhase;
  targetDate?: string;
  dayOfTime?: string; // e.g. "09:00 AM" for day_of tasks
  completed: boolean;
  assignee?: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

export type VendorStatus = 'researching' | 'contacted' | 'quoted' | 'booked' | 'paid';

export interface VendorItem {
  id: string;
  category: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: VendorStatus;
  quoteAmount: number;
  depositPaid: number;
  notes?: string;
  checklist: string[];
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface EventIdeas {
  themeName: string;
  themeDescription: string;
  colorPalette: ColorSwatch[];
  uniqueActivities: { title: string; description: string }[];
  signatureFoodAndDrink: { name: string; type: 'drink' | 'food' | 'dessert'; description: string }[];
  decorVibes: { title: string; tips: string }[];
  musicAndVibeTips: string[];
  favorsAndGifts: string[];
}

export interface GuestItem {
  id: string;
  name: string;
  group: 'Family' | 'Friends' | 'VIP' | 'Colleagues' | 'Community' | 'Other';
  rsvpStatus: 'attending' | 'declined' | 'pending';
  plusOne: boolean;
  dietary?: string;
  table?: string;
}

export interface EventPlan {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: CurrencyCode;
  vibe: string;
  colorPalette: ColorSwatch[];
  budgetItems: BudgetItem[];
  timeline: TimelineTask[];
  vendors: VendorItem[];
  ideas: EventIdeas;
  guests: GuestItem[];
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
  source?: 'gemini' | 'template';
}
