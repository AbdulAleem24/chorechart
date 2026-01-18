import type { AppState, ChoreEntry, ChoreType, User, Comment, Attachment, Strike } from './types';

const STORAGE_KEY = 'chorechart_data';

// Get current month in YYYY-MM format
export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Get number of days in a month
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

// Get the day of week for the first day of month (0 = Sunday, 1 = Monday, etc.)
export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month - 1, 1).getDay();
};

// Get day name for a specific date
export const getDayName = (year: number, month: number, day: number): string => {
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

// Initialize default state
const getDefaultState = (): AppState => {
  const currentMonth = getCurrentMonth();
  return {
    currentUser: null,
    chores: [],
    trashTally: {
      month: currentMonth,
      Aleem: 0,
      Daniyal: 0,
    },
    strikes: [],
    tutorialShown: false,
    goodBoyShownDates: [],
    firstChoreCompleted: false,
  };
};

// Validate state structure
const validateState = (state: any): state is AppState => {
  if (!state || typeof state !== 'object') return false;
  
  // Validate currentUser
  if (state.currentUser !== null && state.currentUser !== 'Aleem' && state.currentUser !== 'Daniyal') {
    return false;
  }
  
  // Validate arrays
  if (!Array.isArray(state.chores)) return false;
  if (!Array.isArray(state.strikes)) return false;
  if (!Array.isArray(state.goodBoyShownDates)) return false;
  
  // Validate trashTally
  if (!state.trashTally || typeof state.trashTally !== 'object') return false;
  if (typeof state.trashTally.Aleem !== 'number' || typeof state.trashTally.Daniyal !== 'number') {
    return false;
  }
  
  // Validate boolean fields
  if (typeof state.tutorialShown !== 'boolean') return false;
  
  return true;
};

// Load state from localStorage
export const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved) as AppState;
      
      // Validate structure
      if (!validateState(state)) {
        console.error('Invalid state structure, using defaults');
        return getDefaultState();
      }
      
      // Reset trash tally if month changed
      const currentMonth = getCurrentMonth();
      if (state.trashTally.month !== currentMonth) {
        state.trashTally = {
          month: currentMonth,
          Aleem: 0,
          Daniyal: 0,
        };
      }
      
      // Ensure strikes array exists (for migration)
      if (!state.strikes) {
        state.strikes = [];
      }
      
      return state;
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return getDefaultState();
};

// Save state to localStorage
export const saveState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
};

// Clear all data from localStorage
export const clearData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear data:', e);
  }
};

// Generate chore ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// Get assigned user for a chore on a specific date
// Starting January 18, 2026 (Sunday):
// - Daniyal: Sweeping & Mopping, Kitchen Cleaning, Veranda Cleaning
// - Aleem: Toilet & Bathroom
// Chores alternate every OTHER day (with 1-day gap between)
export const getAssignedUser = (
  choreType: ChoreType,
  date: string
): User | null => {
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  // Reference date: January 18, 2026 (Sunday - our starting point)
  const referenceDate = new Date(2026, 0, 18);
  const currentDate = new Date(year, month - 1, day);
  
  // Calculate days since reference date
  const daysSinceReference = Math.floor((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // For sweeping & mopping: Every OTHER day, alternating (offset by 1 day from kitchen)
  // Jan 18 (day 0) = Daniyal (exception), Jan 19 (day 1) = Aleem, Jan 20 (day 2) = NONE, Jan 21 (day 3) = Daniyal, Jan 22 (day 4) = NONE, Jan 23 (day 5) = Aleem...
  if (choreType === 'sweeping_mopping') {
    // Special exception: Jan 18 = Daniyal (day 0)
    if (daysSinceReference === 0) return 'Daniyal';
    // Only happens on odd days (1, 3, 5, 7...)
    if (daysSinceReference % 2 !== 1) return null;
    // Alternate between users: day 1,5,9 = Aleem, day 3,7,11 = Daniyal
    const choreInstance = Math.floor(daysSinceReference / 2);
    return choreInstance % 2 === 0 ? 'Aleem' : 'Daniyal';
  }
  
  // For kitchen cleaning: Every OTHER day, alternating
  // Jan 18 (day 0) = Daniyal, Jan 19 (day 1) = NONE, Jan 20 (day 2) = Aleem, Jan 21 (day 3) = NONE, Jan 22 (day 4) = Daniyal...
  if (choreType === 'kitchen_cleaning') {
    // Only happens on even days (0, 2, 4, 6...)
    if (daysSinceReference % 2 !== 0) return null;
    // Alternate between users: day 0,4,8 = Daniyal, day 2,6,10 = Aleem
    const choreInstance = Math.floor(daysSinceReference / 2);
    return choreInstance % 2 === 0 ? 'Daniyal' : 'Aleem';
  }
  
  // For veranda cleaning: Weekly on Sundays
  // Jan 18, 2026 (Sunday) = Daniyal, then alternates weekly
  if (choreType === 'veranda_cleaning') {
    if (dateObj.getDay() !== 0) return null; // Only on Sundays
    const weeksSinceReference = Math.floor(daysSinceReference / 7);
    return weeksSinceReference % 2 === 0 ? 'Daniyal' : 'Aleem';
  }
  
  // For toilet & bathroom: Weekly on Sundays
  // Jan 18, 2026 (Sunday) = Aleem, then alternates weekly
  if (choreType === 'toilet_bathroom') {
    if (dateObj.getDay() !== 0) return null; // Only on Sundays
    const weeksSinceReference = Math.floor(daysSinceReference / 7);
    return weeksSinceReference % 2 === 0 ? 'Aleem' : 'Daniyal';
  }
  
  return null;
};

// Check if should show "good boy" popup (random chance, 1-2 times per week)
export const shouldShowGoodBoy = (
  user: User,
  goodBoyShownDates: string[],
  firstChoreCompleted: boolean
): boolean => {
  if (user !== 'Daniyal') return false;
  
  // Always show on first chore completion
  if (!firstChoreCompleted) return true;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Already shown today
  if (goodBoyShownDates.includes(today)) return false;
  
  // Count shows this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];
  
  const showsThisWeek = goodBoyShownDates.filter(d => d >= weekStartStr).length;
  if (showsThisWeek >= 2) return false;
  
  // Random chance (30%)
  return Math.random() < 0.3;
};

// Get chore entry for a specific date and chore type
export const getChoreEntry = (
  chores: ChoreEntry[],
  date: string,
  choreType: ChoreType
): ChoreEntry | undefined => {
  return chores.find(c => c.date === date && c.choreType === choreType);
};

// Create or update chore entry
export const toggleChore = (
  chores: ChoreEntry[],
  date: string,
  choreType: ChoreType,
  completedBy: User
): ChoreEntry[] => {
  const existing = getChoreEntry(chores, date, choreType);
  
  if (existing) {
    return chores.map(c => 
      c.id === existing.id 
        ? { ...c, completed: !c.completed, completedBy, completedAt: new Date().toISOString() }
        : c
    );
  }
  
  const newEntry: ChoreEntry = {
    id: generateId(),
    date,
    choreType,
    completed: true,
    completedBy,
    completedAt: new Date().toISOString(),
    comments: [],
  };
  
  return [...chores, newEntry];
};

// Add comment to a chore
export const addComment = (
  chores: ChoreEntry[],
  choreId: string,
  user: User,
  text: string,
  attachments: Attachment[]
): ChoreEntry[] => {
  const newComment: Comment = {
    id: generateId(),
    userId: user,
    text,
    attachments,
    createdAt: new Date().toISOString(),
  };
  
  return chores.map(c => 
    c.id === choreId 
      ? { ...c, comments: [...c.comments, newComment] }
      : c
  );
};

// Compress image before converting to base64
export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file); // Don't compress videos
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Max dimensions
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        'image/jpeg',
        0.8 // Quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// File to base64 conversion
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Format date for display
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

// Get today's date string in local timezone
export const getTodayString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if a date is actionable (within 2 days from today)
export const isDateActionable = (dateStr: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse date string in local timezone
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Allow marking chores from past and up to 2 days in future
  return daysDiff <= 2;
};

// Add a strike
export const addStrike = (
  strikes: Strike[],
  givenBy: User,
  givenTo: User,
  reason: string,
  attachments: Attachment[],
  choreId?: string
): Strike[] => {
  const newStrike: Strike = {
    id: generateId(),
    givenBy,
    givenTo,
    choreId,
    reason,
    attachments,
    createdAt: new Date().toISOString(),
    month: getCurrentMonth(),
  };
  
  return [...strikes, newStrike];
};

// Get strike count for a user in current month
export const getStrikeCount = (strikes: Strike[], user: User): number => {
  const currentMonth = getCurrentMonth();
  return strikes.filter(s => s.givenTo === user && s.month === currentMonth).length;
};

// Get strikes for current month
export const getCurrentMonthStrikes = (strikes: Strike[]): Strike[] => {
  const currentMonth = getCurrentMonth();
  return strikes.filter(s => s.month === currentMonth);
};
