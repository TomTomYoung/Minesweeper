/** Strategy for placing contiguous wall clusters without replacing occupied cells. */
class WallPlacementStrategy {
    static place(board, config, safeZone) {
        const requestedClusters = config.wallClusters || 0;
        const requestedWalls = config.totalWalls || 0;
        if (requestedClusters === 0 && requestedWalls === 0) return 0;
        if (requestedClusters <= 0 || requestedWalls < requestedClusters) {
            throw new RangeError('Wall configuration requires at least one wall per cluster');
        }

        const clusterSizes = Array(requestedClusters).fill(Math.floor(requestedWalls / requestedClusters));
        for (let index = 0; index < requestedWalls % requestedClusters; index++) {
            clusterSizes[index]++;
        }

        let wallsPlaced = 0;
        for (let index = 0; index < clusterSizes.length; index++) {
            const placed = this.placeCluster(
                board,
                config.rows,
                config.cols,
                index + 1,
                clusterSizes[index],
                safeZone
            );
            if (placed !== clusterSizes[index]) {
                throw new RangeError(
                    `Cannot place wall cluster ${index + 1}; placed ${placed} of ${clusterSizes[index]} walls`
                );
            }
            wallsPlaced += placed;
        }
        return wallsPlaced;
    }

    static placeCluster(board, rows, cols, clusterId, requestedWalls, safeZone) {
        const candidates = this.getAvailableCells(board, rows, cols, safeZone);
        this.shuffleArray(candidates);

        for (const start of candidates) {
            const connectedCells = this.collectConnectedCells(
                board, rows, cols, start, requestedWalls, safeZone
            );
            if (connectedCells.length < requestedWalls) continue;

            for (const [row, col] of connectedCells) {
                const wall = new WallLogicCell();
                wall.wallClusterId = clusterId;
                board[row][col] = wall;
            }
            return connectedCells.length;
        }
        return 0;
    }

    static collectConnectedCells(board, rows, cols, start, limit, safeZone) {
        const queue = [start];
        const visited = new Set([`${start[0]},${start[1]}`]);
        const connectedCells = [];

        while (queue.length > 0 && connectedCells.length < limit) {
            const [row, col] = queue.shift();
            if (!this.isAvailable(board, row, col, safeZone)) continue;
            connectedCells.push([row, col]);

            const neighbors = [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]
                .filter(([nextRow, nextCol]) => nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols);
            this.shuffleArray(neighbors);
            for (const [nextRow, nextCol] of neighbors) {
                const key = `${nextRow},${nextCol}`;
                if (!visited.has(key) && this.isAvailable(board, nextRow, nextCol, safeZone)) {
                    visited.add(key);
                    queue.push([nextRow, nextCol]);
                }
            }
        }
        return connectedCells;
    }

    static getAvailableCells(board, rows, cols, safeZone) {
        const cells = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.isAvailable(board, row, col, safeZone)) cells.push([row, col]);
            }
        }
        return cells;
    }

    static isAvailable(board, row, col, safeZone) {
        const cell = board[row][col];
        return !safeZone.has(`${row},${col}`) &&
            !cell.isMine && !cell.isEnemy && !cell.isWall &&
            !cell.isTreasure && !cell.isStairs;
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
