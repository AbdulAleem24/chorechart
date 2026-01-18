import type { User, TrashTally } from '../types';
import { Trash2, CheckCircle, AlertTriangle, BarChart3, Plus, Minus } from 'lucide-react';

interface TrashTallyCardProps {
  tally: TrashTally;
  currentUser: User;
  onIncrement: (user: User) => void;
  onDecrement: (user: User) => void;
}

export function TrashTallyCard({ tally, currentUser, onIncrement, onDecrement }: TrashTallyCardProps) {
  const total = tally.Aleem + tally.Daniyal;
  const aleemPercent = total > 0 ? (tally.Aleem / total) * 100 : 50;
  const daniyalPercent = total > 0 ? (tally.Daniyal / total) * 100 : 50;
  
  const difference = Math.abs(tally.Aleem - tally.Daniyal);
  const leader = tally.Aleem > tally.Daniyal ? 'Aleem' : tally.Daniyal > tally.Aleem ? 'Daniyal' : null;
  
  // Check if current user has incremented today
  const today = new Date().toISOString().split('T')[0];
  const hasIncrementedToday = tally.lastIncrementDate?.[currentUser] === today;
  const canIncrementToday = !hasIncrementedToday;
  const canDecrementToday = hasIncrementedToday && tally[currentUser] > 0;
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-5 sm:p-4 mb-4 sm:mb-4">
      <h3 className="text-lg sm:text-lg font-bold text-gray-800 mb-3 sm:mb-3 flex items-center gap-2 sm:gap-2">
        <Trash2 size={22} className="sm:w-5 sm:h-5" /> Trash Tally
        <span className="text-sm sm:text-sm font-normal text-gray-500">
          ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
        </span>
      </h3>
      
      {/* Progress bar */}
      <div className="flex h-4 sm:h-4 rounded-full overflow-hidden mb-3 sm:mb-3 bg-gray-100">
        <div 
          className="bg-blue-500 transition-all duration-300"
          style={{ width: `${aleemPercent}%` }}
        />
        <div 
          className="bg-yellow-500 transition-all duration-300"
          style={{ width: `${daniyalPercent}%` }}
        />
      </div>
      
      {/* Scores */}
      <div className="flex justify-between items-center mb-4 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-2">
          <span className="w-3 h-3 sm:w-3 sm:h-3 rounded-full bg-blue-500"></span>
          <span className="font-medium text-gray-700 text-sm sm:text-sm">Aleem</span>
          <span className="text-xl sm:text-xl font-bold text-blue-600">{tally.Aleem}</span>
          {currentUser === 'Aleem' && (
            <div className="ml-2 sm:ml-2 flex gap-1 sm:gap-1">
              <button
                onClick={() => onDecrement('Aleem')}
                disabled={!canDecrementToday}
                className="w-9 h-9 sm:w-8 sm:h-8 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-red-600 rounded-full font-bold transition-all flex items-center justify-center"
                title={canDecrementToday ? "Undo today's increment" : "Can only undo after incrementing today"}
              >
                <Minus size={16} className="sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => onIncrement('Aleem')}
                disabled={!canIncrementToday}
                className="w-9 h-9 sm:w-8 sm:h-8 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 rounded-full font-bold transition-all flex items-center justify-center"
                title={canIncrementToday ? 'Increase count' : 'Already incremented today'}
              >
                <Plus size={16} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-2">
          {currentUser === 'Daniyal' && (
            <div className="mr-2 sm:mr-2 flex gap-1 sm:gap-1">
              <button
                onClick={() => onDecrement('Daniyal')}
                disabled={!canDecrementToday}
                className="w-9 h-9 sm:w-8 sm:h-8 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-red-600 rounded-full font-bold transition-all flex items-center justify-center"
                title={canDecrementToday ? "Undo today's increment" : "Can only undo after incrementing today"}
              >
                <Minus size={16} className="sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => onIncrement('Daniyal')}
                disabled={!canIncrementToday}
                className="w-9 h-9 sm:w-8 sm:h-8 bg-yellow-100 hover:bg-yellow-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-yellow-600 rounded-full font-bold transition-all flex items-center justify-center"
                title={canIncrementToday ? 'Increase count' : 'Already incremented today'}
              >
                <Plus size={16} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
          <span className="text-xl sm:text-xl font-bold text-yellow-600">{tally.Daniyal}</span>
          <span className="font-medium text-gray-700 text-sm sm:text-sm">Daniyal</span>
          <span className="w-3 h-3 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></span>
        </div>
      </div>
      
      {/* Status message */}
      <div className={`text-center text-xs sm:text-sm py-2 px-2 sm:px-3 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 ${
        leader === null 
          ? 'bg-green-100 text-green-700' 
          : difference >= 3 
            ? 'bg-red-100 text-red-700' 
            : 'bg-yellow-100 text-yellow-700'
      }`}>
        {leader === null ? (
          <><CheckCircle size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Perfect balance! Keep it up!</span><span className="sm:hidden">Perfect balance!</span></>
        ) : difference >= 3 ? (
          <><AlertTriangle size={14} className="sm:w-4 sm:h-4" /> {leader === 'Aleem' ? 'Daniyal' : 'Aleem'} <span className="hidden sm:inline">needs to catch up!</span> ({difference} behind)</>
        ) : (
          <><BarChart3 size={14} className="sm:w-4 sm:h-4" /> {leader} is ahead by {difference}</>
        )}
      </div>
    </div>
  );
}
