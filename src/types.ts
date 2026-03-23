// Types for ChoreChart application

export type User = 'Aleem' | 'Daniyal';

export type ChoreType = 
  | 'sweeping_mopping'
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
  sweeping_mopping: 'Sweeping & Mopping',
  kitchen_cleaning: 'Kitchen Cleaning',
  veranda_cleaning: 'Veranda Cleaning',
  toilet_bathroom: 'Toilet & Bathroom',
};

export const CHORE_SCHEDULE: Record<ChoreType, 'alternating' | 'weekly'> = {
  sweeping_mopping: 'alternating',
  kitchen_cleaning: 'alternating',
  veranda_cleaning: 'weekly',
  toilet_bathroom: 'weekly',
};

// Schedule (anchored on Jan 18, 2026 = Sunday):
// Sweeping & Mopping: Every other day, alternating users
// Kitchen: Every other day opposite to sweeping_mopping, alternating users
//   with a phase shift from Mar 23, 2026 (Mar 23 = Aleem)
// Veranda: Weekly on Sundays, alternating (Feb 22 = Daniyal)
// Toilet & Bath: Weekly on Sundays, alternating
//   with a phase shift from Mar 22, 2026 (Mar 22 = Aleem)
