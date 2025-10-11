import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface SignupNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

const mockSignups = [
  "John from New York",
  "Sarah from California", 
  "Mike from Texas",
  "Emma from Florida",
  "David from Illinois",
  "Lisa from Washington",
  "Alex from Colorado",
  "Jessica from Oregon"
];

export default function SignupNotification({ isVisible, onClose }: SignupNotificationProps) {
  const [currentSignup, setCurrentSignup] = useState("");

  useEffect(() => {
    if (isVisible) {
      const randomSignup = mockSignups[Math.floor(Math.random() * mockSignups.length)];
      setCurrentSignup(randomSignup);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                New Member Alert
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-[var(--chart-prime-orange)]">
                {currentSignup}
              </span> just joined Proud Profits
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}