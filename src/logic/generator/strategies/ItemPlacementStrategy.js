/**
 * ItemPlacementStrategy.js
 * 
 * Strategy for placing Treasures and Stairs.
 * Ensures items are placed in locations surrounded by safe cells (no mines/walls).
 */
class ItemPlacementStrategy {
    static place(board, config, safeZone) {
        const rows = config.rows;
        const cols = config.cols;
        const availableCells = [];

        // Identify available cells
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                // Not in safe zone (start area), not Mine, not Wall
                if (!safeZone.has(`${i},${j}`) &&
                    !board[i][j].isMine &&
                    !board[i][j].isWall) {

                    // Check neighbors (8 directions) - Items prefer open spaces
                    let isSafe = true;
                    for (let di = -1; di <= 1 && isSafe; di++) {
                        for (let dj = -1; dj <= 1 && isSafe; dj++) {
                            if (di === 0 && dj === 0) continue;
                            const ni = i + di;
                            const nj = j + dj;
                            if (ni >= 0 && ni < rows && nj >= 0 && nj < cols) {
                                if (board[ni][nj].isMine || board[ni][nj].isWall) {
                                    isSafe = false;
                                }
                            }
                        }
                    }

                    if (isSafe) {
                        availableCells.push([i, j]);
                    }
                }
            }
        }

        this.shuffleArray(availableCells);

        let itemsPlaced = 0;

        // Place Treasures
        const treasuresCount = Math.min(config.treasures, availableCells.length);
        for (let i = 0; i < treasuresCount; i++) {
            const [row, col] = availableCells[i];
            board[row][col].isTreasure = true;
            itemsPlaced++;
        }

        // Place Stairs (after treasures)
        const stairsStart = treasuresCount;
        const stairsEnd = Math.min(treasuresCount + config.stairs, availableCells.length);
        for (let i = stairsStart; i < stairsEnd; i++) {
            const [row, col] = availableCells[i];
            board[row][col].isStairs = true;
            itemsPlaced++;
        }

        return itemsPlaced;
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
