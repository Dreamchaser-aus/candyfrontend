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
      } catch (error) {
        console.error('Failed to submit score:', error);
      }
    } else {
      console.log('Guest mode - score not submitted to server');
    }
  }, [userData.id, gameState.score, fetchUserProfile, isGuest]);

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
    const newSpecialGrid = specialCandies.map(row => [...row]);
    
    // Process each column
    for (let col = 0; col < GAME_CONFIG.GRID_SIZE; col++) {
      console.log(`🔄 Processing column ${col}...`);
      
      // Collect all existing candies from bottom to top
      const existingCandies: Array<{
        candy: number;
        special: SpecialCandy;
      }> = [];

      for (let row = GAME_CONFIG.GRID_SIZE - 1; row >= 0; row--) {
        if (newGrid[row][col] !== null) {
          existingCandies.push({
            candy: newGrid[row][col]!,
            special: newSpecialGrid[row][col]
          });
        }
      }

      console.log(`  📦 Found ${existingCandies.length} existing candies in column ${col}`);

      // Clear the entire column
      for (let row = 0; row < GAME_CONFIG.GRID_SIZE; row++) {
        newGrid[row][col] = null;
        newSpecialGrid[row][col] = { type: 'normal', color: 0 };
      }

      // Place existing candies at bottom
      existingCandies.forEach((item, index) => {
        const targetRow = GAME_CONFIG.GRID_SIZE - 1 - index;
        newGrid[targetRow][col] = item.candy;
        newSpecialGrid[targetRow][col] = item.special;
        console.log(`  ⬇️ Placed existing candy at row ${targetRow}`);
      });

      // Fill remaining spaces with new candies
      const emptySpaces = GAME_CONFIG.GRID_SIZE - existingCandies.length;
      console.log(`  🆕 Filling ${emptySpaces} empty spaces in column ${col}`);
      
      for (let i = 0; i < emptySpaces; i++) {
        const newColor = Math.floor(Math.random() * GAME_CONFIG.COLORS.length);
        const targetRow = i;
        newGrid[targetRow][col] = newColor;
        newSpecialGrid[targetRow][col] = { type: 'normal', color: newColor };
        console.log(`  ✨ Filled row ${targetRow} with new candy (color ${newColor})`);
      }
    }

    // CRITICAL: Force complete any remaining empty spaces
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
        const { matches, specialCandies: newSpecialCandies } = findSpecialMatches(prev.grid, GAME_CONFIG.GRID_SIZE);

        setDebugLog(`判定 matches: ${matches.length}, 例如首格: (${matches[0]?.row},${matches[0]?.col})`);

        console.log('当前棋盘：', prev.grid);
        console.log('判定 matches:', matches);
        console.log('准备消除 matches:', matches.map(m => `(${m.row},${m.col})`));
        
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

        // Create special candies first
        const specialPositions = new Set<string>();
        newSpecialCandies.forEach(special => {
          console.log(`🍭 Creating special candy: ${special.type} at (${special.row},${special.col})`);
          newSpecialGrid[special.row][special.col] = {
            type: special.type,
            color: newGrid[special.row][special.col]!
          };
          specialPositions.add(`${special.row},${special.col}`);
        });

        // Remove matched cells (except special candy positions)
        matches.forEach(match => {
          if (!specialPositions.has(`${match.row},${match.col}`)) {
            newGrid[match.row][match.col] = null;
            newScore += GAME_CONFIG.POINTS_PER_BLOCK;
          }
        });

        // Apply gravity and fill immediately
        const { newGrid: filledGrid, newSpecialGrid: filledSpecialGrid } = 
          applyGravityAndFill(newGrid, newSpecialGrid);

        console.log(`📊 Score increased by ${newScore - prev.score} points`);

        const newState = {
          ...prev,
          grid: filledGrid,
          specialCandies: filledSpecialGrid,
          score: newScore,
          fallingCandies: [] // No falling animations, immediate fill
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
      
      // Check if either cell has a special candy
      const special1 = prev.specialCandies[cell1.row][cell1.col];
      const special2 = prev.specialCandies[cell2.row][cell2.col];
      
      // SPECIAL CASE: Color bomb activation
      if (special1.type === 'color-bomb' || special2.type === 'color-bomb') {
        console.log('💣 COLOR BOMB ACTIVATION!');
        let cellsToRemove: { row: number; col: number }[] = [];
        
        if (special1.type === 'color-bomb') {
          // Color bomb removes all candies of the color it was swapped with
          const targetColor = newGrid[cell2.row][cell2.col];
          console.log(`💣 Color bomb at (${cell1.row},${cell1.col}) targeting color ${targetColor}`);
          const removed = activateSpecialCandy(newGrid, newSpecialGrid, cell1.row, cell1.col, GAME_CONFIG.GRID_SIZE, targetColor);
          cellsToRemove = cellsToRemove.concat(removed);
        }
        
        if (special2.type === 'color-bomb') {
          // Color bomb removes all candies of the color it was swapped with
          const targetColor = newGrid[cell1.row][cell1.col];
          console.log(`💣 Color bomb at (${cell2.row},${cell2.col}) targeting color ${targetColor}`);
          const removed = activateSpecialCandy(newGrid, newSpecialGrid, cell2.row, cell2.col, GAME_CONFIG.GRID_SIZE, targetColor);
          cellsToRemove = cellsToRemove.concat(removed);
        }
        
        // Remove duplicate cells
        const uniqueCells = cellsToRemove.filter((cell, index, self) => 
          index === self.findIndex(c => c.row === cell.row && c.col === cell.col)
        );
        
        console.log(`💣 Color bomb will remove ${uniqueCells.length} cells`);
        
        // Remove cells and calculate score
        let newScore = prev.score;
        uniqueCells.forEach(cell => {
          if (newGrid[cell.row][cell.col] !== null) {
            newGrid[cell.row][cell.col] = null;
            newSpecialGrid[cell.row][cell.col] = { type: 'normal', color: 0 };
            newScore += GAME_CONFIG.POINTS_PER_BLOCK * 3; // Color bomb gives triple points
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
      
      // Handle other special candy activation (striped, wrapped)
      if (special1.type !== 'normal' || special2.type !== 'normal') {
        console.log('🎆 Activating other special candies!');
        let cellsToRemove: { row: number; col: number }[] = [];
        
        if (special1.type !== 'normal' && special1.type !== 'color-bomb') {
          const removed = activateSpecialCandy(newGrid, newSpecialGrid, cell1.row, cell1.col, GAME_CONFIG.GRID_SIZE);
          cellsToRemove = cellsToRemove.concat(removed);
        }
        
        if (special2.type !== 'normal' && special2.type !== 'color-bomb') {
          const removed = activateSpecialCandy(newGrid, newSpecialGrid, cell2.row, cell2.col, GAME_CONFIG.GRID_SIZE);
          cellsToRemove = cellsToRemove.concat(removed);
        }
        
        // Remove duplicate cells
        const uniqueCells = cellsToRemove.filter((cell, index, self) => 
          index === self.findIndex(c => c.row === cell.row && c.col === cell.col)
        );
        
        console.log(`🎆 Special candy activation will remove ${uniqueCells.length} cells`);
        
        // Remove cells and calculate score
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
      
      // Regular swap
      const temp = newGrid[cell1.row][cell1.col];
      newGrid[cell1.row][cell1.col] = newGrid[cell2.row][cell2.col];
      newGrid[cell2.row][cell2.col] = temp;
      
      const tempSpecial = newSpecialGrid[cell1.row][cell1.col];
      newSpecialGrid[cell1.row][cell1.col] = newSpecialGrid[cell2.row][cell2.col];
      newSpecialGrid[cell2.row][cell2.col] = tempSpecial;
      
      // Check for matches
      const { matches } = findSpecialMatches(newGrid, GAME_CONFIG.GRID_SIZE);
      
      if (matches.length === 0) {
        console.log('❌ No matches found, reverting swap');
        // No matches, swap back
        const temp = newGrid[cell1.row][cell1.col];
        newGrid[cell1.row][cell1.col] = newGrid[cell2.row][cell2.col];
        newGrid[cell2.row][cell2.col] = temp;
        
        const tempSpecial = newSpecialGrid[cell1.row][cell1.col];
        newSpecialGrid[cell1.row][cell1.col] = newSpecialGrid[cell2.row][cell2.col];
        newSpecialGrid[cell2.row][cell2.col] = tempSpecial;
        
        return prev;
      } else {
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
    debugLog
  };
}
