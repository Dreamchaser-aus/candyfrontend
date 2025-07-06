import { GameConfig } from '../types/game';

export const GAME_CONFIG: GameConfig = {
  GRID_SIZE: 8,
  CELL_SIZE: 60,
  COLORS: [
    '#FF6B35', // Bright Orange (Bitcoin)
    '#4A90E2', // Bright Blue (Ethereum) 
    '#FFD700', // Gold Yellow (Dogecoin)
    '#32CD32', // Lime Green (Tether)
    '#FF1493'  // Deep Pink (XRP)
  ],
  POINTS_PER_BLOCK: 10,
  GAME_TIME: 90,
  MAX_MOVES: 30
};

export const API_BASE_URL = 'https://candybackend-production.up.railway.app/admin';
