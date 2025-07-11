import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Cell, UserData, UserProfile, SpecialCandy, FallingCandy } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { findSpecialMatches, removeInitialMatches, areAdjacent, cellsEqual, activateSpecialCandy } from '../utils/gameUtils';
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
  const [debugLog, setDebugLog] = useState('');
  const [removedCells, setRemovedCells] = useState<{ row: number; col: number }[]>([]);

const initializeGrid = useCallback(() => {
  const grid: (number | null)[][] = [];
  const specialCandies: SpecialCandy[][] = [];

  // --- 方式1：直接造一个5连横（第0行第0-4格全1，其它随机）
  for (let row = 0; row < GAME_CONFIG.GRID_SIZE; row++) {
    grid[row] = [];
    specialCandies[row] = [];
    for (let col = 0; col < GAME_CONFIG.GRID_SIZE; col++) {
      if (row === 0 && col < 5) {
        grid[row][col] = 1; // 5连
      } else {
        grid[row][col] = Math.floor(Math.random() * GAME_CONFIG.COLORS.length);
      }
      specialCandies[row][col] = { type: 'normal', color: grid[row][col]! };
    }
  }
  // 不需要调用 removeInitialMatches，这样 5 连一定会在开局出现
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
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [initializeGrid]);

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (userId === 'guest') return;
    
    try {
      console.log('Fetching user profile for:', userId);
      const profile = await apiService.getUserProfile(userId);
      console.log('User profile fetched:', profile);
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setIsGuest(true);
      setUserProfile(null);
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
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

  const endGame = useCallback(() => {
    setGameState(prev => {
      if (!isGuest && userData.id !== 'guest') {
        apiService.submitScore(userData.id, prev.score)
          .then(response => setGameResponse(response))
          .catch(error => console.error('Failed to submit score:', error));
        fetchUserProfile(userData.id);
      }
      return {
        ...prev,
        gameActive: false,
        gameHistory: [...(prev.gameHistory || []), prev.score]
      };
    });
  }, [userData.id, fetchUserProfile, isGuest]);

  // ULTIMATE FILL SYSTEM - GUARANTEED TO WORK
  const forceCompleteGrid = useCallback((grid: (number | null)[][], specialCandies: SpecialCandy[][]) => {
    console.log('🔧 FORCE COMPLETE GRID - Ensuring 100% filled grid');
    
    const newGrid = grid.map(row => [...row]);
    const newSpecialGrid = specialCandies.map(row => [...row]);
    
    // Step 1: Fill every single empty space immediately
    for (let row = 0; row < GAME_CONFIG.GRID_SIZE; row++) {
      for (let col = 0; col < GAME_CONFIG.GRID_SIZE; col++) {
        if (newGrid[row][col] === null) {
          const newColor = Math.floor(Math.random() * GAME_CONFIG.COLORS.length);
          newGrid[row][col] = newColor;
          newSpecialGrid[row][col] = { type: 'normal', color: newColor };
          console.log(`🔧 Force filled (${row},${col}) with color ${newColor}`);
        }
      }
    }
    
    // Step 2: Verify no empty spaces remain
    let emptyCount = 0;
    for (let row = 0; row < GAME_CONFIG.GRID_SIZE; row++) {
      for (let col = 0; col < GAME_CONFIG.GRID_SIZE; col++) {
        if (newGrid[row][col] === null) {
          emptyCount++;
        }
      }
    }
    
    console.log(`🔧 Force complete verification: ${emptyCount} empty spaces remaining`);
    
    return { newGrid, newSpecialGrid };
  }, []);

  // ENHANCED GRAVITY SYSTEM WITH IMMEDIATE FILL
const applyGravityAndFill = useCallback((grid: (number | null)[][], specialCandies: SpecialCandy[][]) => {
  console.log('🌊 Applying enhanced gravity and immediate fill...');

  const newGrid = grid.map(row => [...row]);
  const newSpecialGrid = specialCandies.map(row => row.map(s => ({ ...s }))); // 深拷贝每个special对象！

  // 遍历每一列
  for (let col = 0; col < GAME_CONFIG.GRID_SIZE; col++) {
    // 1. 收集现有糖果（包括special属性）
    const stack: { color: number, special: SpecialCandy }[] = [];
    for (let row = GAME_CONFIG.GRID_SIZE - 1; row >= 0; row--) {
      if (newGrid[row][col] !== null) {
        stack.push({
          color: newGrid[row][col]!,
          special: { ...newSpecialGrid[row][col] }
        });
      }
    }

    // 2. 从底部开始“掉落”原有糖果+special
    let fillRow = GAME_CONFIG.GRID_SIZE - 1;
    for (const item of stack) {
      newGrid[fillRow][col] = item.color;
      newSpecialGrid[fillRow][col] = { ...item.special };
      fillRow--;
    }

    // 3. 填充剩余空格，只有新生成的才是normal（避免覆盖special糖果）
    for (let row = fillRow; row >= 0; row--) {
      const newColor = Math.floor(Math.random() * GAME_CONFIG.COLORS.length);
      newGrid[row][col] = newColor;
      newSpecialGrid[row][col] = { type: 'normal', color: newColor };
      // 如果有特殊需求可以在此添加动画等
      console.log(`  ✨ Filled (${row},${col}) with new normal candy color ${newColor}`);
    }
  }

  // 最后安全兜底，保证每格都不是null
  const { newGrid: finalGrid, newSpecialGrid: finalSpecialGrid } = forceCompleteGrid(newGrid, newSpecialGrid);

  console.log('🌊 Gravity and fill complete - grid is now 100% filled');
  return { newGrid: finalGrid, newSpecialGrid: finalSpecialGrid };
}, [forceCompleteGrid]);
  // SIMPLIFIED CASCADE SYSTEM
  const processCascade = useCallback(() => {
  console.log('🌊 Starting simplified cascade system...');
  setGameState(prev => ({ ...prev, animating: true, fallingCandies: [] }));

  const processStep = () => {
    setGameState(prev => {
      console.log('🔍 Checking for matches...');
      // 这里返回同时包含 matches 和 newSpecialCandies
      const { matches, specialCandies: newSpecialCandies } = findSpecialMatches(prev.grid, GAME_CONFIG.GRID_SIZE);

      if (matches.length === 0) {
        console.log('✅ No more matches found, cascade complete');
        // FINAL SAFETY CHECK: Ensure grid is completely filled
        const { newGrid: safeGrid, newSpecialGrid: safeSpecialGrid } = forceCompleteGrid(prev.grid, prev.specialCandies);

        return {
          ...prev,
          grid: safeGrid,
          specialCandies: safeSpecialGrid,
          animating: false,
          fallingCandies: []
        };
      }

      console.log(`💥 Found ${matches.length} matches, ${newSpecialCandies.length} special candies`);

      const newGrid = prev.grid.map(row => [...row]);
      const newSpecialGrid = prev.specialCandies.map(row => [...row]);
      let newScore = prev.score;

      // Remove matched cells, 保留特殊糖果
      matches.forEach(match => {
        const special = newSpecialCandies.find(
          s => s.row === match.row && s.col === match.col
        );
        if (special) {
          // 生成特殊糖果，保留这个格子的 special 类型
          newSpecialGrid[match.row][match.col] = {
            type: special.type,
            color: newGrid[match.row][match.col]!
          };
          // 颜色可以不变，也可以设置特殊颜色
        } else {
          // 普通格子消除
          newGrid[match.row][match.col] = null;
          newSpecialGrid[match.row][match.col] = { type: 'normal', color: 0 };
        }
        newScore += GAME_CONFIG.POINTS_PER_BLOCK;
      });

      if (matches.length > 0) {
        setRemovedCells(matches);
        console.log('setRemovedCells: ', matches);
      }

      // Apply gravity and fill immediately
      const { newGrid: filledGrid, newSpecialGrid: filledSpecialGrid } =
        applyGravityAndFill(newGrid, newSpecialGrid);

      console.log(`📊 Score increased by ${newScore - prev.score} points`);

      const newState = {
        ...prev,
        grid: filledGrid,
        specialCandies: filledSpecialGrid,
        score: newScore,
        fallingCandies: []
      };

      // Continue cascade after a short delay
      setTimeout(processStep, 500);
      return newState;
    });
  };

  // Start the cascade
  setTimeout(processStep, 200);
}, [applyGravityAndFill, forceCompleteGrid]);

 const attemptSwap = useCallback((cell1: Cell, cell2: Cell) => {
  if (gameState.animating) {
    console.log('动画未结束，禁止操作！');
    return;
  }
  console.log(`🔄 Attempting swap: (${cell1.row},${cell1.col}) ↔ (${cell2.row},${cell2.col})`);

  if (!areAdjacent(cell1, cell2)) {
    console.log('❌ Cells are not adjacent');
    return;
  }

  setGameState(prev => {
    const newGrid = prev.grid.map(row => [...row]);
    const newSpecialGrid = prev.specialCandies.map(row => [...row]);

    // 获取两个位置的 special 类型
    const special1 = prev.specialCandies[cell1.row][cell1.col];
    const special2 = prev.specialCandies[cell2.row][cell2.col];

    // 1. Color bomb 逻辑（色球交换）
    if (special1.type === 'color-bomb' || special2.type === 'color-bomb') {
      let cellsToRemove: { row: number; col: number }[] = [];

      if (special1.type === 'color-bomb') {
        const targetColor = newGrid[cell2.row][cell2.col];
        const removed = activateSpecialCandy(newGrid, newSpecialGrid, cell1.row, cell1.col, GAME_CONFIG.GRID_SIZE, targetColor);
        cellsToRemove = cellsToRemove.concat(removed);
      }
      if (special2.type === 'color-bomb') {
        const targetColor = newGrid[cell1.row][cell1.col];
        const removed = activateSpecialCandy(newGrid, newSpecialGrid, cell2.row, cell2.col, GAME_CONFIG.GRID_SIZE, targetColor);
        cellsToRemove = cellsToRemove.concat(removed);
      }
      // Remove duplicates
      const uniqueCells = cellsToRemove.filter((cell, idx, self) =>
        idx === self.findIndex(c => c.row === cell.row && c.col === cell.col)
      );
      if (uniqueCells.length > 0) {
        setRemovedCells(uniqueCells);
        setTimeout(() => {
          setGameState(prev => {
            let newGrid = prev.grid.map(row => [...row]);
            let newSpecialGrid = prev.specialCandies.map(row => [...row]);
            let newScore = prev.score;
            uniqueCells.forEach(cell => {
              if (newGrid[cell.row][cell.col] !== null) {
                newGrid[cell.row][cell.col] = null;
                newSpecialGrid[cell.row][cell.col] = { type: 'normal', color: 0 };
                newScore += GAME_CONFIG.POINTS_PER_BLOCK * 3;
              }
            });
            setRemovedCells([]);
            setTimeout(() => processCascade(), 150);
            return {
              ...prev,
              grid: newGrid,
              specialCandies: newSpecialGrid,
              score: newScore,
              movesLeft: prev.movesLeft - 1,
              selectedCell: null,
              dragStart: null,
              fallingCandies: []
            };
          });
        }, 300);
        return prev;
      }
      let newScore = prev.score;
      uniqueCells.forEach(cell => {
        if (newGrid[cell.row][cell.col] !== null) {
          newGrid[cell.row][cell.col] = null;
          newSpecialGrid[cell.row][cell.col] = { type: 'normal', color: 0 };
          newScore += GAME_CONFIG.POINTS_PER_BLOCK * 3;
        }
      });
      if (uniqueCells.length > 0) setRemovedCells(uniqueCells);
      const newState = {
        ...prev,
        grid: newGrid,
        specialCandies: newSpecialGrid,
        score: newScore,
        movesLeft: prev.movesLeft - 1,
        selectedCell: null,
        dragStart: null,
        fallingCandies: []
      };
      setTimeout(() => processCascade(), 150);
      return newState;
    }

    // 2. 其它特殊糖果激活（横/竖/包裹等）
    if (special1.type !== 'normal' || special2.type !== 'normal') {
      let cellsToRemove: { row: number; col: number }[] = [];
      if (special1.type !== 'normal' && special1.type !== 'color-bomb') {
        const removed = activateSpecialCandy(newGrid, newSpecialGrid, cell1.row, cell1.col, GAME_CONFIG.GRID_SIZE);
        cellsToRemove = cellsToRemove.concat(removed);
      }
      if (special2.type !== 'normal' && special2.type !== 'color-bomb') {
        const removed = activateSpecialCandy(newGrid, newSpecialGrid, cell2.row, cell2.col, GAME_CONFIG.GRID_SIZE);
        cellsToRemove = cellsToRemove.concat(removed);
      }
      // Remove duplicates
      const uniqueCells = cellsToRemove.filter((cell, idx, self) =>
        idx === self.findIndex(c => c.row === cell.row && c.col === cell.col)
      );
      let newScore = prev.score;
      uniqueCells.forEach(cell => {
        if (newGrid[cell.row][cell.col] !== null) {
          newGrid[cell.row][cell.col] = null;
          newSpecialGrid[cell.row][cell.col] = { type: 'normal', color: 0 };
          newScore += GAME_CONFIG.POINTS_PER_BLOCK * 2;
        }
      });
      const newState = {
        ...prev,
        grid: newGrid,
        specialCandies: newSpecialGrid,
        score: newScore,
        movesLeft: prev.movesLeft - 1,
        selectedCell: null,
        dragStart: null,
        fallingCandies: []
      };
      setTimeout(() => processCascade(), 150);
      return newState;
    }

    // 3. 普通消除：核心改动在这里
    // 交换
    const temp = newGrid[cell1.row][cell1.col];
    newGrid[cell1.row][cell1.col] = newGrid[cell2.row][cell2.col];
    newGrid[cell2.row][cell2.col] = temp;

    const tempSpecial = newSpecialGrid[cell1.row][cell1.col];
    newSpecialGrid[cell1.row][cell1.col] = newSpecialGrid[cell2.row][cell2.col];
    newSpecialGrid[cell2.row][cell2.col] = tempSpecial;

    // 找消除和特殊糖果
    const { matches, specialCandies: newSpecialCandies } = findSpecialMatches(newGrid, GAME_CONFIG.GRID_SIZE);

    // 关键：把新生成的特殊糖果信息写入 specialCandies 数组
    newSpecialCandies.forEach(special => {
      newSpecialGrid[special.row][special.col] = {
        type: special.type,
        color: newGrid[special.row][special.col]!
      };
    });

    if (matches.length === 0) {
      // 没消除，回退
      const temp = newGrid[cell1.row][cell1.col];
      newGrid[cell1.row][cell1.col] = newGrid[cell2.row][cell2.col];
      newGrid[cell2.row][cell2.col] = temp;
      const tempSpecial = newSpecialGrid[cell1.row][cell1.col];
      newSpecialGrid[cell1.row][cell1.col] = newSpecialGrid[cell2.row][cell2.col];
      newSpecialGrid[cell2.row][cell2.col] = tempSpecial;
      return prev;
    } else {
      // 有消除，推进游戏
      console.log('✅ Valid move! Found', matches.length, 'matches');
      const newState = {
        ...prev,
        grid: newGrid,
        specialCandies: newSpecialGrid,
        movesLeft: prev.movesLeft - 1,
        selectedCell: null,
        dragStart: null,
        fallingCandies: []
      };
      setTimeout(() => processCascade(), 150);
      return newState;
    }
  });
}, [processCascade]);

  const startGame = useCallback(() => {
    if (!userProfile || userProfile.token <= 0) {
      alert("🚫 You don't have enough tokens to start the game.");
      return;
    }

    console.log('🎮 Starting game!');
    setGameState(prev => ({ ...prev, gameActive: true, gamePaused: false }));
    startTimer();
  }, [userProfile, startTimer]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gamePaused: true }));
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gamePaused: false }));
    startTimer();
  }, [startTimer]);

  // Initialize Telegram user
  useEffect(() => {
    console.log('Checking for Telegram WebApp...');
    
    if (window.Telegram?.WebApp) {
      console.log('Telegram WebApp detected');
      window.Telegram.WebApp.ready();
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
      
      if (tgUser?.id) {
        const userId = tgUser.id.toString();
        console.log('Telegram user detected:', userId, tgUser);
        setUserData({ id: userId });
        setIsGuest(false);
        fetchUserProfile(userId);
      } else {
        console.log('Telegram WebApp available but no user data found - using guest mode');
        setUserData({ id: 'guest' });
        setIsGuest(true);
        setUserProfile(null);
      }
    } else {
      console.log('Telegram WebApp not available - using guest mode');
      setUserData({ id: 'guest' });
      setIsGuest(true);
      setUserProfile(null);
    }
  }, [fetchUserProfile]);

  // Initialize game
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check for game end
  useEffect(() => {
    if (gameState.timeLeft <= 0 || gameState.movesLeft <= 0) {
      console.log("⏰ Game ended, calling endGame()");
      endGame();
    }
  }, [gameState.timeLeft, gameState.movesLeft]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
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
    setGameState,
    debugLog,
    removedCells,
    setRemovedCells,
  };
}
