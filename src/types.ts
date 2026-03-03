// Types for ChoreChart application

export type User = 'Aleem' | 'Daniyal';

export type ChoreType = 
  | 'sweeping'
  | 'mopping'
  | 'kitchen_cleaning'
  | 'veranda_cleaning'
  | 'toilet_bathroom';

export interface ChoreEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  choreType: ChoreType;
  completed: boolean;
  completedBy?: User;
  completedAt?: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: User;
  text: string;
  attachments: Attachment[];
  createdAt: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'video';
  url: string; // Base64 data URL for local storage
  name: string;
}

export interface Strike {
  id: string;
  givenBy: User;
  givenTo: User;
  choreId?: string; // Optional - can be related to a chore
  reason: string;
  attachments: Attachment[];
  createdAt: string;
  month: string; // YYYY-MM format for monthly tally
}

export interface TrashTally {
  month: string; // YYYY-MM format
  Aleem: number;
  Daniyal: number;
  lastIncrementDate?: {
    Aleem?: string; // YYYY-MM-DD of last increment
    Daniyal?: string; // YYYY-MM-DD of last increment
  };
  currentMonthCounts?: {
    Aleem: number;
    Daniyal: number;
  };
}

export interface StrikeTally {
  month: string; // YYYY-MM format
  Aleem: number; // Strikes received by Aleem
  Daniyal: number; // Strikes received by Daniyal
}

export interface AppState {
  currentUser: User | null;
  chores: ChoreEntry[];
  trashTally: TrashTally;
  strikes: Strike[];
  tutorialShown: boolean;
  goodBoyShownDates: string[]; // Dates when good boy popup was shown
  firstChoreCompleted: boolean; // Track if Daniyal has completed their first chore
}

export const CHORE_LABELS: Record<ChoreType, string> = {
  sweeping: 'Sweeping',
  mopping: 'Mopping',
  kitchen_cleaning: 'Kitchen Cleaning',
  veranda_cleaning: 'Veranda Cleaning',
  toilet_bathroom: 'Toilet & Bathroom',
};

export const CHORE_SCHEDULE: Record<ChoreType, 'twice-weekly' | 'weekly' | 'biweekly'> = {
  sweeping: 'twice-weekly',
  mopping: 'weekly',
  kitchen_cleaning: 'weekly',
  veranda_cleaning: 'biweekly',
  toilet_bathroom: 'weekly',
};

// Schedule (anchored on March 1, 2026 = Sunday):
// Sweeping: 2x/week — Daniyal on Sundays, Aleem on Thursdays (fixed)
// Mopping: Weekly, alternating — mop happens on the mopper's sweep day
//   Daniyal's mop week → Sunday, Aleem's mop week → Thursday
// Kitchen: Weekly on Sundays, alternating (Mar 1: Daniyal, Mar 8: Aleem...)
// Veranda: Bi-weekly on Sundays, alternating (Feb 22: Daniyal, Mar 8: Aleem...)
// Toilet & Bath: Weekly on Sundays, alternating (Feb 22: Daniyal, Mar 1: Aleem...)
