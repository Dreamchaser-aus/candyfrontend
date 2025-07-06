import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { RankingEntry } from '../types/game';
import { apiService } from '../services/api';
import { maskName } from '../utils/gameUtils';

export function Leaderboard() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        setLoading(true);
        const data = await apiService.getRanking();
        setRankings(data);
        setError(null);
      } catch (err) {
        setError('Failed to load rankings');
        console.error('Error loading rankings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="text-yellow-400" size={24} />
          <h3 className="text-xl font-bold text-white">🏆 总积分排行榜 (Top 10)</h3>
        </div>
        <div className="text-center text-white/70">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="text-yellow-400" size={24} />
          <h3 className="text-xl font-bold text-white">🏆 总积分排行榜 (Top 10)</h3>
        </div>
        <div className="text-center text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="text-yellow-400" size={24} />
        <h3 className="text-xl font-bold text-white">🏆 总积分排行榜 (Top 10)</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full bg-white/90 rounded-lg overflow-hidden">
          <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">名次</th>
              <th className="px-4 py-3 text-left font-semibold">用户名</th>
              <th className="px-4 py-3 text-right font-semibold">积分</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {rankings.map((entry, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-white/50' : 'bg-white/30'} hover:bg-white/70 transition-colors`}>
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-500' : 'text-gray-600'}`}>
                      {index + 1}
                    </span>
                    {index < 3 && (
                      <span className="text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{maskName(entry.username, entry.phone)}</td>
                <td className="px-4 py-3 text-right font-bold text-purple-600">{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}