export interface GameState {
  grid: (number | null)[][];
  score: number;
  timeLeft: number;
  movesLeft: number;
  gameActive: boolean;
  gamePaused: boolean;
  animating: boolean;
  selectedCell: Cell | null;
  dragStart: Cell | null;
}

export interface Cell {
  row: number;
  col: number;
}

export interface Match {
  row: number;
  col: number;
}

export interface UserData {
  id: string;
  username?: string;
  phone?: string;
}

export interface UserProfile {
  user_id: number;
  username: string;
  phone: string;
  points: number;
  token: number;
  plays: number;
}

export interface GameConfig {
  GRID_SIZE: number;
  CELL_SIZE: number;
  COLORS: string[];
  POINTS_PER_BLOCK: number;
  GAME_TIME: number;
  MAX_MOVES: number;
}

export interface RankingEntry {
  username?: string;
  phone?: string;
  points: number;
}

export interface GameResponse {
  points: number;
  token: number;  // ✅ 修正类型
  score: number;
  result: string;
}

export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramWebApp {
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  ready(): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
