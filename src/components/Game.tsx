import React, { useCallback, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { GameHeader } from './GameHeader';
import { GameStats } from './GameStats';
import { GameControls } from './GameControls';
import { GameCanvas } from './GameCanvas';
import { GameOverModal } from './GameOverModal';
import { Leaderboard } from './Leaderboard';
import { MainMenu } from './MainMenu';
import { Cell } from '../types/game';

export function Game() {
  const [currentView, setCurrentView] = useState<'menu' | 'game' | 'leaderboard' | 'settings' | 'howto'>('menu');
  
  const {
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
  } = useGame();

  const handleCellInteraction = useCallback((from: Cell, to: Cell) => {
    attemptSwap(from, to);
  }, [attemptSwap]);

  const handleCellSelect = useCallback((cell: Cell | null) => {
    setGameState(prev => ({ ...prev, selectedCell: cell }));
  }, [setGameState]);

  const handleDragStart = useCallback((cell: Cell | null) => {
    setGameState(prev => ({ ...prev, dragStart: cell }));
  }, [setGameState]);

  const handleRestart = useCallback(() => {
    initGame();
  }, [initGame]);

  const handlePlayGame = useCallback(() => {
    setCurrentView('game');
    // Don't start the game automatically, just show the game layout
  }, []);

  const handleBackToMenu = useCallback(() => {
    setCurrentView('menu');
    if (gameState.gameActive) {
      pauseGame();
    }
  }, [gameState.gameActive, pauseGame]);

  if (currentView === 'menu') {
    return (
      <MainMenu
        userData={userData}
        userProfile={userProfile}
        gameResponse={gameResponse}
        isGuest={isGuest}
        onPlayGame={handlePlayGame}
        onShowLeaderboard={() => setCurrentView('leaderboard')}
        onShowSettings={() => setCurrentView('settings')}
        onShowHowToPlay={() => setCurrentView('howto')}
        disabled={!userProfile || userProfile.token === 0}
      />
    );
  }

  if (currentView === 'leaderboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-700/50 max-w-2xl w-full">
          <button
            onClick={handleBackToMenu}
            className="mb-6 text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Menu
          </button>
          <Leaderboard />
        </div>
      </div>
    );
  }

  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-700/50 max-w-2xl w-full">
          <button
            onClick={handleBackToMenu}
            className="mb-6 text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Menu
          </button>
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-gray-400">Settings panel coming soon...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'howto') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-700/50 max-w-2xl w-full">
          <button
            onClick={handleBackToMenu}
            className="mb-6 text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Menu
          </button>
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-6">How to Play</h2>
            <div className="text-left space-y-4 text-gray-300">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2">🎯 Objective</h3>
                <p>Match 3 or more identical candies in a row or column to score points!</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2">🎮 Controls</h3>
                <p>Drag and drop candies to swap adjacent pieces. Create matches to earn points.</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2">⏰ Time Limit</h3>
                <p>You have limited time and moves. Make them count!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-700/50 max-w-2xl w-full">
        <button
          onClick={handleBackToMenu}
          className="mb-4 text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Menu
        </button>
        
        <GameHeader 
          userData={userData} 
          userProfile={userProfile}
          gameResponse={gameResponse}
          isGuest={isGuest}
        />
        
        <GameStats 
          gameHistory={gameState.gameHistory || []} // 防止 undefined
          timeLeft={gameState.timeLeft}
          movesLeft={gameState.movesLeft}
        />

        
        <GameControls
          gameActive={gameState.gameActive}
          gamePaused={gameState.gamePaused}
          onStart={startGame}
          onPause={pauseGame}
          onResume={resumeGame}
          onRestart={handleRestart}
          disabled={!userProfile || userProfile.token === 0}
        />
        
        <GameCanvas
          gameState={gameState}
          onCellInteraction={handleCellInteraction}
          onCellSelect={handleCellSelect}
          onDragStart={handleDragStart}
        />
        
        <GameOverModal
          isOpen={!gameState.gameActive && gameState.score > 0}
          score={gameState.score}
          onRestart={handleRestart}
          isGuest={isGuest}
        />
      </div>
    </div>
  );
}
