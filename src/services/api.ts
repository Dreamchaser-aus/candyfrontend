import { RankingEntry, GameResponse, UserProfile } from '../types/game';
import { API_BASE_URL } from '../config/gameConfig';

export const apiService = {
  // ✅ 获取用户资料
  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/profile?user_id=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  },

  // ✅ 提交游戏分数（应使用 /api/report_game）
  async submitScore(userId: string, score: number): Promise<GameResponse> {
    const payload = {
      user_id: userId,
      user_score: score,
      points_change: score,              // 可调整为实际积分规则
      token_change: -1,                  // 每局消耗 1 个 token
      game_type: 'candy_crush',
      level: 1,
      result: score >= 60 ? 'win' : 'lose',
      remark: 'Candy Crush 自动上报'
    };

    console.log("📤 Submitting score:", payload);  // ⬅️ 加在这里！

    const response = await fetch(`${API_BASE_URL}/api/report_game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || 'Failed to submit score');
      } catch (e) {
        throw new Error(errorText || 'Failed to submit score');
      }
    }

    return response.json();
  },

  // ✅ 获取排行榜
  async getRanking(): Promise<RankingEntry[]> {
    const response = await fetch(`${API_BASE_URL}/api/rank`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch ranking');
    }

    return response.json();
  }
};
