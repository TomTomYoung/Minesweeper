/**
 * @fileoverview BoardGenerator.js
 * 
 * Game Board Generator Logic.
 * 
 * This static class is responsible for procedurally generating the Minesweeper board.
 * It handles the placement of mines, walls, treasures, and stairs, by delegating 
 * to specialized strategies.
 */

class BoardGenerator {
    /**
     * Generate board data
     * @param {Object} config - Config from GameConfig
     * @param {Object} firstClick - {row, col}
     * @returns {Array<Array<Object>>} Board data 2D array
     */
    static generate(config, firstClick) {
        const board = this.initBoardData(config.rows, config.cols);
        const safeZone = this.getSafeZone(config.rows, config.cols, firstClick.row, firstClick.col);

        // 1. Place Mines (Pure Random)
        MinePlacementStrategy.place(board, config, safeZone);

        // 2. Place Enemies (Bomb Cells)
        EnemyPlacementStrategy.place(board, config, safeZone);

        // 3. Place Treasures/Stairs (Find safe spots among mines/enemies)
        ItemPlacementStrategy.place(board, config, safeZone);

        // Note: Walls are currently disabled in this pattern (RPG Mode Standard)

        this.calculateNeighborMines(board, config.rows, config.cols, config.wallsCountInCalculation);
        return board;
    }

    static initBoardData(rows, cols) {
        return Array(rows).fill().map(() =>
            Array(cols).fill().map(() => ({
                isMine: false,
                isEnemy: false,
                isWall: false,
                isTreasure: false,
                isStairs: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0,
                wallClusterId: null
            }))
        );
    }

    static getSafeZone(rows, cols, centerRow, centerCol) {
        const safeZone = new Set();
        for (let i = Math.max(0, centerRow - 1); i <= Math.min(rows - 1, centerRow + 1); i++) {
            for (let j = Math.max(0, centerCol - 1); j <= Math.min(cols - 1, centerCol + 1); j++) {
                safeZone.add(`${i},${j}`);
            }
        }
        return safeZone;
    }

    static calculateNeighborMines(board, rows, cols, wallsCountInCalculation) {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (!board[i][j].isMine && !board[i][j].isWall) {
                    board[i][j].neighborMines = this.countNeighborMines(board, rows, cols, i, j, wallsCountInCalculation);
                }
            }
        }
    }

    static countNeighborMines(board, rows, cols, row, col, wallsCountInCalculation) {
        let count = 0;
        for (let i = Math.max(0, row - 1); i <= Math.min(rows - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(cols - 1, col + 1); j++) {
                if (i === row && j === col) continue;

                const cell = board[i][j];
                if (cell.isMine || cell.isEnemy) {
                    count++;
                } else if (wallsCountInCalculation && cell.isWall) {
                    count++;
                }
            }
        }
        return count;
    }
}
