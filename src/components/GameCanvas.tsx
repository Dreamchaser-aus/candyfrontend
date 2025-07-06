import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Cell } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { getCellFromPosition, cellsEqual, lightenColor } from '../utils/gameUtils';

interface GameCanvasProps {
  gameState: GameState;
  onCellInteraction: (from: Cell, to: Cell) => void;
  onCellSelect: (cell: Cell | null) => void;
  onDragStart: (cell: Cell | null) => void;
}

// Crypto symbols mapping
const CRYPTO_SYMBOLS = ['₿', 'Ξ', 'D', 'T', 'X'];

export function GameCanvas({ gameState, onCellInteraction, onCellSelect, onDragStart }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartRef = useRef<Cell | null>(null);

  const drawCrypto = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, cryptoIndex: number, specialType: string = 'normal') => {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 2 - 3;

    // Create gradient background
    const gradient = ctx.createRadialGradient(
      centerX - radius / 3, centerY - radius / 3, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, lightenColor(color, 30));
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, lightenColor(color, -20));

    // Draw crypto coin background
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Add special candy effects BEFORE the border
    if (specialType !== 'normal') {
      ctx.save(); // Save current state
      
      switch (specialType) {
        case 'striped-h':
          // Horizontal stripes - bright white
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          for (let i = -radius + 8; i <= radius - 8; i += 8) {
            ctx.beginPath();
            ctx.moveTo(centerX - radius + 4, centerY + i);
            ctx.lineTo(centerX + radius - 4, centerY + i);
            ctx.stroke();
          }
          break;
          
        case 'striped-v':
          // Vertical stripes - bright white
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          for (let i = -radius + 8; i <= radius - 8; i += 8) {
            ctx.beginPath();
            ctx.moveTo(centerX + i, centerY - radius + 4);
            ctx.lineTo(centerX + i, centerY + radius - 4);
            ctx.stroke();
          }
          break;
          
        case 'wrapped':
          // Wrapped candy - double border effect
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 4;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.strokeStyle = '#FF6B35';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius - 6, 0, Math.PI * 2);
          ctx.stroke();
          break;
          
        case 'color-bomb':
          // Color bomb - rainbow effect
          const rainbowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          rainbowGradient.addColorStop(0, '#FFFFFF');
          rainbowGradient.addColorStop(0.2, '#FF0000');
          rainbowGradient.addColorStop(0.4, '#FFFF00');
          rainbowGradient.addColorStop(0.6, '#00FF00');
          rainbowGradient.addColorStop(0.8, '#0080FF');
          rainbowGradient.addColorStop(1, '#8000FF');
          
          ctx.fillStyle = rainbowGradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'jelly':
          // Jelly - translucent overlay
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      
      ctx.restore(); // Restore state
    }

    // Add border
    ctx.strokeStyle = lightenColor(color, -30);
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Add inner shine effect (only for normal candies)
    if (specialType === 'normal' || specialType === 'striped-h' || specialType === 'striped-v') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(centerX - radius / 4, centerY - radius / 4, radius / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw crypto symbol
    ctx.fillStyle = specialType === 'color-bomb' ? '#000000' : 'white';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    if (specialType === 'color-bomb') {
      ctx.fillText('💎', centerX, centerY);
    } else {
      ctx.fillText(CRYPTO_SYMBOLS[cryptoIndex], centerX, centerY);
    }
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let row = 0; row < GAME_CONFIG.GRID_SIZE; row++) {
      for (let col = 0; col < GAME_CONFIG.GRID_SIZE; col++) {
        const x = col * GAME_CONFIG.CELL_SIZE;
        const y = row * GAME_CONFIG.CELL_SIZE;
        
        // Draw cell background with subtle pattern
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x, y, GAME_CONFIG.CELL_SIZE, GAME_CONFIG.CELL_SIZE);
        
        // Draw cell border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, GAME_CONFIG.CELL_SIZE, GAME_CONFIG.CELL_SIZE);
        
        // Draw crypto coin - ALWAYS draw if there's a candy
        if (gameState.grid[row] && gameState.grid[row][col] !== null) {
          const cryptoIndex = gameState.grid[row][col]!;
          const specialCandy = gameState.specialCandies?.[row]?.[col];
          const specialType = specialCandy?.type || 'normal';
          
          drawCrypto(
            ctx, 
            x + 4, 
            y + 4, 
            GAME_CONFIG.CELL_SIZE - 8, 
            GAME_CONFIG.COLORS[cryptoIndex], 
            cryptoIndex,
            specialType
          );
        }
        
        // Highlight selected cell
        if (gameState.selectedCell && gameState.selectedCell.row === row && gameState.selectedCell.col === col) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 4;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(x + 2, y + 2, GAME_CONFIG.CELL_SIZE - 4, GAME_CONFIG.CELL_SIZE - 4);
          ctx.setLineDash([]);
          
          // Add glow effect
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 10;
          ctx.strokeRect(x + 2, y + 2, GAME_CONFIG.CELL_SIZE - 4, GAME_CONFIG.CELL_SIZE - 4);
          ctx.shadowBlur = 0;
        }
      }
    }
  }, [gameState.grid, gameState.selectedCell, gameState.specialCandies, drawCrypto]);

  const getCanvasPosition = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const handleStart = useCallback((e: MouseEvent | TouchEvent) => {
    if (!gameState.gameActive || gameState.gamePaused || gameState.animating) return;
    
    const pos = getCanvasPosition(e);
    if (!pos) return;

    const cell = getCellFromPosition(pos.x, pos.y, GAME_CONFIG.CELL_SIZE, GAME_CONFIG.GRID_SIZE);
    if (cell) {
      dragStartRef.current = cell;
      onCellSelect(cell);
      onDragStart(cell);
    }
  }, [gameState.gameActive, gameState.gamePaused, gameState.animating, getCanvasPosition, onCellSelect, onDragStart]);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!gameState.gameActive || gameState.gamePaused || gameState.animating || !dragStartRef.current) return;
    
    const pos = getCanvasPosition(e);
    if (!pos) return;

    const cell = getCellFromPosition(pos.x, pos.y, GAME_CONFIG.CELL_SIZE, GAME_CONFIG.GRID_SIZE);
    if (cell && !cellsEqual(cell, dragStartRef.current)) {
      onCellSelect(cell);
    }
  }, [gameState.gameActive, gameState.gamePaused, gameState.animating, getCanvasPosition, onCellSelect]);

  const handleEnd = useCallback((e: MouseEvent | TouchEvent) => {
    if (!gameState.gameActive || gameState.gamePaused || gameState.animating || !dragStartRef.current || !gameState.selectedCell) return;
    
    if (!cellsEqual(dragStartRef.current, gameState.selectedCell)) {
      onCellInteraction(dragStartRef.current, gameState.selectedCell);
    }
    
    dragStartRef.current = null;
    onCellSelect(null);
    onDragStart(null);
  }, [gameState.gameActive, gameState.gamePaused, gameState.animating, gameState.selectedCell, onCellInteraction, onCellSelect, onDragStart]);

  // Event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => handleStart(e);
    const handleMouseMove = (e: MouseEvent) => handleMove(e);
    const handleMouseUp = (e: MouseEvent) => handleEnd(e);
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleStart(e);
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleEnd(e);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  // Render when state changes
  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.GRID_SIZE * GAME_CONFIG.CELL_SIZE}
        height={GAME_CONFIG.GRID_SIZE * GAME_CONFIG.CELL_SIZE}
        className="border-2 border-gray-600/50 rounded-xl bg-gray-900/30 backdrop-blur-sm cursor-grab active:cursor-grabbing max-w-full shadow-2xl"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}