import React from 'react';
import { Candy } from 'lucide-react';
import { UserData, UserProfile, GameResponse } from '../types/game';

interface GameHeaderProps {
  userData: UserData;
  userProfile: UserProfile | null;
  gameResponse: GameResponse | null;
  isGuest: boolean;
}

export function GameHeader({ userData, userProfile, gameResponse, isGuest }: GameHeaderProps) {
  // Use gameResponse values if available (after game), otherwise use userProfile values
  const currentToken = gameResponse?.token ?? userProfile?.token ?? (isGuest ? 'N/A' : '?');
  const currentPoints = gameResponse?.points ?? userProfile?.points ?? (isGuest ? 'N/A' : '?');

  return (
    <div className="text-center mb-6">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Candy className="text-4xl text-pink-400" size={48} />
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          Crypto Crush
        </h1>
      </div>
      
      <div className="flex justify-center gap-6 text-sm text-white/90">
        <div className="bg-gray-700/60 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-600/50">
          <span className="font-medium">Token: </span>
          <span className={`${isGuest ? 'text-gray-400' : 'text-yellow-300'}`}>
            {currentToken}
          </span>
        </div>
        <div className="bg-gray-700/60 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-600/50">
          <span className="font-medium">Points: </span>
          <span className={`${isGuest ? 'text-gray-400' : 'text-green-300'}`}>
            {currentPoints}
          </span>
        </div>
      </div>
    </div>
  );
}