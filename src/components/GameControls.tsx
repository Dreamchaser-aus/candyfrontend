import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface GameControlsProps {
  gameActive: boolean;
  gamePaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  disabled?: boolean; // ✅ 新增
}

export function GameControls({ gameActive, gamePaused, onStart, onPause, onResume, onRestart, disabled }: GameControlsProps) {
  const getButtonContent = () => {
    if (!gameActive) return (<><Play size={20} />Start Game</>);
    if (gamePaused) return (<><Play size={20} />Continue</>);
    return (<><Pause size={20} />Pause</>);
  };

  const handleMainButtonClick = () => {
    if (!gameActive && disabled) return;
    if (!gameActive) onStart();
    else if (gamePaused) onResume();
    else onPause();
  };

  return (
    <div className="flex gap-4 justify-center mb-6">
      <button
        onClick={handleMainButtonClick}
        disabled={!gameActive && disabled}
        className={`${!gameActive && disabled
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'}
          font-bold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2`}
      >
        {getButtonContent()}
      </button>

      <button
        onClick={onRestart}
        className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
      >
        <RotateCcw size={20} />
        Restart
      </button>
    </div>
  );
}
