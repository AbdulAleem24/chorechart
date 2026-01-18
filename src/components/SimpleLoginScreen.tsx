import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ClipboardList, Lock, Eye, EyeOff } from 'lucide-react';
import type { User } from '../types';

interface SimpleLoginScreenProps {
  onLogin: (userId: string, name: User) => void;
}

export function SimpleLoginScreen({ onLogin }: SimpleLoginScreenProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useMutation(api.users.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await login({ name: selectedUser, password });
      
      if (result.success && result.userId) {
        // Store in localStorage for persistent login
        localStorage.setItem('chorechart_user_id', result.userId);
        localStorage.setItem('chorechart_user_name', result.name);
        onLogin(result.userId, result.name as User);
      } else {
        setError(result.message || 'Invalid password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedUser) {
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
              onClick={() => setSelectedUser('Aleem')}
              className="w-full py-5 px-6 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
            >
              Aleem
            </button>
            
            <button
              onClick={() => setSelectedUser('Daniyal')}
              className="w-full py-5 px-6 bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
            >
              Daniyal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome, {selectedUser}!
          </h1>
          <p className="text-gray-500">Enter your password to continue</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="Enter your password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-lg font-semibold rounded-xl transition-all shadow-lg"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedUser(null);
              setPassword('');
              setError('');
            }}
            className="w-full py-3 text-gray-600 hover:text-gray-800 transition-all"
          >
            ← Back
          </button>
        </form>
      </div>
    </div>
  );
}
