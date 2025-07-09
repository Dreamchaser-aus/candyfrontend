import React from 'react';
import { Trophy, Clock, Zap, Award } from 'lucide-react';

interface GameStatsProps {
  gameHistory: number[];
  timeLeft: number;
  movesLeft: number;
}

export function GameStats({ gameHistory, timeLeft, movesLeft }: GameStatsProps) {
  const highScore = gameHistory.length > 0 ? Math.max(...gameHistory) : 0;

  return (
    <div className="flex justify-between gap-4 mb-6">
      {/* Last Score 移除 */}
      {/*
      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-2xl flex-1">
        <Trophy className="text-yellow-400" size={20} />
        <div className="text-white">
          <div className="text-xs opacity-80">Last Score</div>
          <div className="font-bold text-lg">{lastScore}</div>
        </div>
      </div>
      */}

      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-2xl flex-1">
        <Award className="text-orange-300" size={20} />
        <div className="text-white">
          <div className="text-xs opacity-80">High Score</div>
          <div className="font-bold text-lg">{highScore}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-2xl flex-1">
        <Clock className="text-blue-400" size={20} />
        <div className="text-white">
          <div className="text-xs opacity-80">Time</div>
          <div className="font-bold text-lg">{timeLeft}s</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-2xl flex-1">
        <Zap className="text-green-400" size={20} />
        <div className="text-white">
          <div className="text-xs opacity-80">Moves</div>
          <div className="font-bold text-lg">{movesLeft}</div>
        </div>
      </div>
    </div>
  );
}
