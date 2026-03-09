/**
 * WallPlacementStrategy.js
 * 
 * Strategy for placing wall clusters on the board.
 * Uses BFS to create contiguous clusters.
 */
class WallPlacementStrategy {
    static place(board, config, safeZone) {
        if (config.wallClusters <= 0 || config.totalWalls <= 0) return 0;

        const rows = config.rows;
        const cols = config.cols;
        const wallClusterMap = {}; // Cluster ID -> Coord List

        let wallsPlaced = 0;
        let clustersCreated = 0;

        // Determine walls per cluster
        const wallsPerCluster = Math.floor(config.totalWalls / config.wallClusters);
        let remainingWalls = config.totalWalls % config.wallClusters;

        while (clustersCreated < config.wallClusters && wallsPlaced < config.totalWalls) {
            let wallsForThisCluster = wallsPerCluster;
            if (remainingWalls > 0) {
                wallsForThisCluster++;
                remainingWalls--;
            }

            // Random Start Position
            let startRow, startCol;
            let attempts = 0;
            const maxAttempts = 100;

            do {
                startRow = Math.floor(Math.random() * rows);
                startCol = Math.floor(Math.random() * cols);
                attempts++;
            } while ((safeZone.has(`${startRow},${startCol}`) ||
                board[startRow][startCol].isWall) && attempts < maxAttempts);

            if (attempts >= maxAttempts) continue;

            const clusterId = clustersCreated + 1;
            wallClusterMap[clusterId] = [];

            // Generate Cluster
            const placedCount = this.placeSingleCluster(
                board, rows, cols,
                startRow, startCol, clusterId,
                wallsForThisCluster, safeZone,
                wallClusterMap
            );

            if (placedCount > 0) {
                wallsPlaced += placedCount;
                clustersCreated++;
            }
        }

        return wallsPlaced;
    }

    static placeSingleCluster(board, rows, cols, startRow, startCol, clusterId, wallsToPlace, safeZone, wallClusterMap) {
        const queue = [[startRow, startCol]];
        let wallsPlaced = 0;

        // Place first wall
        if (!board[startRow][startCol].isWall) {
            const wallCell = new WallLogicCell();
            wallCell.wallClusterId = clusterId;
            board[startRow][startCol] = wallCell;
            wallClusterMap[clusterId].push([startRow, startCol]);
            wallsPlaced++;
        }

        while (queue.length > 0 && wallsPlaced < wallsToPlace) {
            const [row, col] = queue.shift();

            // Neighbors (Up, Down, Left, Right)
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            const neighbors = [];

            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;

                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    if (!board[newRow][newCol].isWall && !safeZone.has(`${newRow},${newCol}`)) {
                        neighbors.push([newRow, newCol]);
                    }
                }
            }

            // Shuffle neighbors for random shape
            this.shuffleArray(neighbors);

            for (const [newRow, newCol] of neighbors) {
                if (wallsPlaced >= wallsToPlace) break;

                if (!board[newRow][newCol].isWall) {
                    const wallCell = new WallLogicCell();
                    wallCell.wallClusterId = clusterId;
                    board[newRow][newCol] = wallCell;
                    wallClusterMap[clusterId].push([newRow, newCol]);
                    queue.push([newRow, newCol]);
                    wallsPlaced++;
                }
            }
        }

        return wallsPlaced;
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
