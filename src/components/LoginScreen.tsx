import type { User } from '../types';
import { ClipboardList, UserCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <ClipboardList size={38} /> ChoreChart
          </h1>
          <p className="text-gray-500 text-lg">Roommate Chore Tracker</p>
        </div>
        
        <div className="space-y-5">
          <p className="text-center text-gray-600 font-medium text-lg">Who are you?</p>
          
          <button
            onClick={() => onLogin('Aleem')}
            className="w-full py-5 px-6 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
          >
            <UserCircle size={28} /> Aleem
          </button>
          
          <button
            onClick={() => onLogin('Daniyal')}
            className="w-full py-5 px-6 bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
          >
            <UserCircle size={28} /> Daniyal
          </button>
        </div>
        
        <p className="text-center text-gray-400 text-base mt-8">
          You'll stay logged in on this device
        </p>
      </div>
    </div>
  );
}
