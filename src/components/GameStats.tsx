import React from 'react';
import { Clock, Zap, Award } from 'lucide-react';

interface GameStatsProps {
  highScore: number;
  timeLeft: number;
  movesLeft: number;
  score: number;
}

export function GameStats({ highScore, timeLeft, movesLeft, score }: GameStatsProps) {
  return (
    <div className="flex justify-between gap-4 mb-6">
      {/* 当前分数 Points */}
      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-2xl flex-1">
        <Award className="text-yellow-400" size={20} />
        <div className="text-white">
          <div className="text-xs opacity-80">Points</div>
          <div className="font-bold text-lg">{score}</div>
        </div>
      </div>
      {/* 时间 Time */}
      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-2xl flex-1">
        <Clock className="text-blue-400" size={20} />
        <div className="text-white">
          <div className="text-xs opacity-80">Time</div>
          <div className="font-bold text-lg">{timeLeft}s</div>
        </div>
      </div>
      {/* 步数 Moves */}
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
