import { Cell, Match, SpecialCandy } from '../types/game';

// 工具：颜色变浅
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

// 判断两个格子是否同一个
export function cellsEqual(cell1: Cell, cell2: Cell): boolean {
  return cell1.row === cell2.row && cell1.col === cell2.col;
}

// 判断是否相邻
export function areAdjacent(cell1: Cell, cell2: Cell): boolean {
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// 坐标转格子
export function getCellFromPosition(x: number, y: number, cellSize: number, gridSize: number): Cell | null {
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
    return { row, col };
  }
  return null;
}

// 用户名脱敏
export function maskName(username?: string, phone?: string): string {
  if (username) return username.slice(0, 4) + '***';
  if (phone) return phone.slice(0, 4) + '***';
  return '匿名';
}

// ===========================
// 三消核心逻辑
// ===========================

export function findSpecialMatches(
  grid: (number | null)[][],
  gridSize: number
): {
  matches: Match[];
  specialCandies: { row: number; col: number; type: 'striped-h' | 'striped-v' | 'wrapped' | 'color-bomb' }[];
} {
  // 标记所有被消除的位置
  const matchSet = new Set<string>();
  // 记录所有特殊糖果
  const specialCandies: { row: number; col: number; type: 'striped-h' | 'striped-v' | 'wrapped' | 'color-bomb' }[] = [];

  // 横向和纵向连消长度
  const horRun: number[][] = [];
  const verRun: number[][] = [];
  for (let i = 0; i < gridSize; i++) {
    horRun[i] = Array(gridSize).fill(0);
    verRun[i] = Array(gridSize).fill(0);
  }

  // 横向判定
  for (let row = 0; row < gridSize; row++) {
    let count = 1;
    for (let col = 1; col < gridSize; col++) {
      if (
        grid[row][col] !== null &&
        grid[row][col] === grid[row][col - 1]
      ) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) {
            horRun[row][col - k - 1] = count;
          }
        }
        count = 1;
      }
    }
    if (count >= 3) {
      for (let k = 0; k < count; k++) {
        horRun[row][gridSize - 1 - k] = count;
      }
    }
  }

  // 纵向判定
  for (let col = 0; col < gridSize; col++) {
    let count = 1;
    for (let row = 1; row < gridSize; row++) {
      if (
        grid[row][col] !== null &&
        grid[row][col] === grid[row - 1][col]
      ) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) {
            verRun[row - k - 1][col] = count;
          }
        }
        count = 1;
      }
    }
    if (count >= 3) {
      for (let k = 0; k < count; k++) {
        verRun[gridSize - 1 - k][col] = count;
      }
    }
  }

  // 标记所有三连及以上格子
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (horRun[row][col] >= 3 || verRun[row][col] >= 3) {
        matchSet.add(`${row},${col}`);
      }
    }
  }

  // 生成特殊糖果（条纹、彩球、包裹）
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // 彩球
      if (horRun[row][col] >= 5 || verRun[row][col] >= 5) {
        specialCandies.push({ row, col, type: 'color-bomb' });
        continue;
      }
      // 横条纹
      if (horRun[row][col] === 4) {
        specialCandies.push({ row, col, type: 'striped-h' });
      }
      // 竖条纹
      if (verRun[row][col] === 4) {
        specialCandies.push({ row, col, type: 'striped-v' });
      }
      // 包裹糖果（T/L型）
      if (horRun[row][col] >= 3 && verRun[row][col] >= 3) {
        specialCandies.push({ row, col, type: 'wrapped' });
      }
    }
  }

  // 转换成数组返回
  const matches: Match[] = Array.from(matchSet).map(str => {
    const [row, col] = str.split(',').map(Number);
    return { row, col };
  });

  return { matches, specialCandies };
}

// ===========================
// 特殊糖果激活
// ===========================

export function activateSpecialCandy(
  grid: (number | null)[][],
  specialCandies: SpecialCandy[][],
  row: number,
  col: number,
  gridSize: number,
  targetColor?: number // 彩球使用
): { row: number; col: number }[] {
  const cellsToRemove: { row: number; col: number }[] = [];
  const special = specialCandies[row][col];

  if (!special || special.type === 'normal') return cellsToRemove;

  switch (special.type) {
    case 'striped-h':
      for (let c = 0; c < gridSize; c++) {
        cellsToRemove.push({ row, col: c });
      }
      break;
    case 'striped-v':
      for (let r = 0; r < gridSize; r++) {
        cellsToRemove.push({ row: r, col });
      }
      break;
    case 'wrapped':
      for (let r = Math.max(0, row - 1); r <= Math.min(gridSize - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(gridSize - 1, col + 1); c++) {
          cellsToRemove.push({ row: r, col: c });
        }
      }
      break;
    case 'color-bomb':
      const colorToRemove = targetColor !== undefined ? targetColor : grid[row][col];
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
      cellsToRemove.push({ row, col });
      break;
  }

  return cellsToRemove;
}

// ===========================
// 防止初始有消除
// ===========================
export function removeInitialMatches(grid: (number | null)[][], gridSize: number, colors: string[]): void {
  let hasMatches = true;
  let iterations = 0;
  const maxIterations = 50;
  while (hasMatches && iterations < maxIterations) {
    hasMatches = false;
    iterations++;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (col <= gridSize - 3) {
          if (
            grid[row][col] === grid[row][col + 1] &&
            grid[row][col] === grid[row][col + 2] &&
            grid[row][col] !== null
          ) {
            grid[row][col] = Math.floor(Math.random() * colors.length);
            hasMatches = true;
          }
        }
        if (row <= gridSize - 3) {
          if (
            grid[row][col] === grid[row + 1][col] &&
            grid[row][col] === grid[row + 2][col] &&
            grid[row][col] !== null
          ) {
            grid[row][col] = Math.floor(Math.random() * colors.length);
            hasMatches = true;
          }
        }
      }
    }
  }
}
