/**
 * EnemyPlacementStrategy.js
 * 
 * Strategy for placing enemies on the board.
 * Enemies are "Bomb Cells" (dangerous/obstacles) but must be clicked to be defeated.
 */
class EnemyPlacementStrategy {
    static place(board, config, safeZone) {
        let enemiesPlaced = 0;
        const rows = config.rows;
        const cols = config.cols;

        // Safety break
        let attempts = 0;
        const MAX_ATTEMPTS = rows * cols * 10;

        while (enemiesPlaced < config.enemies && attempts < MAX_ATTEMPTS) {
            attempts++;
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);

            const cell = board[row][col];

            // Eligibility Check
            // Ensure cell is not in safe zone, and not already occupied by anything
            if (safeZone.has(`${row},${col}`) ||
                cell.isMine ||
                cell.isEnemy ||
                cell.isWall ||
                cell.isTreasure ||
                cell.isStairs) {
                continue;
            }

            // Replace cell with EnemyCell
            board[row][col] = new EnemyLogicCell();
            enemiesPlaced++;
        }

        return enemiesPlaced;
    }
}
