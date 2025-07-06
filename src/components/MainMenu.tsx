import React from 'react';
import { Play, Trophy, Settings, Info, Coins } from 'lucide-react';
import { UserData, UserProfile, GameResponse } from '../types/game';

interface MainMenuProps {
  userData: UserData;
  userProfile: UserProfile | null;
  gameResponse: GameResponse | null;
  isGuest: boolean;
  onPlayGame: () => void;
  onShowLeaderboard: () => void;
  onShowSettings: () => void;
  onShowHowToPlay: () => void;
  disabled?: boolean;
}

export function MainMenu({ 
  userData, 
  userProfile, 
  gameResponse, 
  isGuest, 
  onPlayGame, 
  onShowLeaderboard, 
  onShowSettings, 
  onShowHowToPlay,
  disabled 
}: MainMenuProps) {
  const currentToken = gameResponse?.token ?? userProfile?.token ?? (isGuest ? 'N/A' : '?');
  const currentPoints = gameResponse?.points ?? userProfile?.points ?? (isGuest ? 'N/A' : '?');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-400 via-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
              Crypto Crush Saga
            </span>
          </h1>
          <p className="text-gray-300 text-lg">Match the cryptos, crush the market!</p>
        </div>

        {/* User Stats */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-700/50">
            <span className="text-gray-300 text-sm">Token: </span>
            <span className={`font-bold ${isGuest ? 'text-gray-400' : 'text-yellow-400'}`}>
              {currentToken}
            </span>
          </div>
          <div className="bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-700/50">
            <span className="text-gray-300 text-sm">Points: </span>
            <span className={`font-bold ${isGuest ? 'text-gray-400' : 'text-green-400'}`}>
              {currentPoints}
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="mb-8 text-sm text-gray-400">
          {isGuest ? (
            <div className="bg-yellow-500/20 border border-yellow-500/30 px-4 py-2 rounded-lg">
              <p>💡 Playing as Guest</p>
              <p className="text-xs mt-1">Open in Telegram to save progress</p>
            </div>
          ) : userProfile ? (
            <p>Welcome back, {userProfile.username}!</p>
          ) : (
            <p>Loading user data...</p>
          )}
        </div>

        {/* Menu Buttons */}
        <div className="space-y-4 mb-12">
          <button
            onClick={onPlayGame}
            disabled={disabled}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 ${
              disabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-teal-500 hover:from-purple-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <Play size={24} />
            Play Game
          </button>

          <button
            onClick={onShowLeaderboard}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg bg-gray-700/80 hover:bg-gray-600/80 text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 border border-gray-600/50"
          >
            <Trophy size={24} />
            Leaderboard
          </button>

          <button
            onClick={onShowSettings}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg bg-gray-700/80 hover:bg-gray-600/80 text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 border border-gray-600/50"
          >
            <Settings size={24} />
            Settings
          </button>

          <button
            onClick={onShowHowToPlay}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg bg-gray-700/80 hover:bg-gray-600/80 text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 border border-gray-600/50"
          >
            <Info size={24} />
            How to Play
          </button>
        </div>

        {/* Crypto Icons - Updated to show only 5 cryptos */}
        <div className="text-center">
          <p className="text-gray-400 mb-4">Collect All Cryptos!</p>
          <div className="flex justify-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              ₿
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              Ξ
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              D
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              T
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              X
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}