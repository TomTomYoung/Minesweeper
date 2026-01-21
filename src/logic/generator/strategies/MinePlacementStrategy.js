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

        while (minesPlaced < config.mines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);

            const cell = board[row][col];
            // Ensure cell is not in safe zone, not already a mine, and not a wall
            if (!safeZone.has(`${row},${col}`) && !cell.isMine && !cell.isWall) {
                cell.isMine = true;
                minesPlaced++;
            }
        }
        return minesPlaced;
    }
}
