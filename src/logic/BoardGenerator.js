/**
 * @fileoverview BoardGenerator.js
 * 
 * Game Board Generator Logic.
 * 
 * This static class is responsible for procedurally generating the Minesweeper board.
 * It handles the placement of mines, walls, treasures, and stairs, ensuring a "safe zone"
 * around the player's first click.
 * 
 * Input:
 * - config: Configuration object (rows, cols, mines, etc.) from GameConfig.
 * - firstClick: Cooperates {row, col} indicating where the player clicked first.
 * 
 * Output:
 * - A 2D array of cell objects representing the initial board state.
 *   Each cell object contains properties like isMine, isWall, isTreasure, neighborMines, etc.
 */

class BoardGenerator {
    /**
     * ボード全体を生成するメイン関数
     * @param {Object} config - 生成設定
     * @param {number} config.rows - 行数
     * @param {number} config.cols - 列数
     * @param {number} config.mines - 地雷数
     * @param {number} config.wallClusters - 壁クラスター数
     * @param {number} config.totalWalls - 壁の総数
     * @param {number} config.treasures - お宝の数
     * @param {number} config.stairs - 階段の数
     * @param {boolean} config.wallsCountInCalculation - 壁を数字計算に含めるか
     * @param {Object} firstClick - 最初のクリック位置 {row, col}
     * @returns {Array<Array<Object>>} 生成されたボードデータ
     */
    static generate(config, firstClick) {
        // 1. 空のボードを初期化
        const board = this.initBoardData(config.rows, config.cols);

        // 2. 安全地帯（最初のクリック周辺）を計算
        const safeZone = this.getSafeZone(config.rows, config.cols, firstClick.row, firstClick.col);

        // 3. 壁クラスターを配置
        if (config.wallClusters > 0 && config.totalWalls > 0) {
            this.placeWallClusters(board, config, safeZone);
        }

        // 4. 地雷を配置
        this.placeMines(board, config, safeZone);

        // 5. お宝と階段を配置
        this.placeTreasuresAndStairs(board, config, safeZone);

        // 6. 各セルの隣接地雷数を計算
        this.calculateNeighborMines(board, config.rows, config.cols, config.wallsCountInCalculation);

        return board;
    }

    /**
     * 2次元配列の初期化
     * @param {number} rows 
     * @param {number} cols 
     * @returns {Array<Array<Object>>}
     */
    static initBoardData(rows, cols) {
        return Array(rows).fill().map(() =>
            Array(cols).fill().map(() => ({
                isMine: false,
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

    /**
     * 安全地帯（クリックしたセルの周囲）を取得
     * @returns {Set<string>} "row,col" 形式のセット
     */
    static getSafeZone(rows, cols, centerRow, centerCol) {
        const safeZone = new Set();
        for (let i = Math.max(0, centerRow - 1); i <= Math.min(rows - 1, centerRow + 1); i++) {
            for (let j = Math.max(0, centerCol - 1); j <= Math.min(cols - 1, centerCol + 1); j++) {
                safeZone.add(`${i},${j}`);
            }
        }
        return safeZone;
    }

    /**
     * 壁クラスターの配置
     */
    static placeWallClusters(board, config, safeZone) {
        const rows = config.rows;
        const cols = config.cols;
        const wallClusterMap = {}; // クラスターID -> 座標リスト

        let wallsPlaced = 0;
        let clustersCreated = 0;

        const wallsPerCluster = Math.floor(config.totalWalls / config.wallClusters);
        let remainingWalls = config.totalWalls % config.wallClusters;

        while (clustersCreated < config.wallClusters && wallsPlaced < config.totalWalls) {
            let wallsForThisCluster = wallsPerCluster;
            if (remainingWalls > 0) {
                wallsForThisCluster++;
                remainingWalls--;
            }

            // 開始位置をランダムに決定
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

            // 壁クラスターを生成して配置
            const placedInThisCluster = this.placeSingleCluster(
                board, rows, cols,
                startRow, startCol, clusterId,
                wallsForThisCluster, safeZone,
                wallClusterMap
            );

            if (placedInThisCluster > 0) {
                wallsPlaced += placedInThisCluster;
                clustersCreated++;
            }
        }

        // 生成されたクラスター情報をボードデータには含めにくいが、
        // 必要なら戻り値に含める等の設計変更もアリ。
        // 現状は board[r][c].wallClusterId に書き込んでいるのでOK。
    }

    /**
     * 単一の壁クラスターを配置 (BFS)
     */
    static placeSingleCluster(board, rows, cols, startRow, startCol, clusterId, wallsToPlace, safeZone, wallClusterMap) {
        const queue = [[startRow, startCol]];
        let wallsPlaced = 0;

        board[startRow][startCol].isWall = true;
        board[startRow][startCol].wallClusterId = clusterId;
        wallClusterMap[clusterId].push([startRow, startCol]);
        wallsPlaced++;

        while (queue.length > 0 && wallsPlaced < wallsToPlace) {
            const [row, col] = queue.shift();

            // 上下左右の隣接セル
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

            this.shuffleArray(neighbors);

            for (const [newRow, newCol] of neighbors) {
                if (wallsPlaced >= wallsToPlace) break;

                // すでに壁になっていないか再確認（キューに入れている間に変わる可能性は低いが念のため）
                if (!board[newRow][newCol].isWall) {
                    board[newRow][newCol].isWall = true;
                    board[newRow][newCol].wallClusterId = clusterId;
                    wallClusterMap[clusterId].push([newRow, newCol]);
                    queue.push([newRow, newCol]);
                    wallsPlaced++;
                }
            }
        }

        return wallsPlaced;
    }

    /**
     * 地雷の配置
     */
    static placeMines(board, config, safeZone) {
        let minesPlaced = 0;
        const rows = config.rows;
        const cols = config.cols;

        while (minesPlaced < config.mines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);

            const cell = board[row][col];
            if (!safeZone.has(`${row},${col}`) && !cell.isMine && !cell.isWall) {
                cell.isMine = true;
                minesPlaced++;
            }
        }
    }

    /**
     * お宝と階段の配置
     */
    static placeTreasuresAndStairs(board, config, safeZone) {
        const rows = config.rows;
        const cols = config.cols;
        const availableCells = [];

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                // 安全地帯、地雷、壁でなければ
                if (!safeZone.has(`${i},${j}`) &&
                    !board[i][j].isMine &&
                    !board[i][j].isWall) {

                    // 周囲8方向に地雷や壁がないかチェック（お宝/階段は安全な場所に置く）
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

        // お宝
        let treasuresPlaced = 0;
        for (let i = 0; i < Math.min(config.treasures, availableCells.length); i++) {
            const [row, col] = availableCells[i];
            board[row][col].isTreasure = true;
            treasuresPlaced++;
        }

        // 階段
        for (let i = treasuresPlaced; i < Math.min(treasuresPlaced + config.stairs, availableCells.length); i++) {
            const [row, col] = availableCells[i];
            board[row][col].isStairs = true;
        }
    }

    /**
     * 隣接地雷数の計算
     */
    static calculateNeighborMines(board, rows, cols, wallsCountInCalculation) {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (!board[i][j].isMine && !board[i][j].isWall) {
                    board[i][j].neighborMines = this.countNeighborMines(board, rows, cols, i, j, wallsCountInCalculation);
                }
            }
        }
    }

    /**
     * 特定セルの隣接地雷数をカウント
     */
    static countNeighborMines(board, rows, cols, row, col, wallsCountInCalculation) {
        let count = 0;
        for (let i = Math.max(0, row - 1); i <= Math.min(rows - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(cols - 1, col + 1); j++) {
                if (i === row && j === col) continue;

                const cell = board[i][j];
                if (cell.isMine) {
                    count++;
                } else if (wallsCountInCalculation && cell.isWall) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * 配列シャッフル (Fisher-Yates)
     */
    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
