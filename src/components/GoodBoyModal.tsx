import { useState } from 'react';
import { Dog, Sparkles, PartyPopper } from 'lucide-react';

interface GoodBoyModalProps {
  onDismiss: () => void;
}

export function GoodBoyModal({ onDismiss }: GoodBoyModalProps) {
  const [pressed, setPressed] = useState(false);
  
  const handlePress = () => {
    setPressed(true);
    setTimeout(onDismiss, 500);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-4 z-50">
      <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl shadow-2xl p-8 sm:p-8 w-full max-w-sm text-center animate-bounce-in">
        <div className="mb-4 sm:mb-4 animate-wiggle flex justify-center">
          <div className="w-24 h-24 sm:w-24 sm:h-24 bg-yellow-200 rounded-full flex items-center justify-center">
            <Dog size={56} className="text-yellow-700 sm:w-16 sm:h-16" />
          </div>
        </div>
        
        <h2 className="text-2xl sm:text-2xl font-bold text-yellow-800 mb-3 sm:mb-3">
          Who's a good boy?!
        </h2>
        
        <p className="text-base sm:text-base text-yellow-700 mb-6 sm:mb-6 flex items-center justify-center gap-2">
          You completed a chore! What a responsible roommate! <Sparkles size={20} className="text-yellow-600 sm:w-5 sm:h-5" />
        </p>
        
        <button
          onClick={handlePress}
          disabled={pressed}
          className={`w-full py-4 sm:py-4 px-6 sm:px-6 font-bold text-lg sm:text-lg rounded-xl transition-all transform flex items-center justify-center gap-2 ${
            pressed 
              ? 'bg-green-500 text-white scale-95' 
              : 'bg-yellow-500 hover:bg-yellow-600 text-white hover:scale-105 shadow-lg'
          }`}
        >
          {pressed ? <><PartyPopper size={20} className="sm:w-6 sm:h-6" /> Yes you are!</> : "I'm a good boy!"}
        </button>
        
        {!pressed && (
          <p className="text-yellow-600 text-[10px] sm:text-xs mt-3 sm:mt-4 italic">
            (You must press the button to continue)
          </p>
        )}
      </div>
    </div>
  );
}
