import { useState, useRef, useEffect } from 'react';
import type { ChoreEntry, ChoreType, User, Attachment, Strike } from '../types';
import { CHORE_LABELS } from '../types';
import { getDaysInMonth, getAssignedUser, getChoreEntry, formatDate, getDayName, isDateActionable } from '../utils';
import { ChoreDetailModal } from './ChoreDetailModal';
import { Check, AlertTriangle } from 'lucide-react';

interface ChoreCalendarProps {
  year: number;
  month: number;
  chores: ChoreEntry[];
  strikes: Strike[];
  currentUser: User;
  onToggleChore: (date: string, choreType: ChoreType) => void;
  onAddComment: (choreId: string, text: string, attachments: Attachment[]) => void;
  onStrike?: (targetUser: User, choreId: string) => void;
  onDeleteStrike?: (strikeId: string) => void;
  onDeleteComment?: (choreId: string, commentId: string) => void;
}

const choreTypes: ChoreType[] = [
  'sweeping_mopping',
  'kitchen_cleaning',
  'veranda_cleaning',
  'toilet_bathroom',
];

export function ChoreCalendar({
  year,
  month,
  chores,
  strikes,
  currentUser,
  onToggleChore,
  onAddComment,
  onStrike,
  onDeleteStrike,
  onDeleteComment,
}: ChoreCalendarProps) {
  const [selectedChore, setSelectedChore] = useState<ChoreEntry | null>(null);
  const todayColumnRef = useRef<HTMLTableCellElement>(null);
  
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = today.getDate();
  
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  
  // Scroll to today's column on mount if viewing current month
  useEffect(() => {
    if (isCurrentMonth && todayColumnRef.current) {
      todayColumnRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [isCurrentMonth, year, month]);
  
  // Update selected chore when chores data changes (for real-time updates)
  useEffect(() => {
    if (selectedChore && !selectedChore.id.startsWith('temp-')) {
      // Find the updated version of the selected chore
      const updatedChore = chores.find(c => c.id === selectedChore.id);
      if (updatedChore) {
        setSelectedChore(updatedChore);
      }
    }
  }, [chores, selectedChore]);
  
  const handleCellClick = (day: number, choreType: ChoreType) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const assignedUser = getAssignedUser(choreType, dateStr);
    
    if (!assignedUser) return;
    
    // Check if date is actionable (within 2 days from today)
    const isActionable = isDateActionable(dateStr);
    
    const existing = getChoreEntry(chores, dateStr, choreType);
    const isOwnChore = assignedUser === currentUser;
    
    // If an entry exists, always allow opening modal to view details
    if (existing) {
      setSelectedChore(existing);
      return;
    }
    
    // No existing entry
    // Allow opening for: own actionable chores, OR any chore in current month (for comments)
    if (isOwnChore && isActionable) {
      // Own actionable chore - create temp entry for modal
      const tempChore: ChoreEntry = {
        id: `temp-${dateStr}-${choreType}`,
        date: dateStr,
        choreType,
        completed: false,
        comments: [],
      };
      setSelectedChore(tempChore);
    } else if (isCurrentMonth) {
      // Any chore in current month - allow opening to add comments
      const tempChore: ChoreEntry = {
        id: `temp-${dateStr}-${choreType}`,
        date: dateStr,
        choreType,
        completed: false,
        comments: [],
      };
      setSelectedChore(tempChore);
    }
    // Otherwise, do nothing (future non-own chores)
  };
  
  const handleLongPress = (day: number, choreType: ChoreType) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const assignedUser = getAssignedUser(choreType, dateStr);
    const existing = getChoreEntry(chores, dateStr, choreType);
    if (existing && assignedUser) {
      setSelectedChore(existing);
    }
  };
  
  const renderCell = (day: number, choreType: ChoreType) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const assignedUser = getAssignedUser(choreType, dateStr);
    const choreEntry = getChoreEntry(chores, dateStr, choreType);
    
    const isToday = isCurrentMonth && day === todayDate;
    const isOwnChore = assignedUser === currentUser;
    const isActionable = isDateActionable(dateStr);
    
    if (!assignedUser) {
      return (
        <div 
          key={`${choreType}-${day}`}
          className="chore-cell chore-cell-empty"
        />
      );
    }
    
    const isCompleted = choreEntry?.completed;
    const hasComments = choreEntry && choreEntry.comments.length > 0;
    const hasEntry = !!choreEntry;
    
    // Check if this chore has any strikes
    const choreStrikes = choreEntry ? strikes.filter(s => s.choreId === choreEntry.id) : [];
    const hasStrike = choreStrikes.length > 0;
    
    // Determine if this cell is interactive
    // Clickable if: entry exists, OR (own chore AND actionable), OR (any chore in current month)
    const isClickable = hasEntry || (isOwnChore && isActionable) || isCurrentMonth;
    const isFutureNonActionable = !isActionable && !hasEntry;
    
    return (
      <div
        key={`${choreType}-${day}`}
        onClick={() => handleCellClick(day, choreType)}
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress(day, choreType);
        }}
        className={`chore-cell relative ${
          isCompleted
            ? 'chore-cell-completed'
            : assignedUser === 'Aleem'
            ? 'chore-cell-aleem'
            : 'chore-cell-daniyal'
        } ${
          isToday ? 'ring-2 ring-purple-500 ring-offset-1' : ''
        } ${
          isFutureNonActionable && isOwnChore ? 'opacity-40 cursor-not-allowed' : !isOwnChore && !isCompleted ? 'opacity-60' : ''
        } ${
          !isFutureNonActionable && !isClickable ? 'opacity-30 cursor-not-allowed' : !isFutureNonActionable ? 'cursor-pointer' : ''
        }`}
        title={`${CHORE_LABELS[choreType]} - ${formatDate(dateStr)} - ${assignedUser}${
          !isOwnChore ? ' (View/Comment)' : ''
        }${isFutureNonActionable ? ' (Too far in future)' : !isClickable ? ' (Not available)' : ''}${hasStrike ? ` - ${choreStrikes.length} Strike(s)` : ''}`}
      >
        <div className="flex flex-col items-center justify-center h-full w-full relative">
          {isCompleted ? (
            <>
              <Check size={16} className="text-white" />
              <span className="text-[9px] font-bold text-white/90 leading-none">{assignedUser[0]}</span>
            </>
          ) : (
            <span className="text-base font-semibold">{assignedUser === 'Aleem' ? 'A' : 'D'}</span>
          )}
        </div>
        {hasComments && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold shadow-sm border border-white">
            {choreEntry!.comments.length}
          </span>
        )}
        {hasStrike && (
          <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm border border-white">
            <AlertTriangle size={10} className="text-white" />
          </span>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-5 sm:p-4">
        <h2 className="text-xl sm:text-xl font-bold text-center">
          {monthName} {year}
        </h2>
        <p className="text-center text-white/80 text-sm sm:text-sm mt-1">
          Roommate Chore Chart
        </p>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-3 md:gap-4 p-4 sm:p-3 bg-gray-50 border-b text-xs sm:text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 sm:w-4 sm:h-4 bg-blue-100 border-2 border-blue-400 rounded"></div>
          <span>Aleem (A)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 sm:w-4 sm:h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
          <span>Daniyal (D)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 sm:w-4 sm:h-4 bg-green-500 rounded flex items-center justify-center">
            <Check size={12} className="text-white sm:w-3 sm:h-3" />
          </div>
          <span>Done</span>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm sm:text-sm">
          <thead>
            {/* Day names row */}
            <tr className="bg-gray-50 border-b">
              <th className="py-2 px-2 sm:px-2 text-left font-medium text-gray-400 sticky left-0 bg-gray-50 z-10 min-w-[100px] sm:min-w-[100px] md:min-w-[140px] text-xs sm:text-xs">
                Day
              </th>
              {days.map(day => (
                <th 
                  key={`day-name-${day}`} 
                  className={`py-2 px-1 sm:px-1 text-center font-normal text-[10px] sm:text-[10px] md:text-xs min-w-[36px] sm:min-w-[32px] md:min-w-[40px] ${
                    isCurrentMonth && day === todayDate 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-400'
                  }`}
                >
                  {getDayName(year, month, day)}
                </th>
              ))}
            </tr>
            {/* Day numbers row */}
            <tr className="bg-gray-100">
              <th className="py-2.5 sm:py-2 px-2 sm:px-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 min-w-[100px] sm:min-w-[100px] md:min-w-[140px] text-xs sm:text-xs">
                Chore
              </th>
              {days.map(day => (
                <th 
                  key={day}
                  ref={isCurrentMonth && day === todayDate ? todayColumnRef : null}
                  className={`py-2.5 sm:py-2 px-1 sm:px-1 text-center font-bold min-w-[36px] sm:min-w-[32px] md:min-w-[40px] text-sm sm:text-sm ${
                    isCurrentMonth && day === todayDate 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-600'
                  }`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {choreTypes.map(choreType => (
              <tr key={choreType} className="border-t">
                <td className="py-2.5 sm:py-2 px-2 sm:px-2 font-medium text-gray-700 sticky left-0 bg-white z-10 whitespace-nowrap text-xs sm:text-xs md:text-sm">
                  {CHORE_LABELS[choreType]}
                </td>
                {days.map(day => (
                  <td key={day} className="py-1 sm:py-1 px-1 sm:px-1 text-center">
                    {renderCell(day, choreType)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Chore Detail Modal */}
      {selectedChore && (
        <ChoreDetailModal
          chore={selectedChore}
          strikes={strikes}
          currentUser={currentUser}
          onClose={() => setSelectedChore(null)}
          onAddComment={(text, attachments) => {
            // Pass the choreId (even if temp) - parent will handle creating entry if needed
            onAddComment(selectedChore.id, text, attachments);
            // Don't close modal - it will refresh automatically via useEffect below
          }}
          onToggle={() => {
            // Recalculate to ensure correct assignment
            const actualAssignedUser = getAssignedUser(selectedChore.choreType, selectedChore.date);
            
            // Only allow toggle if: 1) actually assigned to current user, 2) date is actionable
            if (actualAssignedUser === currentUser && isDateActionable(selectedChore.date)) {
              onToggleChore(selectedChore.date, selectedChore.choreType);
              setSelectedChore(null);
            }
          }}
          onStrike={() => {
            // Recalculate assigned user to be safe
            const actualAssignedUser = getAssignedUser(selectedChore.choreType, selectedChore.date);
            
            if (onStrike && actualAssignedUser && actualAssignedUser !== currentUser && !selectedChore.id.startsWith('temp-')) {
              onStrike(actualAssignedUser, selectedChore.id);
            }
          }}
          onDeleteStrike={onDeleteStrike}
          onDeleteComment={onDeleteComment ? (commentId) => {
            onDeleteComment(selectedChore.id, commentId);
            // Don't close modal - it will refresh automatically via useEffect below
          } : undefined}
        />
      )}
    </div>
  );
}
