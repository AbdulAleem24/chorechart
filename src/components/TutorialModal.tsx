import { useState } from 'react';
import { PartyPopper, Calendar, CheckCircle, RefreshCw, CalendarCheck, TrendingUp, MessageSquare, AlertTriangle, Rocket } from 'lucide-react';

interface TutorialModalProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    title: "Welcome, Daniyal!",
    content: "i created a quick short tutorial for your non-tech ass so you understand how this app works",
    Icon: PartyPopper
  },
  {
    title: "The Chore Calendar",
    content: "You'll see a calendar with all the chores listed. Blue cells are for Aleem, Yellow cells are for you (Daniyal).",
    Icon: Calendar
  },
  {
    title: "Completing a Chore",
    content: "When you finish a chore, just tap on the cell for that day. It will turn green to show it's done!",
    Icon: CheckCircle
  },
  {
    title: "Alternating Chores",
    content: "Sweeping & Mopping and Kitchen Cleaning alternate between us daily. Check the color to see whose turn it is!",
    Icon: RefreshCw
  },
  {
    title: "Weekly Chores",
    content: "Veranda Cleaning and Toilet & Bathroom are weekly. Look for the assigned days on the calendar.",
    Icon: CalendarCheck
  },
  {
    title: "Trash Tally",
    content: "There's no fixed schedule for trash. Whenever you take it out, tap the '+' button to add to your tally. We should be even by month end!",
    Icon: TrendingUp
  },
  {
    title: "Comments & Proof",
    content: "You can add comments and attach photos/videos to any chore. Use this if you need to show proof or leave a note.",
    Icon: MessageSquare
  },
  {
    title: "Strikes",
    content: "If someone doesn't complete a chore on time/doesn't do it properly, you can give them a strike with proof.",
    Icon: AlertTriangle
  },
  {
    title: "You're Ready!",
    content: "That's it! Now go be a responsible roommate. Good luck!",
    Icon: Rocket
  }
];

export function TutorialModal({ onComplete }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const { Icon } = step;
  
  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-6 w-full max-w-sm animate-bounce-in">
        <div className="text-center mb-6 sm:mb-6">
          <div className="mb-4 sm:mb-4 flex justify-center">
            <div className="w-20 h-20 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Icon size={48} className="text-blue-500 sm:w-12 sm:h-12" />
            </div>
          </div>
          <h2 className="text-xl sm:text-xl font-bold text-gray-800 mb-3">{step.title}</h2>
          <p className="text-base sm:text-base text-gray-600">{step.content}</p>
        </div>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2 sm:gap-2 mb-6 sm:mb-6">
          {tutorialSteps.map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentStep ? 'bg-blue-500 w-4 sm:w-4' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        <div className="flex gap-3 sm:gap-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="px-4 py-2.5 sm:px-4 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-all text-base sm:text-base"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3 sm:py-3 px-6 sm:px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all text-base sm:text-base"
          >
            {isLastStep ? "Let's Go!" : 'Next'}
          </button>
        </div>
        
        <p className="text-center text-gray-400 text-xs mt-4">
          Step {currentStep + 1} of {tutorialSteps.length}
        </p>
      </div>
    </div>
  );
}
