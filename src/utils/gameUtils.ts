import { Cell, Match, SpecialCandy } from '../types/game';

export function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

export function cellsEqual(cell1: Cell, cell2: Cell): boolean {
  return cell1.row === cell2.row && cell1.col === cell2.col;
}

export function areAdjacent(cell1: Cell, cell2: Cell): boolean {
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function getCellFromPosition(x: number, y: number, cellSize: number, gridSize: number): Cell | null {
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  
  if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
    return { row, col };
  }
  return null;
}

export function maskName(username?: string, phone?: string): string {
  if (username) return username.slice(0, 4) + '***';
  if (phone) return phone.slice(0, 4) + '***';
  return '匿名';
}

// types/game.ts 里应该有 Match 类型，没有就用 {row: number, col: number}
export interface Match {
  row: number;
  col: number;
}
export function findSpecialMatches(grid: (number | null)[][], gridSize: number): {
  matches: Match[];
  specialCandies: { row: number; col: number; type: 'striped-h' | 'striped-v' | 'wrapped' | 'color-bomb' }[];
} {
  const matches: Match[] = [];
  const specialCandies: { row: number; col: number; type: 'striped-h' | 'striped-v' | 'wrapped' | 'color-bomb' }[] = [];
  const visited: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // 记录所有格子的消除类型（方便T/L检测）
  const mark: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
  // 1=横向，2=纵向，3=交叉

  // 横向
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col <= gridSize - 3; ) {
      const color = grid[row][col];
      if (color !== null &&
        grid[row][col + 1] === color &&
        grid[row][col + 2] === color) {
        // 统计连续长度
        let endCol = col + 3;
        while (endCol < gridSize && grid[row][endCol] === color) endCol++;
        const len = endCol - col;
        // 标记横向
        for (let c = col; c < endCol; c++) {
          matches.push({ row, col: c });
          mark[row][c] |= 1;
        }
        // 特殊糖果生成
        if (len === 4) {
          const centerCol = Math.floor((col + endCol - 1) / 2);
          specialCandies.push({ row, col: centerCol, type: 'striped-h' });
        }
        if (len >= 5) {
          const centerCol = Math.floor((col + endCol - 1) / 2);
          specialCandies.push({ row, col: centerCol, type: 'color-bomb' });
        }
        col = endCol;
      } else {
        col++;
      }
    }
  }
  // 纵向
  for (let col = 0; col < gridSize; col++) {
    for (let row = 0; row <= gridSize - 3; ) {
      const color = grid[row][col];
      if (color !== null &&
        grid[row + 1][col] === color &&
        grid[row + 2][col] === color) {
        // 统计连续长度
        let endRow = row + 3;
        while (endRow < gridSize && grid[endRow][col] === color) endRow++;
        const len = endRow - row;
        // 标记纵向
        for (let r = row; r < endRow; r++) {
          matches.push({ row: r, col });
          mark[r][col] |= 2;
        }
        // 特殊糖果生成
        if (len === 4) {
          const centerRow = Math.floor((row + endRow - 1) / 2);
          specialCandies.push({ row: centerRow, col, type: 'striped-v' });
        }
        if (len >= 5) {
          const centerRow = Math.floor((row + endRow - 1) / 2);
          specialCandies.push({ row: centerRow, col, type: 'color-bomb' });
        }
        row = endRow;
      } else {
        row++;
      }
    }
  }
  // T型/L型检测，横竖交叉的就是包裹
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if ((mark[row][col] & 1) && (mark[row][col] & 2)) {
        // 同时横纵交叉
        specialCandies.push({ row, col, type: 'wrapped' });
      }
    }
  }

  // 去重（有可能同一格子被标记多次）
  const matchSet = new Set(matches.map(m => `${m.row}_${m.col}`));
  const uniqueMatches = Array.from(matchSet).map(k => {
    const [row, col] = k.split('_').map(Number);
    return { row, col };
  });

  // 保证同一格只有一个特殊糖果（优先包裹>色球>条纹）
  const uniqueSpecial: { [key: string]: any } = {};
  for (const sp of specialCandies) {
    const key = `${sp.row}_${sp.col}`;
    // 包裹 > 色球 > 条纹
    if (!uniqueSpecial[key] ||
      (sp.type === 'wrapped' && uniqueSpecial[key].type !== 'wrapped') ||
      (sp.type === 'color-bomb' && uniqueSpecial[key].type === 'striped-h' || uniqueSpecial[key].type === 'striped-v')) {
      uniqueSpecial[key] = sp;
    }
  }
  const resultSpecial = Object.values(uniqueSpecial);

  return { matches: uniqueMatches, specialCandies: resultSpecial as any };
}

export function activateSpecialCandy(
  grid: (number | null)[][],
  specialCandies: SpecialCandy[][],
  row: number,
  col: number,
  gridSize: number,
  targetColor?: number // For color bomb activation
): { row: number; col: number }[] {
  const cellsToRemove: { row: number; col: number }[] = [];
  const special = specialCandies[row][col];

  if (!special || special.type === 'normal') return cellsToRemove;

  console.log(`🎆 Activating special candy at (${row},${col}):`, special.type);

  switch (special.type) {
    case 'striped-h':
      // Clear entire row
      console.log('💥 Clearing entire row', row);
      for (let c = 0; c < gridSize; c++) {
        cellsToRemove.push({ row, col: c });
      }
      break;

    case 'striped-v':
      // Clear entire column
      console.log('💥 Clearing entire column', col);
      for (let r = 0; r < gridSize; r++) {
        cellsToRemove.push({ row: r, col });
      }
      break;

    case 'wrapped':
      // Clear 3x3 area around the candy (activates twice)
      console.log('💥 Clearing 3x3 area around', row, col);
      for (let r = Math.max(0, row - 1); r <= Math.min(gridSize - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(gridSize - 1, col + 1); c++) {
          cellsToRemove.push({ row: r, col: c });
        }
      }
      break;

    case 'color-bomb':
      // Clear all candies of the target color (the color it was swapped with)
      const colorToRemove = targetColor !== undefined ? targetColor : grid[row][col];
      console.log('💥 Color bomb clearing all', colorToRemove, 'colored candies');
      if (colorToRemove !== null) {
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] === colorToRemove) {
              cellsToRemove.push({ row: r, col: c });
            }
          }
        }
      }
      break;

    case 'jelly':
      // Remove one layer (for now, just remove the jelly)
      console.log('💥 Removing jelly at', row, col);
      cellsToRemove.push({ row, col });
      break;
  }

  console.log('🎯 Cells to remove:', cellsToRemove.length);
  return cellsToRemove;
}

export function removeInitialMatches(grid: (number | null)[][], gridSize: number, colors: string[]): void {
  let hasMatches = true;
  let iterations = 0;
  const maxIterations = 50; // Prevent infinite loops
  
  while (hasMatches && iterations < maxIterations) {
    hasMatches = false;
    iterations++;
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Check horizontal matches
        if (col <= gridSize - 3) {
          if (grid[row][col] === grid[row][col + 1] && 
              grid[row][col] === grid[row][col + 2] &&
              grid[row][col] !== null) {
            grid[row][col] = Math.floor(Math.random() * colors.length);
            hasMatches = true;
          }
        }
        // Check vertical matches
        if (row <= gridSize - 3) {
          if (grid[row][col] === grid[row + 1][col] && 
              grid[row][col] === grid[row + 2][col] &&
              grid[row][col] !== null) {
            grid[row][col] = Math.floor(Math.random() * colors.length);
            hasMatches = true;
          }
        }
      }
    }
  }
  
  if (iterations >= maxIterations) {
    console.warn('⚠️ Max iterations reached in removeInitialMatches');
  }
}
