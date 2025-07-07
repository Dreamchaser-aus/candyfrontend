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
    const params = new URLSearchParams({
      user_id: userId,
      score: String(score),
      game_name: "candy_crush"
    });

    const response = await fetch(`${API_BASE_URL}/play`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json();
  }；

  // ✅ 获取排行榜
  async getRanking(): Promise<RankingEntry[]> {
    const response = await fetch(`${API_BASE_URL}/api/rank`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch ranking');
    }

    return response.json();
  }
};
