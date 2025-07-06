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
export function findSpecialMatches(grid: (number | null)[][], gridSize: number): {
  matches: Match[];
  specialCandies: { row: number; col: number; type: 'striped-h' | 'striped-v' | 'wrapped' | 'color-bomb' }[];
} {
  console.log('🚀 SIMPLE BULLETPROOF MATCH DETECTION');
  
  // Debug: Print current grid
  console.log('📋 Grid:');
  for (let row = 0; row < gridSize; row++) {
    const rowStr = grid[row].map(cell => cell === null ? 'X' : cell.toString()).join(' ');
    console.log(`  ${row}: ${rowStr}`);
  }

  const matches: Match[] = [];
  const specialCandies: { row: number; col: number; type: 'striped-h' | 'striped-v' | 'wrapped' | 'color-bomb' }[] = [];

  // 🔍 HORIZONTAL MATCHES - DEAD SIMPLE
  console.log('🔍 Checking horizontal matches...');
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col <= gridSize - 3; col++) {
      const color1 = grid[row][col];
      const color2 = grid[row][col + 1];
      const color3 = grid[row][col + 2];
      
      // Simple check: are all 3 the same and not null?
      if (color1 !== null && color1 === color2 && color2 === color3) {
        console.log(`✅ HORIZONTAL: Row ${row}, Cols ${col}-${col+2}, Color ${color1}`);
        
        // Count total length of this match
        let endCol = col + 3;
        while (endCol < gridSize && grid[row][endCol] === color1) {
          endCol++;
        }
        const matchLength = endCol - col;
        
        console.log(`  📏 Total length: ${matchLength}`);
        
        // Add all cells in this match
        for (let c = col; c < endCol; c++) {
          matches.push({ row, col: c });
          console.log(`    📍 Added (${row},${c})`);
        }
        
        // Create special candy
        if (matchLength >= 5) {
          const centerCol = Math.floor((col + endCol - 1) / 2);
          specialCandies.push({ row, col: centerCol, type: 'color-bomb' });
          console.log(`    💣 Color bomb at (${row},${centerCol})`);
        } else if (matchLength === 4) {
          const centerCol = Math.floor((col + endCol - 1) / 2);
          specialCandies.push({ row, col: centerCol, type: 'striped-h' });
          console.log(`    🍬 H-striped at (${row},${centerCol})`);
        }
        
        // Skip past this match
        col = endCol - 1;
      }
    }
  }

  // 🔍 VERTICAL MATCHES - DEAD SIMPLE
  console.log('🔍 Checking vertical matches...');
  for (let col = 0; col < gridSize; col++) {
    for (let row = 0; row <= gridSize - 3; row++) {
      const color1 = grid[row][col];
      const color2 = grid[row + 1][col];
      const color3 = grid[row + 2][col];
      
      // Simple check: are all 3 the same and not null?
      if (color1 !== null && color1 === color2 && color2 === color3) {
        console.log(`✅ VERTICAL: Col ${col}, Rows ${row}-${row+2}, Color ${color1}`);
        
        // Count total length of this match
        let endRow = row + 3;
        while (endRow < gridSize && grid[endRow][col] === color1) {
          endRow++;
        }
        const matchLength = endRow - row;
        
        console.log(`  📏 Total length: ${matchLength}`);
        
        // Check if any of these cells are already matched horizontally
        let hasConflict = false;
        for (let r = row; r < endRow; r++) {
          const existing = matches.find(m => m.row === r && m.col === col);
          if (existing) {
            console.log(`  ⚠️ Conflict at (${r},${col}) - already in horizontal match`);
            hasConflict = true;
            break;
          }
        }
        
        if (!hasConflict) {
          // Add all cells in this match
          for (let r = row; r < endRow; r++) {
            matches.push({ row: r, col });
            console.log(`    📍 Added (${r},${col})`);
          }
          
          // Create special candy
          if (matchLength >= 5) {
            const centerRow = Math.floor((row + endRow - 1) / 2);
            specialCandies.push({ row: centerRow, col, type: 'color-bomb' });
            console.log(`    💣 Color bomb at (${centerRow},${col})`);
          } else if (matchLength === 4) {
            const centerRow = Math.floor((row + endRow - 1) / 2);
            specialCandies.push({ row: centerRow, col, type: 'striped-v' });
            console.log(`    🍬 V-striped at (${centerRow},${col})`);
          }
        }
        
        // Skip past this match
        row = endRow - 1;
      }
    }
  }

  // 🔍 T/L SHAPES - SIMPLE CHECK
  console.log('🔍 Checking T/L shapes...');
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const centerColor = grid[row][col];
      if (centerColor === null) continue;

      // Check if this cell is part of both horizontal and vertical matches
      const inHorizontal = matches.some(m => m.row === row && m.col === col);
      const inVertical = matches.some(m => m.row === row && m.col === col);
      
      if (inHorizontal && inVertical) {
        console.log(`🎁 T/L SHAPE at (${row},${col})`);
        specialCandies.push({ row, col, type: 'wrapped' });
      }
    }
  }

  console.log(`🎯 DETECTION COMPLETE:`);
  console.log(`  📊 Total matches: ${matches.length}`);
  console.log(`  🍭 Special candies: ${specialCandies.length}`);
  
  // List all matches
  matches.forEach((match, index) => {
    const color = grid[match.row][match.col];
    console.log(`    ${index + 1}: (${match.row},${match.col}) = ${color}`);
  });

  return { matches, specialCandies };
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