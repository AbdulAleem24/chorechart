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

// Helper to get current month string
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

function App() {
  console.log('[App] Starting...');
  
  // Auth state from localStorage
  const [userId, setUserId] = useState<Id<"users"> | null>(() => {
    const stored = localStorage.getItem('chorechart_user_id');
    console.log('[App] Stored userId:', stored);
    return stored as Id<"users"> | null;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('chorechart_user_name');
    console.log('[App] Stored userName:', stored);
    return stored as User | null;
  });
  
  // UI state
  const [showGoodBoy, setShowGoodBoy] = useState(false);
  const [showStrikeModal, setShowStrikeModal] = useState<{ targetUser: User; choreId?: string } | null>(null);
  const [showStrikeHistory, setShowStrikeHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  
  // Convex queries - only run when logged in
  const userData = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const choresData = useQuery(api.chores.getAllChores);
  const strikesData = useQuery(api.strikes.getStrikes);
  
  // We need to get both users' trash tallies
  const aleemUserData = useQuery(api.users.getUserByName, { name: "Aleem" });
  const daniyalUserData = useQuery(api.users.getUserByName, { name: "Daniyal" });
  const aleemTrash = useQuery(api.trash.getTrashTally, 
    aleemUserData?._id ? { userId: aleemUserData._id, month: getCurrentMonth() } : "skip"
  );
  const daniyalTrash = useQuery(api.trash.getTrashTally,
    daniyalUserData?._id ? { userId: daniyalUserData._id, month: getCurrentMonth() } : "skip"
  );
  
  // Convex mutations
  const toggleChoreMutation = useMutation(api.chores.toggleChore);
  const addCommentMutation = useMutation(api.chores.addComment);
  const incrementTrashMutation = useMutation(api.trash.incrementTrashTally);
  const decrementTrashMutation = useMutation(api.trash.decrementTrashTally);
  const addStrikeMutation = useMutation(api.strikes.addStrike);
  const updateTutorialShown = useMutation(api.users.updateTutorialShown);
  const addGoodBoyDate = useMutation(api.users.addGoodBoyShownDate);
  const updateFirstChoreCompleted = useMutation(api.users.updateFirstChoreCompleted);
  const resetAllDataMutation = useMutation(api.reset.resetAllData);
  
  // Convert Convex data to local format for compatibility with existing components
  const chores: ChoreEntry[] = (choresData || []).map(c => ({
    id: c._id,
    date: c.date,
    choreType: c.choreType as ChoreType,
    completed: c.completed,
    completedBy: c.completedBy as User | undefined,
    completedAt: c.completedAt,
    comments: c.comments.map(comment => ({
      id: comment.id,
      userId: comment.userId as User,
      text: comment.text,
      attachments: comment.attachments.map(att => ({
        id: att.id,
        type: att.type as 'image' | 'video',
        url: att.url,
        name: att.name,
      })),
      createdAt: comment.createdAt,
    })),
  }));
  
  const trashTally = {
    month: getCurrentMonth(),
    Aleem: aleemTrash?.count || 0,
    Daniyal: daniyalTrash?.count || 0,
    lastIncrementDate: {
      Aleem: aleemTrash?.lastIncrementDate,
      Daniyal: daniyalTrash?.lastIncrementDate,
    },
  };
  
  const strikes = (strikesData || []).map(s => ({
    id: s._id,
    givenBy: s.givenBy as User,
    givenTo: s.givenTo as User,
    choreId: s.choreId,
    reason: s.reason,
    attachments: s.attachments.map(att => ({
      id: att.id,
      type: att.type as 'image' | 'video',
      url: att.url,
      name: att.name,
    })),
    createdAt: s.createdAt,
    month: s.createdAt.substring(0, 7),
  }));
  
  // Handle login
  const handleLogin = (newUserId: string, name: User) => {
    setUserId(newUserId as Id<"users">);
    setCurrentUser(name);
    localStorage.setItem('chorechart_user_id', newUserId);
    localStorage.setItem('chorechart_user_name', name);
  };
  
  // Handle logout
  const handleLogout = () => {
    setUserId(null);
    setCurrentUser(null);
    localStorage.removeItem('chorechart_user_id');
    localStorage.removeItem('chorechart_user_name');
  };
  
  // Handle reset data - clear all data for development
  const handleResetData = async () => {
    if (window.confirm('This will clear ALL data (chores, trash tallies, strikes) and log you out. Continue?')) {
      try {
        await resetAllDataMutation();
        handleLogout();
      } catch (error) {
        console.error('Failed to reset data:', error);
        alert('Failed to reset data. Please try again.');
      }
    }
  };
  
  // Handle tutorial completion
  const handleTutorialComplete = async () => {
    if (userId) {
      await updateTutorialShown({ userId, tutorialShown: true });
    }
  };
  
  // Handle chore toggle
  const handleToggleChore = async (date: string, choreType: ChoreType) => {
    if (!currentUser || !userId) return;
    
    // Check if date is actionable
    if (!isDateActionable(date)) return;
    
    // Recalculate assigned user
    const actualAssignedUser = getAssignedUser(choreType, date);
    
    // Only allow toggling own chores
    if (actualAssignedUser !== currentUser) return;
    
    // Check if we're marking complete
    const existing = chores.find(c => c.date === date && c.choreType === choreType);
    const wasCompleted = existing?.completed;
    
    // Toggle the chore
    await toggleChoreMutation({
      date,
      choreType,
      completedBy: currentUser,
    });
    
    // Check if should show good boy popup
    if (!wasCompleted && currentUser === 'Daniyal' && userData) {
      const shouldShowPopup = shouldShowGoodBoy(
        'Daniyal', 
        userData.goodBoyShownDates, 
        userData.firstChoreCompleted
      );
      
      if (shouldShowPopup) {
        await addGoodBoyDate({ userId, date: getTodayString() });
        await updateFirstChoreCompleted({ userId, firstChoreCompleted: true });
        setShowGoodBoy(true);
      }
    }
  };
  
  // Handle adding comment
  const handleAddComment = async (choreId: string, text: string, attachments: Attachment[]) => {
    if (!currentUser) return;
    
    // Check if this is a temp chore ID (needs to be created first)
    if (choreId.startsWith('temp-')) {
      const parts = choreId.split('-');
      if (parts.length >= 5) {
        const dateStr = `${parts[1]}-${parts[2]}-${parts[3]}`;
        const choreType = parts.slice(4).join('-') as ChoreType;
        
        // Create the chore with comment via mutation
        await addCommentMutation({
          date: dateStr,
          choreType,
          comment: {
            id: generateId(),
            userId: currentUser,
            text,
            attachments: attachments.map(att => ({
              id: att.id,
              type: att.type,
              url: att.url,
              name: att.name,
            })),
            createdAt: new Date().toISOString(),
          },
        });
      }
      return;
    }
    
    // Add comment to existing chore
    await addCommentMutation({
      choreId: choreId as Id<"chores">,
      comment: {
        id: generateId(),
        userId: currentUser,
        text,
        attachments: attachments.map(att => ({
          id: att.id,
          type: att.type,
          url: att.url,
          name: att.name,
        })),
        createdAt: new Date().toISOString(),
      },
    });
  };
  
  // Handle trash tally increment
  const handleTrashIncrement = async (user: User) => {
    const today = getTodayString();
    const targetUserId = user === 'Aleem' ? aleemUserData?._id : daniyalUserData?._id;
    
    if (!targetUserId) return;
    
    // Check if already incremented today
    const userTrash = user === 'Aleem' ? aleemTrash : daniyalTrash;
    if (userTrash?.lastIncrementDate === today) {
      return;
    }
    
    await incrementTrashMutation({
      userId: targetUserId,
      month: getCurrentMonth(),
      date: today,
    });
    
    // Check if should show good boy popup
    if (user === 'Daniyal' && userData) {
      const shouldShowPopup = shouldShowGoodBoy(
        'Daniyal',
        userData.goodBoyShownDates,
        userData.firstChoreCompleted
      );
      
      if (shouldShowPopup && userId) {
        await addGoodBoyDate({ userId, date: getTodayString() });
        setShowGoodBoy(true);
      }
    }
  };
  
  // Handle trash tally decrement
  const handleTrashDecrement = async (user: User) => {
    const today = getTodayString();
    const targetUserId = user === 'Aleem' ? aleemUserData?._id : daniyalUserData?._id;
    
    if (!targetUserId) return;
    
    const userTrash = user === 'Aleem' ? aleemTrash : daniyalTrash;
    
    // Only allow decrement if they have incremented today
    if (!userTrash || userTrash.count <= 0 || userTrash.lastIncrementDate !== today) {
      return;
    }
    
    await decrementTrashMutation({
      userId: targetUserId,
      month: getCurrentMonth(),
      date: today,
    });
  };
  
  // Handle giving a strike
  const handleGiveStrike = async (reason: string, attachments: Attachment[]) => {
    if (!currentUser || !showStrikeModal) return;
    
    await addStrikeMutation({
      choreId: showStrikeModal.choreId as Id<"chores"> | undefined,
      givenBy: currentUser,
      givenTo: showStrikeModal.targetUser,
      reason,
      attachments: attachments.map(att => ({
        id: att.id,
        type: att.type,
        url: att.url,
        name: att.name,
      })),
    });
    
    setShowStrikeModal(null);
  };
  
  // Open strike modal
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
  
  // Get strike counts
  const getStrikeCount = (user: User) => {
    const currentMonth = getCurrentMonth();
    return strikes.filter(s => s.givenTo === user && s.month === currentMonth).length;
  };
  
  const getCurrentMonthStrikes = () => {
    const currentMonth = getCurrentMonth();
    return strikes.filter(s => s.month === currentMonth);
  };
  
  // Show login screen if not logged in
  if (!currentUser || !userId) {
    console.log('[App] Showing login screen');
    return <SimpleLoginScreen onLogin={handleLogin} />;
  }
  
  console.log('[App] User logged in:', currentUser);
  
  // Show loading while data loads
  if (userData === undefined || choresData === undefined) {
    console.log('[App] Loading data...', { userData, choresData });
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <ClipboardList size={48} className="mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  console.log('[App] Rendering main app');
  
  // Show tutorial for Daniyal on first login
  const shouldShowTutorial = currentUser === 'Daniyal' && userData && !userData.tutorialShown;
  
  // Get strike counts
  const aleemStrikes = getStrikeCount('Aleem');
  const daniyalStrikes = getStrikeCount('Daniyal');
  
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
                Welcome, {currentUser}!
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
          tally={trashTally}
          currentUser={currentUser}
          onIncrement={handleTrashIncrement}
          onDecrement={handleTrashDecrement}
        />
        
        {/* Chore Calendar */}
        <ChoreCalendar
          year={selectedMonth.year}
          month={selectedMonth.month}
          chores={chores}
          strikes={strikes}
          currentUser={currentUser}
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
            currentUser={currentUser}
            chores={chores}
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
      {showStrikeModal && currentUser && (
        <StrikeModal
          targetUser={showStrikeModal.targetUser}
          onSubmit={handleGiveStrike}
          onClose={() => setShowStrikeModal(null)}
        />
      )}
      
      {/* Strike History Modal */}
      {showStrikeHistory && (
        <StrikeHistoryModal
          strikes={getCurrentMonthStrikes()}
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
  chores: ChoreEntry[];
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
      
      const existing = chores.find(c => c.date === dateStr && c.choreType === choreType);
      
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
