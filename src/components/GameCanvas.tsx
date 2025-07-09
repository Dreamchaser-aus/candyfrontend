import React, { useRef, useEffect, useCallback } from 'react';
import Explosion from './Explosion';
import { GameState, Cell } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { getCellFromPosition, cellsEqual, lightenColor } from '../utils/gameUtils';

interface GameCanvasProps {
  gameState: GameState;
  onCellInteraction: (from: Cell, to: Cell) => void;
  onCellSelect: (cell: Cell | null) => void;
  onDragStart: (cell: Cell | null) => void;
  triggerExplosion: (x: number, y: number, size?: number) => void;
  explosions: { x: number, y: number, size: number, id: number }[];
  onExplosionFinish: (id: number) => void;
}

const CRYPTO_SYMBOLS = ['₿', 'Ξ', 'D', 'T', 'X'];

export function GameCanvas({
  gameState,
  onCellInteraction,
  onCellSelect,
  onDragStart,
  triggerExplosion,
  explosions,
  onExplosionFinish,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartRef = useRef<Cell | null>(null);

  // 绘制单个格子
  const drawCrypto = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: string,
      cryptoIndex: number,
      specialType: string = 'normal'
    ) => {
      const centerX = x + size / 2;
      const centerY = y + size / 2;
      const radius = size / 2 - 3;

      // 渐变背景
      const gradient = ctx.createRadialGradient(
        centerX - radius / 3, centerY - radius / 3, 0,
        centerX, centerY, radius
      );
      gradient.addColorStop(0, lightenColor(color, 30));
      gradient.addColorStop(0.7, color);
      gradient.addColorStop(1, lightenColor(color, -20));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 特殊糖果
      if (specialType !== 'normal') {
        ctx.save();
        switch (specialType) {
          case 'striped-h':
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            for (let i = -radius + 8; i <= radius - 8; i += 8) {
              ctx.beginPath();
              ctx.moveTo(centerX - radius + 4, centerY + i);
              ctx.lineTo(centerX + radius - 4, centerY + i);
              ctx.stroke();
            }
            break;
          case 'striped-v':
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            for (let i = -radius + 8; i <= radius - 8; i += 8) {
              ctx.beginPath();
              ctx.moveTo(centerX + i, centerY - radius + 4);
              ctx.lineTo(centerX + i, centerY + radius - 4);
              ctx.stroke();
            }
            break;
          case 'wrapped':
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#FF6B35';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - 6, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case 'color-bomb':
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
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        ctx.restore();
      }

      // 边框
      ctx.strokeStyle = lightenColor(color, -30);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 内部高光
      if (
        specialType === 'normal' ||
        specialType === 'striped-h' ||
        specialType === 'striped-v'
      ) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(centerX - radius / 4, centerY - radius / 4, radius / 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 符号
      ctx.fillStyle = specialType === 'color-bomb' ? '#000000' : 'white';
      ctx.font = `bold ${size * 0.4}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      if (specialType === 'color-bomb') {
        ctx.fillText('💎', centerX, centerY);
      } else {
        ctx.fillText(CRYPTO_SYMBOLS[cryptoIndex], centerX, centerY);
      }
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    },
    []
  );

  // 渲染整个棋盘
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < GAME_CONFIG.GRID_SIZE; row++) {
      for (let col = 0; col < GAME_CONFIG.GRID_SIZE; col++) {
        const x = col * GAME_CONFIG.CELL_SIZE;
        const y = row * GAME_CONFIG.CELL_SIZE;

        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y, GAME_CONFIG.CELL_SIZE, GAME_CONFIG.CELL_SIZE);

        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, GAME_CONFIG.CELL_SIZE, GAME_CONFIG.CELL_SIZE);

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

        // 选中格子高亮
        if (
          gameState.selectedCell &&
          gameState.selectedCell.row === row &&
          gameState.selectedCell.col === col
        ) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 4;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(x + 2, y + 2, GAME_CONFIG.CELL_SIZE - 4, GAME_CONFIG.CELL_SIZE - 4);
          ctx.setLineDash([]);
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 10;
          ctx.strokeRect(x + 2, y + 2, GAME_CONFIG.CELL_SIZE - 4, GAME_CONFIG.CELL_SIZE - 4);
          ctx.shadowBlur = 0;
        }
      }
    }
  }, [gameState.grid, gameState.selectedCell, gameState.specialCandies, drawCrypto]);

  // 计算鼠标/触摸相对canvas坐标
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

  // 拖拽事件
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

  // 事件监听
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => handleStart(e);
    const handleMouseMove = (e: MouseEvent) => handleMove(e);
    const handleMouseUp = (e: MouseEvent) => handleEnd(e);
    const handleTouchStart = (e: TouchEvent) => { e.preventDefault(); handleStart(e); };
    const handleTouchMove = (e: TouchEvent) => { e.preventDefault(); handleMove(e); };
    const handleTouchEnd = (e: TouchEvent) => { e.preventDefault(); handleEnd(e); };

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

  // 棋盘渲染
  useEffect(() => {
    render();
  }, [render]);

  // 画布和爆炸动画层
  const canvasSize = GAME_CONFIG.GRID_SIZE * GAME_CONFIG.CELL_SIZE;
  function getScale() {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    return canvas.offsetWidth / canvas.width;
  }

  return (
    <div
      className="relative flex justify-center w-full max-w-[420px] aspect-square mx-auto"
      style={{
        width: '100%',
        maxWidth: 420,
        aspectRatio: '1 / 1',
        margin: '0 auto',
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 1,
          maxWidth: '100vw',
          maxHeight: '100vw',
          touchAction: 'none',
        }}
        className="border-2 border-gray-600/50 rounded-xl bg-gray-900/30 backdrop-blur-sm cursor-grab active:cursor-grabbing max-w-full shadow-2xl"
      />
      {/* 在canvas上层渲染所有爆炸 */}
      {explosions.map(e => (
        <Explosion
          key={e.id}
          x={e.x * getScale()}
          y={e.y * getScale()}
          size={e.size * getScale()}
          onFinish={() => onExplosionFinish(e.id)}
        />
      ))}
    </div>
  );
}
