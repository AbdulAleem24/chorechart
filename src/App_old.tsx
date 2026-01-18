import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import './index.css';
import type { User, ChoreType, Attachment, ChoreEntry } from './types';
import { CHORE_LABELS } from './types';
import { 
  shouldShowGoodBoy,
  getTodayString,
  getAssignedUser,
  isDateActionable,
  generateId,
} from './utils';
import {
  SimpleLoginScreen,
  TutorialModal,
  GoodBoyModal,
  ChoreCalendar,
  TrashTallyCard,
  StrikeModal,
  StrikeHistoryModal,
} from './components';
import { ClipboardList, LogOut, ChevronLeft, ChevronRight, AlertTriangle, PartyPopper, Check, Undo2 } from 'lucide-react';

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [showGoodBoy, setShowGoodBoy] = useState(false);
  const [showStrikeModal, setShowStrikeModal] = useState<{ targetUser: User; choreId?: string } | null>(null);
  const [showStrikeHistory, setShowStrikeHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  
  // Save state whenever it changes
  useEffect(() => {
    saveState(state);
  }, [state]);
  
  // Handle login
  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
  };
  
  // Handle logout
  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };
  
  // Handle reset data
  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
      clearData();
      setState(loadState());
    }
  };
  
  // Handle tutorial completion
  const handleTutorialComplete = () => {
    setState(prev => ({ ...prev, tutorialShown: true }));
  };
  
  // Handle chore toggle - only allow for own chores
  const handleToggleChore = (date: string, choreType: ChoreType) => {
    if (!state.currentUser) return;
    
    // Check if date is actionable (not too far in future)
    if (!isDateActionable(date)) return;
    
    // Recalculate assigned user to ensure correctness
    const actualAssignedUser = getAssignedUser(choreType, date);
    
    // Only allow toggling own chores - validate that the actual assigned user is current user
    if (actualAssignedUser !== state.currentUser) return;
    
    // Check if we're marking complete (not unchecking) before state change
    const wasCompleted = getChoreEntry(state.chores, date, choreType)?.completed;
    
    // Use the recalculated actualAssignedUser for consistency
    const newChores = toggleChore(state.chores, date, choreType, state.currentUser);
    
    // Check if should show good boy popup for Daniyal (only when marking complete)
    const shouldShowPopup = !wasCompleted && 
                           state.currentUser === 'Daniyal' && 
                           shouldShowGoodBoy('Daniyal', state.goodBoyShownDates, state.firstChoreCompleted);
    
    // Single state update to prevent race condition
    setState(prev => ({
      ...prev,
      chores: newChores,
      ...(shouldShowPopup && {
        goodBoyShownDates: [...prev.goodBoyShownDates, getTodayString()],
        firstChoreCompleted: true,
      }),
    }));
    
    if (shouldShowPopup) {
      setShowGoodBoy(true);
    }
  };
  
  // Handle adding comment
  const handleAddComment = (choreId: string, text: string, attachments: Attachment[]) => {
    if (!state.currentUser) return;
    
    // Check if this is a temp chore ID (needs to be created first)
    if (choreId.startsWith('temp-')) {
      // Parse the temp ID to get date and choreType
      // Format: temp-YYYY-MM-DD-choreType
      const parts = choreId.split('-');
      if (parts.length >= 5) {
        const dateStr = `${parts[1]}-${parts[2]}-${parts[3]}`;
        const choreType = parts.slice(4).join('-') as ChoreType;
        
        // Verify this chore exists on this date
        const assignedUser = getAssignedUser(choreType, dateStr);
        
        if (assignedUser) {
          // Create new chore entry with comment
          const newEntry: ChoreEntry = {
            id: generateId(),
            date: dateStr,
            choreType,
            completed: false,
            comments: [{
              id: generateId(),
              userId: state.currentUser,
              text,
              attachments,
              createdAt: new Date().toISOString(),
            }],
          };
          
          setState(prev => ({
            ...prev,
            chores: [...prev.chores, newEntry],
          }));
        }
      }
      return;
    }
    
    // Normal flow - add comment to existing chore
    const newChores = addComment(state.chores, choreId, state.currentUser, text, attachments);
    setState(prev => ({ ...prev, chores: newChores }));
  };
  
  // Handle trash tally increment
  const handleTrashIncrement = (user: User) => {
    const today = getTodayString();
    
    // Check if already incremented today
    if (state.trashTally.lastIncrementDate?.[user] === today) {
      return; // Already incremented today
    }
    
    // Check if should show good boy popup
    const shouldShowPopup = user === 'Daniyal' && shouldShowGoodBoy('Daniyal', state.goodBoyShownDates, state.firstChoreCompleted);
    
    // Single state update to prevent race condition
    setState(prev => ({
      ...prev,
      trashTally: {
        ...prev.trashTally,
        [user]: prev.trashTally[user] + 1,
        lastIncrementDate: {
          ...prev.trashTally.lastIncrementDate,
          [user]: today,
        },
      },
      ...(shouldShowPopup && {
        goodBoyShownDates: [...prev.goodBoyShownDates, getTodayString()],
      }),
    }));
    
    if (shouldShowPopup) {
      setShowGoodBoy(true);
    }
  };
  
  // Handle trash tally decrement
  const handleTrashDecrement = (user: User) => {
    const today = getTodayString();
    
    // Only allow decrement if count > 0 and they have incremented today
    if (state.trashTally[user] <= 0 || state.trashTally.lastIncrementDate?.[user] !== today) {
      return;
    }
    
    setState(prev => ({
      ...prev,
      trashTally: {
        ...prev.trashTally,
        [user]: prev.trashTally[user] - 1,
        lastIncrementDate: {
          ...prev.trashTally.lastIncrementDate,
          [user]: undefined, // Clear so they can increment again
        },
      },
    }));
  };
  
  // Handle giving a strike
  const handleGiveStrike = (reason: string, attachments: Attachment[]) => {
    if (!state.currentUser || !showStrikeModal) return;
    
    const newStrikes = addStrike(
      state.strikes,
      state.currentUser,
      showStrikeModal.targetUser,
      reason,
      attachments,
      showStrikeModal.choreId
    );
    
    setState(prev => ({ ...prev, strikes: newStrikes }));
    setShowStrikeModal(null);
  };
  
  // Open strike modal for a user
  const handleOpenStrikeModal = (targetUser: User, choreId?: string) => {
    setShowStrikeModal({ targetUser, choreId });
  };
  
  // Navigate months
  const navigateMonth = (direction: -1 | 1) => {
    setSelectedMonth(prev => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;
      
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      
      return { year: newYear, month: newMonth };
    });
  };
  
  // Show login screen if not logged in
  if (!state.currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }
  
  // Show tutorial for Daniyal on first login
  const shouldShowTutorial = state.currentUser === 'Daniyal' && !state.tutorialShown;
  
  // Get strike counts
  const aleemStrikes = getStrikeCount(state.strikes, 'Aleem');
  const daniyalStrikes = getStrikeCount(state.strikes, 'Daniyal');
  
  return (
    <div className="min-h-screen bg-gray-100 pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-5 sm:p-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl sm:text-xl font-bold flex items-center gap-2 sm:gap-2">
                <ClipboardList size={24} className="sm:w-6 sm:h-6" /> ChoreChart
              </h1>
              <p className="text-white/80 text-sm sm:text-sm">
                Welcome, {state.currentUser}!
              </p>
            </div>
            <div className="flex gap-2 sm:gap-2">
              <button
                onClick={handleResetData}
                className="px-3 py-2 sm:px-3 sm:py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs sm:text-xs font-medium transition-all"
                title="Reset all data to start fresh"
              >
                Reset
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm sm:text-sm font-medium transition-all flex items-center gap-2 sm:gap-2"
              >
                <LogOut size={16} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Logout</span><span className="sm:hidden">Out</span>
              </button>
            </div>
          </div>
          
          {/* Strike Counter */}
          <div 
            className="flex items-center justify-center gap-3 sm:gap-4 bg-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-all"
            onClick={() => setShowStrikeHistory(true)}
          >
            <div className="flex items-center gap-2 sm:gap-2">
              <span className="text-sm sm:text-sm">Aleem</span>
              <span className={`px-2 sm:px-2 py-1 rounded-full text-xs sm:text-xs font-bold flex items-center gap-1 sm:gap-1 ${
                aleemStrikes > 0 ? 'bg-red-500' : 'bg-green-500'
              }`}>
                <AlertTriangle size={10} className="sm:w-3 sm:h-3" /> {aleemStrikes}
              </span>
            </div>
            <span className="text-white/50">|</span>
            <div className="flex items-center gap-2 sm:gap-2">
              <span className={`px-2 sm:px-2 py-1 rounded-full text-xs sm:text-xs font-bold flex items-center gap-1 sm:gap-1 ${
                daniyalStrikes > 0 ? 'bg-red-500' : 'bg-green-500'
              }`}>
                <AlertTriangle size={10} className="sm:w-3 sm:h-3" /> {daniyalStrikes}
              </span>
              <span className="text-sm sm:text-sm">Daniyal</span>
            </div>
            <span className="hidden sm:inline text-xs text-white/60 ml-2">← Tap for history</span>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto p-4 sm:p-4 space-y-4 sm:space-y-4 overflow-x-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow p-4 sm:p-3">
          <button
            onClick={() => navigateMonth(-1)}
            className="w-10 h-10 sm:w-10 sm:h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 transition-all"
          >
            <ChevronLeft size={20} className="sm:w-5 sm:h-5" />
          </button>
          <div className="text-center">
            <span className="font-bold text-gray-800 text-base sm:text-base">
              {new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleString('default', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="w-10 h-10 sm:w-10 sm:h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 transition-all"
          >
            <ChevronRight size={20} className="sm:w-5 sm:h-5" />
          </button>
        </div>
        
        {/* Trash Tally */}
        <TrashTallyCard
          tally={state.trashTally}
          currentUser={state.currentUser}
          onIncrement={handleTrashIncrement}
          onDecrement={handleTrashDecrement}
        />
        
        {/* Chore Calendar */}
        <ChoreCalendar
          year={selectedMonth.year}
          month={selectedMonth.month}
          chores={state.chores}
          strikes={state.strikes}
          currentUser={state.currentUser}
          onToggleChore={handleToggleChore}
          onAddComment={handleAddComment}
          onStrike={(targetUser, choreId) => handleOpenStrikeModal(targetUser, choreId)}
        />
        
        {/* Quick Actions for Today */}
        <div className="bg-white rounded-xl shadow-lg p-5 sm:p-4">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-base sm:text-base">
            <ClipboardList size={20} className="sm:w-5 sm:h-5" /> Today's Chores
          </h3>
          <TodaysChores 
            currentUser={state.currentUser}
            chores={state.chores}
            onToggle={handleToggleChore}
          />
        </div>
      </main>
      
      {/* Tutorial Modal for Daniyal */}
      {shouldShowTutorial && (
        <TutorialModal onComplete={handleTutorialComplete} />
      )}
      
      {/* Good Boy Modal for Daniyal */}
      {showGoodBoy && (
        <GoodBoyModal onDismiss={() => setShowGoodBoy(false)} />
      )}
      
      {/* Strike Modal */}
      {showStrikeModal && state.currentUser && (
        <StrikeModal
          targetUser={showStrikeModal.targetUser}
          onSubmit={handleGiveStrike}
          onClose={() => setShowStrikeModal(null)}
        />
      )}
      
      {/* Strike History Modal */}
      {showStrikeHistory && (
        <StrikeHistoryModal
          strikes={getCurrentMonthStrikes(state.strikes)}
          onClose={() => setShowStrikeHistory(false)}
        />
      )}
    </div>
  );
}

// Today's Chores Quick View
function TodaysChores({ 
  currentUser, 
  chores,
  onToggle 
}: { 
  currentUser: User;
  chores: AppState['chores'];
  onToggle: (date: string, choreType: ChoreType) => void;
}) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  
  const choreTypes: ChoreType[] = [
    'sweeping_mopping',
    'kitchen_cleaning',
    'veranda_cleaning',
    'toilet_bathroom',
  ];
  
  const todaysChores = choreTypes
    .map(choreType => {
      const assignedUser = getAssignedUser(choreType, dateStr);
      if (!assignedUser) return null;
      
      const existing = getChoreEntry(chores, dateStr, choreType);
      
      return {
        choreType,
        assignedTo: assignedUser as User,
        completed: existing?.completed || false,
        isYours: assignedUser === currentUser,
      };
    })
    .filter(Boolean);
  
  return (
    <div>
      <p className="text-sm sm:text-sm text-gray-500 mb-3 sm:mb-3">{dayName}, {today.toLocaleDateString()}</p>
      
      {todaysChores.length === 0 ? (
        <p className="text-gray-500 text-center py-4 sm:py-4 flex items-center justify-center gap-2 text-sm">
          No chores scheduled for today! <PartyPopper size={20} className="sm:w-5 sm:h-5" />
        </p>
      ) : (
        <div className="space-y-3">
          {todaysChores.map(chore => chore && (
            <div 
              key={chore.choreType}
              className={`flex items-center justify-between p-4 sm:p-3 rounded-lg ${
                chore.isYours 
                  ? chore.completed 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-3">
                <span className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-sm ${
                  chore.assignedTo === 'Aleem' 
                    ? 'bg-blue-200 text-blue-700' 
                    : 'bg-yellow-200 text-yellow-700'
                }`}>
                  {chore.assignedTo[0]}
                </span>
                <div>
                  <p className="font-medium text-gray-800 text-sm sm:text-sm">
                    {CHORE_LABELS[chore.choreType]}
                  </p>
                  <p className="text-xs sm:text-xs text-gray-500">
                    {chore.isYours ? 'Your turn' : `${chore.assignedTo}'s turn`}
                  </p>
                </div>
              </div>
              
              {chore.isYours ? (
                <button
                  onClick={() => onToggle(dateStr, chore.choreType)}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 sm:gap-2 text-sm sm:text-sm ${
                    chore.completed
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {chore.completed ? <><Undo2 size={16} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Undo</span></> : <><Check size={16} className="sm:w-4 sm:h-4" /> Done</>}
                </button>
              ) : (
                <span className={`px-3 py-1.5 sm:px-3 rounded-full text-xs sm:text-sm flex items-center gap-1 ${
                  chore.completed 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {chore.completed ? <><Check size={14} className="sm:w-3.5 sm:h-3.5" /> Done</> : 'Pending'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
