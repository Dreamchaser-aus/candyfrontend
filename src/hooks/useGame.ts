import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Cell, UserData, UserProfile, SpecialCandy } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { findSpecialMatches, removeInitialMatches, areAdjacent, activateSpecialCandy } from '../utils/gameUtils';
import { apiService } from '../services/api';

export function useGame() {
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    score: 0,
    gameHistory: [],
    timeLeft: GAME_CONFIG.GAME_TIME,
    movesLeft: GAME_CONFIG.MAX_MOVES,
    gameActive: false,
    gamePaused: true,
    animating: false,
    selectedCell: null,
    dragStart: null,
    specialCandies: [],
    fallingCandies: []
  });

  const [userData, setUserData] = useState<UserData>({ id: 'guest' });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [gameResponse, setGameResponse] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initializeGrid = useCallback(() => {
    const grid: (number | null)[][] = [];
    const specialCandies: SpecialCandy[][] = [];
    for (let row = 0; row < GAME_CONFIG.GRID_SIZE; row++) {
      grid[row] = [];
      specialCandies[row] = [];
      for (let col = 0; col < GAME_CONFIG.GRID_SIZE; col++) {
        grid[row][col] = Math.floor(Math.random() * GAME_CONFIG.COLORS.length);
        specialCandies[row][col] = { type: 'normal', color: grid[row][col]! };
      }
    }
    removeInitialMatches(grid, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.COLORS);
    return { grid, specialCandies };
  }, []);

  const initGame = useCallback(() => {
    const { grid, specialCandies } = initializeGrid();
    setGameState({
      grid,
      specialCandies,
      score: 0,
      gameHistory: [],
      timeLeft: GAME_CONFIG.GAME_TIME,
      movesLeft: GAME_CONFIG.MAX_MOVES,
      gameActive: false,
      gamePaused: true,
      animating: false,
      selectedCell: null,
      dragStart: null,
      fallingCandies: []
    });
    if (timerRef.current) clearInterval(timerRef.current);
  }, [initializeGrid]);

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (userId === 'guest') return;
    try {
      const profile = await apiService.getUserProfile(userId);
      setUserProfile(profile);
    } catch {
      setIsGuest(true);
      setUserProfile(null);
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev.gameActive || prev.gamePaused) return prev;
        const newTimeLeft = prev.timeLeft - 1;
        if (newTimeLeft <= 0) {
          return { ...prev, timeLeft: 0, gameActive: false };
        }
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);
  }, []);

  const endGame = useCallback(async () => {
    setGameState(prev => ({
      ...prev,
      gameActive: false,
      gameHistory: [...(prev.gameHistory || []), prev.score]
    }));
    if (!isGuest && userData.id !== 'guest') {
      try {
        const response = await apiService.submitScore(userData.id, gameState.score);
        setGameResponse(response);
        await fetchUserProfile(userData.id);
      } catch {}
    }
  }, [userData.id, gameState.score, fetchUserProfile, isGuest]);

  // 填满所有空格
  const forceCompleteGrid = useCallback((grid: (number | null)[][], specialCandies: SpecialCandy[][]) => {
    const newGrid = grid.map(row => [...row]);
    const newSpecialGrid = specialCandies.map(row => [...row]);
    for (let row = 0; row < GAME_CONFIG.GRID_SIZE; row++) {
      for (let col = 0; col < GAME_CONFIG.GRID_SIZE; col++) {
        if (newGrid[row][col] === null) {
          const newColor = Math.floor(Math.random() * GAME_CONFIG.COLORS.length);
          newGrid[row][col] = newColor;
          newSpecialGrid[row][col] = { type: 'normal', color: newColor };
        }
      }
    }
    return { newGrid, newSpecialGrid };
  }, []);

  // 重写消除与下落，解决动画卡死
  const applyGravityAndFill = useCallback((grid: (number | null)[][], specialCandies: SpecialCandy[][]) => {
    const newGrid = grid.map(row => [...row]);
    const newSpecialGrid = specialCandies.map(row => [...row]);
    for (let col = 0; col < GAME_CONFIG.GRID_SIZE; col++) {
      const existing: Array<{ candy: number, special: SpecialCandy }> = [];
      for (let row = GAME_CONFIG.GRID_SIZE - 1; row >= 0; row--) {
        if (newGrid[row][col] !== null) {
          existing.push({ candy: newGrid[row][col]!, special: newSpecialGrid[row][col] });
        }
      }
      // 填到底部
      for (let row = GAME_CONFIG.GRID_SIZE - 1, idx = 0; row >= 0; row--, idx++) {
        if (idx < existing.length) {
          newGrid[row][col] = existing[idx].candy;
          newSpecialGrid[row][col] = existing[idx].special;
        } else {
          newGrid[row][col] = null;
          newSpecialGrid[row][col] = { type: 'normal', color: 0 };
        }
      }
      // 顶部空出补新糖果
      for (let row = 0; row < GAME_CONFIG.GRID_SIZE; row++) {
        if (newGrid[row][col] === null) {
          const newColor = Math.floor(Math.random() * GAME_CONFIG.COLORS.length);
          newGrid[row][col] = newColor;
          newSpecialGrid[row][col] = { type: 'normal', color: newColor };
        }
      }
    }
    const { newGrid: finalGrid, newSpecialGrid: finalSpecialGrid } = forceCompleteGrid(newGrid, newSpecialGrid);
    return { newGrid: finalGrid, newSpecialGrid: finalSpecialGrid };
  }, [forceCompleteGrid]);

  // 防止 setState 死锁的 cascade 实现
  const processCascade = useCallback(() => {
    let grid = gameState.grid.map(row => [...row]);
    let specialCandies = gameState.specialCandies.map(row => [...row]);
    let score = gameState.score;

    setGameState(prev => ({ ...prev, animating: true }));

    function step() {
      const { matches, specialCandies: newSpecials } = findSpecialMatches(grid, GAME_CONFIG.GRID_SIZE);
      if (matches.length === 0) {
        const { newGrid, newSpecialGrid } = forceCompleteGrid(grid, specialCandies);
        setGameState(prev => ({
          ...prev,
          grid: newGrid,
          specialCandies: newSpecialGrid,
          score,
          animating: false,
          fallingCandies: []
        }));
        return;
      }
      // 产生特殊糖果
      newSpecials.forEach(special => {
        specialCandies[special.row][special.col] = {
          type: special.type,
          color: grid[special.row][special.col]!
        };
      });
      // 消除
      matches.forEach(match => {
        grid[match.row][match.col] = null;
        score += GAME_CONFIG.POINTS_PER_BLOCK;
      });
      // 下落补新
      const filled = applyGravityAndFill(grid, specialCandies);
      grid = filled.newGrid;
      specialCandies = filled.newSpecialGrid;
      setTimeout(step, 300);
    }
    setTimeout(step, 100);
  }, [gameState.grid, gameState.specialCandies, gameState.score, applyGravityAndFill, forceCompleteGrid]);

  const attemptSwap = useCallback((cell1: Cell, cell2: Cell) => {
    // 防止动画未结束时操作
    if (gameState.animating) return;
    if (!areAdjacent(cell1, cell2)) return;

    setGameState(prev => {
      const newGrid = prev.grid.map(row => [...row]);
      const newSpecialGrid = prev.specialCandies.map(row => [...row]);
      // 特殊糖果逻辑略，如有需求可加（保持和你原本一致）
      // 普通交换
      const temp = newGrid[cell1.row][cell1.col];
      newGrid[cell1.row][cell1.col] = newGrid[cell2.row][cell2.col];
      newGrid[cell2.row][cell2.col] = temp;
      const tempSpecial = newSpecialGrid[cell1.row][cell1.col];
      newSpecialGrid[cell1.row][cell1.col] = newSpecialGrid[cell2.row][cell2.col];
      newSpecialGrid[cell2.row][cell2.col] = tempSpecial;
      // 是否有消除
      const { matches } = findSpecialMatches(newGrid, GAME_CONFIG.GRID_SIZE);
      if (matches.length === 0) {
        // 没有则还原
        const t = newGrid[cell1.row][cell1.col];
        newGrid[cell1.row][cell1.col] = newGrid[cell2.row][cell2.col];
        newGrid[cell2.row][cell2.col] = t;
        const ts = newSpecialGrid[cell1.row][cell1.col];
        newSpecialGrid[cell1.row][cell1.col] = newSpecialGrid[cell2.row][cell2.col];
        newSpecialGrid[cell2.row][cell2.col] = ts;
        return prev;
      } else {
        setTimeout(() => processCascade(), 150);
        return {
          ...prev,
          grid: newGrid,
          specialCandies: newSpecialGrid,
          movesLeft: prev.movesLeft - 1,
          selectedCell: null,
          dragStart: null,
          fallingCandies: []
        };
      }
    });
  }, [processCascade, gameState.animating]);

  const startGame = useCallback(() => {
    if (!userProfile || userProfile.token <= 0) {
      alert("🚫 You don't have enough tokens to start the game.");
      return;
    }
    setGameState(prev => ({ ...prev, gameActive: true, gamePaused: false }));
    startTimer();
  }, [userProfile, startTimer]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gamePaused: true }));
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gamePaused: false }));
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
      if (tgUser?.id) {
        const userId = tgUser.id.toString();
        setUserData({ id: userId });
        setIsGuest(false);
        fetchUserProfile(userId);
      } else {
        setUserData({ id: 'guest' });
        setIsGuest(true);
        setUserProfile(null);
      }
    } else {
      setUserData({ id: 'guest' });
      setIsGuest(true);
      setUserProfile(null);
    }
  }, [fetchUserProfile]);

  useEffect(() => { initGame(); }, [initGame]);
  useEffect(() => {
    if (gameState.timeLeft <= 0 || gameState.movesLeft <= 0) {
      endGame();
    }
  }, [gameState.timeLeft, gameState.movesLeft, endGame]);
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return {
    gameState,
    userData,
    userProfile,
    gameResponse,
    isGuest,
    initGame,
    startGame,
    pauseGame,
    resumeGame,
    attemptSwap,
    setGameState
  };
}
