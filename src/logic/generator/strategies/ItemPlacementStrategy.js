/**
 * ItemPlacementStrategy.js
 * 
 * Strategy for placing Treasures and Stairs.
 * Ensures items are placed in locations surrounded by safe cells (no mines).
 */
class ItemPlacementStrategy {
    static place(board, config, safeZone) {
        const rows = config.rows;
        const cols = config.cols;
        const availableCells = [];

        // Identify available cells
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                // Not in safe zone (start area), not Mine
                if (!safeZone.has(`${i},${j}`) &&
                    !board[i][j].isMine) {

                    // Check neighbors (8 directions) - Items prefer open spaces (no mines)
                    let isSafe = true;
                    for (let di = -1; di <= 1 && isSafe; di++) {
                        for (let dj = -1; dj <= 1 && isSafe; dj++) {
                            if (di === 0 && dj === 0) continue;
                            const ni = i + di;
                            const nj = j + dj;
                            if (ni >= 0 && ni < rows && nj >= 0 && nj < cols) {
                                if (board[ni][nj].isMine) {
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

        // Place Treasures and randomly assign contents
        const requestedTreasures = config.treasures || 0;
        const requestedStairs = config.stairs || 0;
        const requestedItems = requestedTreasures + requestedStairs;
        if (availableCells.length < requestedItems) {
            throw new RangeError(`Cannot place ${requestedItems} items; only ${availableCells.length} safe cells are available`);
        }
        const treasuresCount = requestedTreasures;

        // Ensure at least one key if there are treasures
        let hasKey = false;

        for (let i = 0; i < treasuresCount; i++) {
            const [row, col] = availableCells[i];

            let treasureContent = '';

            if (!hasKey) {
                treasureContent = 'key';
                hasKey = true;
            } else {
                // Randomly decide between gold and sword 
                // Currently just 50/50 for demonstration
                const rand = Math.random();
                if (rand < 0.5) {
                    treasureContent = 'gold';
                } else {
                    treasureContent = 'sword';
                }
            }

            board[row][col] = new TreasureLogicCell(treasureContent);

            itemsPlaced++;
        }

        // Place Stairs (after treasures)
        const stairsStart = treasuresCount;
        const stairsEnd = treasuresCount + requestedStairs;
        for (let i = stairsStart; i < stairsEnd; i++) {
            const [row, col] = availableCells[i];
            board[row][col] = new StairsLogicCell();
            itemsPlaced++;
        }

        return { treasures: treasuresCount, stairs: requestedStairs, total: itemsPlaced };
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
