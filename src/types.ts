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

// Days when alternating chores occur (every other day)
// Sweeping: Days 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31 (odd days)
// Kitchen: Days 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30 (even days)
// Within those, they alternate between users
