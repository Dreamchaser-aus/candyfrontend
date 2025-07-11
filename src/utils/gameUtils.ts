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

// 🎯 SIMPLE BULLETPROOF MATCH DETECTION - NO COMPLEX LOGIC
newSpecialCandies.forEach(special => {
  newSpecialGrid[special.row][special.col] = {
    type: special.type,
    color: newGrid[special.row][special.col]!
  };
  specialPositions.add(`${special.row},${special.col}`);
});

// Remove matched cells (except special candy positions)
matches.forEach(match => {
  // 如果是特殊糖果位置就不消除
  if (!specialPositions.has(`${match.row},${match.col}`)) {
    newGrid[match.row][match.col] = null;
  }
});


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
