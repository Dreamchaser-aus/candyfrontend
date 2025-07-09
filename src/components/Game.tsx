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
import Explosion from './Explosion';

// 👇 修改：加上 props 接收 isGuest
export function Game({ isGuest }: { isGuest: boolean }) {
  const [currentView, setCurrentView] = useState<'menu' | 'game' | 'leaderboard' | 'settings' | 'howto'>('menu');
  const [explosions, setExplosions] = useState<{ x: number, y: number, size: number, id: number }[]>([]);

  // 注意：isGuest 不再从 useGame 取，而是由 App 传入
  const {
    gameState,
    userData,
    userProfile,
    gameResponse,
    // isGuest, // ❌ 删掉这里
    initGame,
    startGame,
    pauseGame,
    resumeGame,
    attemptSwap,
    setGameState,
    debugLog
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
  }, []);

  const handleBackToMenu = useCallback(() => {
    setCurrentView('menu');
    if (gameState.gameActive) {
      pauseGame();
    }
  }, [gameState.gameActive, pauseGame]);

    function triggerExplosion(x: number, y: number, size: number = 48) {
    setExplosions(list => [
      ...list,
      { x, y, size, id: Date.now() + Math.random() }
    ]);
  }

  // 视图切换
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

  // 游戏主界面
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
          gameHistory={gameState.gameHistory || []}
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
          triggerExplosion={triggerExplosion}
        />
        
        <GameOverModal
          isOpen={!gameState.gameActive && gameState.score > 0}
          score={gameState.score}
          onRestart={handleRestart}
          isGuest={isGuest}
        />

        {debugLog && (
          <div
            style={{
              width: '100%',
              minHeight: 28,
              background: '#232',
              color: '#fff',
              fontSize: 12,
              textAlign: 'center',
              marginTop: 10,
              borderRadius: 6,
              letterSpacing: 1,
              fontFamily: 'monospace',
              opacity: 0.88,
            }}
          >
            {debugLog}
          </div>
        )}
        {explosions.map(e =>
          <Explosion
            key={e.id}
            x={e.x}
            y={e.y}
            size={e.size}
            onFinish={() =>
              setExplosions(list => list.filter(i => i.id !== e.id))
            }
          />
        )}
      </div> {/* 这是 bg-gray-800/90 那个div的结尾 */}
    </div>
  );
}
