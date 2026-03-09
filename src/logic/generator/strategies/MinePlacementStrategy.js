/**
 * MinePlacementStrategy.js
 * 
 * Strategy for placing mines on the board.
 * 
 * @interface IPlacementStrategy
 * @method place(board, config, safeZone)
 */
class MinePlacementStrategy {
    static place(board, config, safeZone) {
        let minesPlaced = 0;
        const rows = config.rows;
        const cols = config.cols;

        // Safety break to prevent infinite loops if board is too full
        let attempts = 0;
        const MAX_ATTEMPTS = rows * cols * 10;

        while (minesPlaced < config.mines && attempts < MAX_ATTEMPTS) {
            attempts++;
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);

            const cell = board[row][col];
            // 1. Basic Eligibility Check
            // Ensure cell is not in safe zone, not already a mine/enemy/item
            if (safeZone.has(`${row},${col}`) || cell.isMine || cell.isEnemy || cell.isWall || cell.isTreasure || cell.isStairs) {
                continue;
            }

            // Note: In Pattern B (Mines First), no need to check neighbors for special cells 
            // because special cells haven't been placed yet.
            // Safe spots for special cells will be found later by ItemPlacementStrategy.

            board[row][col] = new MineLogicCell();
            minesPlaced++;
        }

        if (minesPlaced < config.mines) {
            console.warn(`Could not place all mines. Placed: ${minesPlaced}, Requested: ${config.mines}`);
        }

        return minesPlaced;
    }
}
