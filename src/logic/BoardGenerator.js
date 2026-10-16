/** Generates a board by delegating each cell type to a placement strategy. */
class BoardGenerator {
    /**
     * Generate all cells and expose the actual placement counts on the board.
     * @param {Object} config game configuration
     * @param {{row: number, col: number}} firstClick initial click position
     * @returns {Array<Array<BaseLogicCell>>} generated board
     */
    static generate(config, firstClick) {
        // Retry complete boards, never reduce counts or return partial placement.
        const safeZone = this.getSafeZone(config.rows, config.cols, firstClick.row, firstClick.col);
        const count = ['mines', 'treasures', 'stairs', 'enemies', 'totalWalls']
            .reduce((sum, key) => sum + (config[key] || 0), 0);
        if (count > config.rows * config.cols - safeZone.size) {
            throw new RangeError(`Cannot place ${config.mines} mines and other cells outside the safe zone`);
        }
        const clusters = config.wallClusters || 0;
        const walls = config.totalWalls || 0;
        if ((walls === 0) !== (clusters === 0) || walls < clusters) {
            throw new RangeError('Wall configuration requires at least one wall per cluster');
        }
        let lastError;
        for (let attempt = 0; attempt < 32; attempt++) {
            try {
                return this.generateAttempt(config, firstClick);
            } catch (error) {
                if (!(error instanceof RangeError)) throw error;
                lastError = error;
            }
        }
        throw lastError;
    }

    static generateAttempt(config, firstClick) {
        const board = this.initBoardData(config.rows, config.cols);

        const safeZone = this.getSafeZone(config.rows, config.cols, firstClick.row, firstClick.col);

        const minesPlaced = MinePlacementStrategy.place(board, config, safeZone);
        const itemsPlaced = ItemPlacementStrategy.place(board, config, safeZone);
        const enemiesPlaced = EnemyPlacementStrategy.place(board, config, safeZone);
        const wallsPlaced = WallPlacementStrategy.place(board, config, safeZone);

        this.calculateNeighborMines(board, config.rows, config.cols);

        Object.defineProperty(board, 'placementCounts', {
            value: Object.freeze({
                mines: minesPlaced,
                treasures: itemsPlaced.treasures,
                stairs: itemsPlaced.stairs,
                enemies: enemiesPlaced,
                walls: wallsPlaced
            }),
            enumerable: false
        });

        return board;
    }

    /** Create a board filled with empty cells. */
    static initBoardData(rows, cols) {
        return Array(rows).fill().map(() =>
            Array(cols).fill().map(() => new EmptyLogicCell())
        );
    }

    /** Return the clipped 3x3 safe zone around the first click. */
    static getSafeZone(rows, cols, centerRow, centerCol) {
        const safeZone = new Set();
        const startRow = Math.max(0, centerRow - 1);
        const endRow = Math.min(rows - 1, centerRow + 1);
        const startCol = Math.max(0, centerCol - 1);
        const endCol = Math.min(cols - 1, centerCol + 1);

        for (let i = startRow; i <= endRow; i++) {
            for (let j = startCol; j <= endCol; j++) {
                safeZone.add(`${i},${j}`);
            }
        }
        return safeZone;
    }

    /** Calculate and assign each non-mine cell's adjacent mine count. */
    static calculateNeighborMines(board, rows, cols) {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (!board[i][j].isMine) {
                    const count = this.countNeighborMines(board, rows, cols, i, j);

                    // Upgrade empty cells adjacent to mines to number cells.
                    if (count > 0 && board[i][j] instanceof EmptyLogicCell) {
                        const newCell = new NumberLogicCell();
                        newCell.isRevealed = board[i][j].isRevealed;
                        newCell.isFlagged = board[i][j].isFlagged;
                        newCell.state = board[i][j].state;
                        board[i][j] = newCell;
                    }

                    board[i][j].neighborMines = count;
                }
            }
        }
    }

    /** Count mines in the eight cells surrounding a coordinate. */
    static countNeighborMines(board, rows, cols, row, col) {
        let count = 0;
        for (let i = Math.max(0, row - 1); i <= Math.min(rows - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(cols - 1, col + 1); j++) {
                if (i === row && j === col) continue;

                const cell = board[i][j];
                if (cell.isMine) {
                    count++;
                }
            }
        }
        return count;
    }
}

