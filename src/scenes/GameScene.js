// GameScene.js - ゲームのメインロジックを管理するシーン
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // ゲーム状態の初期化
        this.initGameState();
        
        // ゲームボードの作成
        this.createGameBoard();
        
        // 入力イベントの設定
        this.setupInput();
    }
    
    update(time, delta) {
        // ゲームが開始されていて、終了していない場合にタイマーを更新
        if (!this.gameState.isFirstClick && !this.gameState.isGameOver) {
            this.updateTimer(delta);
        }
    }
    
    // ゲーム状態の初期化
    initGameState() {
        // 現在の設定を取得
        const config = this.game.gameData.gameConfig.getCurrentConfig();
        
        // レベルに応じた難易度調整
        const level = this.game.gameData.level || 1;
        const adjustedConfig = this.game.gameData.gameConfig.adjustForLevel(level);
        
        // ゲーム状態
        this.gameState = {
            board: [],
            rows: adjustedConfig.rows,
            cols: adjustedConfig.cols,
            mines: adjustedConfig.mines,
            wallClusters: adjustedConfig.wallClusters,
            totalWalls: adjustedConfig.totalWalls,
            treasures: adjustedConfig.treasures,
            stairs: adjustedConfig.stairs,
            wallsCountInCalculation: adjustedConfig.wallsCountInCalculation,
            autoRevealWallCluster: adjustedConfig.autoRevealWallCluster,
            treasurePoints: adjustedConfig.treasurePoints,
            flagsLeft: adjustedConfig.mines,
            revealedCells: 0,
            timer: 0,
            elapsedMS: 0,
            isGameOver: false,
            isFirstClick: true,
            wallClusterMap: {},
            score: 0,
            cellSize: adjustedConfig.cellSize || 40
        };
        
        // UIを更新
        this.updateUI();
        
        // レベル表示（2以上の場合）
        if (level > 1) {
            this.game.events.emit('showMessage', {
                text: `レベル ${level} スタート！`,
                color: '#0000ff',
                duration: 3000
            });
        }
    }
    
    // ゲームボードの作成
    createGameBoard() {
        // ゲームボードのコンテナを作成
        this.boardContainer = this.add.container(0, 0);
        
        // ボードのサイズ計算
        const boardWidth = this.gameState.cols * this.gameState.cellSize;
        const boardHeight = this.gameState.rows * this.gameState.cellSize;
        
        // ボードの位置（中央揃え）
        const boardX = (this.cameras.main.width - boardWidth) / 2;
        const boardY = 70; // 上部UIの下
        
        // ボード背景
        const boardBg = this.add.rectangle(
            boardX + boardWidth / 2,
            boardY + boardHeight / 2,
            boardWidth + 10,
            boardHeight + 10,
            0xbdbdbd
        ).setStrokeStyle(3, 0x7b7b7b);
        this.boardContainer.add(boardBg);
        
        // Board クラスのインスタンスを作成
        this.board = new Board(
            this,
            boardX + 5,
            boardY + 5,
            this.gameState.rows,
            this.gameState.cols,
            this.gameState.cellSize
        );
        
        // ボードの2次元配列を初期化（データモデル）
        this.initBoardData();
    }
    
    // ボードデータの初期化
    initBoardData() {
        // 2次元配列の初期化
        this.gameState.board = Array(this.gameState.rows).fill().map(() => 
            Array(this.gameState.cols).fill().map(() => ({
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
    
    // 入力イベントの設定
    setupInput() {
        // セルのクリックイベントをリッスン
        this.board.on('cellClicked', this.handleCellClick, this);
        this.board.on('cellRightClicked', this.handleCellRightClick, this);
    }
    
    // セルがクリックされたときの処理
    handleCellClick(cell) {
        const row = cell.boardRow;
        const col = cell.boardCol;
        
        // ゲームオーバーの場合は何もしない
        if (this.gameState.isGameOver) return;
        
        // 最初のクリック時にゲームを初期化
        if (this.gameState.isFirstClick) {
            this.initializeGame(row, col);
            this.gameState.isFirstClick = false;
        }
        
        // セルの状態を取得
        const cellData = this.gameState.board[row][col];
        
        // 開かれているセルの特殊処理
        if (cellData.isRevealed) {
            // 階段セルの場合、次のレベルへ
            if (cellData.isStairs) {
                this.goToNextLevel();
                return;
            }
            
            // ワンクリック展開（数字セルの周囲を開く）
            if (!cellData.isWall && !cellData.isMine && !cellData.isTreasure && !cellData.isStairs) {
                this.expandRevealedNumberCell(row, col);
            }
            
            return;
        }
        
        // 壁セルの処理
        if (cellData.isWall) {
            this.revealWallCluster(row, col);
            return;
        }
        
        // 通常のセル処理
        this.revealCell(row, col);
    }
    
    // 右クリック時の処理（旗を立てる）
    handleCellRightClick(cell) {
        const row = cell.boardRow;
        const col = cell.boardCol;
        
        // ゲームオーバーの場合は何もしない
        if (this.gameState.isGameOver) return;
        
        this.toggleFlag(row, col);
    }
    
    // ゲームの初期化（最初のクリック後）
    initializeGame(firstRow, firstCol) {
        // 壁クラスターを配置
        this.placeWallClusters(firstRow, firstCol);
        
        // 地雷を配置
        this.placeMines(firstRow, firstCol);
        
        // お宝と階段を配置
        this.placeTreasuresAndStairs(firstRow, firstCol);
        
        // 隣接地雷数を計算
        this.calculateNeighborMines();
    }
    
    // 壁クラスターの配置
    placeWallClusters(firstRow, firstCol) {
        // 安全エリアの定義（最初のクリック周辺）
        const safeZone = [];
        for (let i = Math.max(0, firstRow - 1); i <= Math.min(this.gameState.rows - 1, firstRow + 1); i++) {
            for (let j = Math.max(0, firstCol - 1); j <= Math.min(this.gameState.cols - 1, firstCol + 1); j++) {
                safeZone.push(`${i},${j}`);
            }
        }
        
        // 壁面クラスターの初期化
        this.gameState.wallClusterMap = {};
        
        // 壁面クラスターの数が0の場合は終了
        if (this.gameState.wallClusters <= 0 || this.gameState.totalWalls <= 0) {
            return;
        }
        
        let wallsPlaced = 0;
        let clustersCreated = 0;
        
        // 各クラスターの壁面数の計算
        const wallsPerCluster = Math.floor(this.gameState.totalWalls / this.gameState.wallClusters);
        let remainingWalls = this.gameState.totalWalls % this.gameState.wallClusters;
        
        // 各クラスターを配置
        while (clustersCreated < this.gameState.wallClusters && wallsPlaced < this.gameState.totalWalls) {
            // このクラスターに配置する壁面数
            let wallsForThisCluster = wallsPerCluster;
            if (remainingWalls > 0) {
                wallsForThisCluster++;
                remainingWalls--;
            }
            
            // クラスターの開始位置をランダムに選択
            let startRow, startCol;
            let attempts = 0;
            const maxAttempts = 100;
            
            do {
                startRow = Math.floor(Math.random() * this.gameState.rows);
                startCol = Math.floor(Math.random() * this.gameState.cols);
                attempts++;
            } while ((safeZone.includes(`${startRow},${startCol}`) || 
                    this.gameState.board[startRow][startCol].isWall) && attempts < maxAttempts);
            
            if (attempts >= maxAttempts) continue; // 適切な開始位置が見つからない場合はスキップ
            
            // 新しいクラスターID
            const clusterId = clustersCreated + 1;
            this.gameState.wallClusterMap[clusterId] = [];
            
            // クラスターの作成
            const placedInThisCluster = this.placeWallCluster(startRow, startCol, clusterId, wallsForThisCluster, safeZone);
            
            if (placedInThisCluster > 0) {
                wallsPlaced += placedInThisCluster;
                clustersCreated++;
            }
        }
        
        // 壁面をUIに反映
        this.updateBoardUI();
    }
    
    // 1つの壁面クラスターを配置
    placeWallCluster(startRow, startCol, clusterId, wallsToPlace, safeZone) {
        const queue = [[startRow, startCol]];
        let wallsPlaced = 0;
        
        // 最初のセルを壁に設定
        this.gameState.board[startRow][startCol].isWall = true;
        this.gameState.board[startRow][startCol].wallClusterId = clusterId;
        this.gameState.wallClusterMap[clusterId].push([startRow, startCol]);
        wallsPlaced++;
        
        // BFSで壁面を拡張
        while (queue.length > 0 && wallsPlaced < wallsToPlace) {
            const [row, col] = queue.shift();
            
            // 隣接するセルをチェック
            const neighbors = [];
            
            // 上下左右のセルのみ（斜めは含まない）
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                
                // ボード内であるか確認
                if (newRow >= 0 && newRow < this.gameState.rows && 
                    newCol >= 0 && newCol < this.gameState.cols) {
                    
                    // 壁ではなく、安全地帯でもない場合
                    if (!this.gameState.board[newRow][newCol].isWall && 
                        !safeZone.includes(`${newRow},${newCol}`)) {
                        neighbors.push([newRow, newCol]);
                    }
                }
            }
            
            // ランダムに並べ替え
            this.shuffleArray(neighbors);
            
            // 壁を追加
            for (const [newRow, newCol] of neighbors) {
                if (wallsPlaced >= wallsToPlace) break;
                
                this.gameState.board[newRow][newCol].isWall = true;
                this.gameState.board[newRow][newCol].wallClusterId = clusterId;
                this.gameState.wallClusterMap[clusterId].push([newRow, newCol]);
                queue.push([newRow, newCol]);
                wallsPlaced++;
            }
        }
        
        return wallsPlaced;
    }
    
    // 地雷の配置
    placeMines(firstRow, firstCol) {
        let minesPlaced = 0;
        
        // 安全エリアの定義（最初のクリック周辺）
        const safeZone = [];
        for (let i = Math.max(0, firstRow - 1); i <= Math.min(this.gameState.rows - 1, firstRow + 1); i++) {
            for (let j = Math.max(0, firstCol - 1); j <= Math.min(this.gameState.cols - 1, firstCol + 1); j++) {
                safeZone.push(`${i},${j}`);
            }
        }
        
        while (minesPlaced < this.gameState.mines) {
            const row = Math.floor(Math.random() * this.gameState.rows);
            const col = Math.floor(Math.random() * this.gameState.cols);
            
            // 安全エリア以外で、まだ地雷が配置されていない場所と壁でない場所に配置
            if (!safeZone.includes(`${row},${col}`) && !this.gameState.board[row][col].isMine && !this.gameState.board[row][col].isWall) {
                this.gameState.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
    }
    
    // お宝と階段の配置
    placeTreasuresAndStairs(firstRow, firstCol) {
        // 安全エリアの定義（最初のクリック周辺）
        const safeZone = [];
        for (let i = Math.max(0, firstRow - 1); i <= Math.min(this.gameState.rows - 1, firstRow + 1); i++) {
            for (let j = Math.max(0, firstCol - 1); j <= Math.min(this.gameState.cols - 1, firstCol + 1); j++) {
                safeZone.push(`${i},${j}`);
            }
        }
        
        // 利用可能なセルを収集
        const availableCells = [];
        
        // 全セルを確認
        for (let i = 0; i < this.gameState.rows; i++) {
            for (let j = 0; j < this.gameState.cols; j++) {
                // 安全地帯、地雷、壁でなければ
                if (!safeZone.includes(`${i},${j}`) && 
                    !this.gameState.board[i][j].isMine && 
                    !this.gameState.board[i][j].isWall) {
                    
                    // 周囲に地雷や壁がないかチェック
                    let isSafe = true;
                    
                    for (let di = -1; di <= 1 && isSafe; di++) {
                        for (let dj = -1; dj <= 1 && isSafe; dj++) {
                            if (di === 0 && dj === 0) continue;
                            
                            const ni = i + di;
                            const nj = j + dj;
                            
                            if (ni >= 0 && ni < this.gameState.rows && nj >= 0 && nj < this.gameState.cols) {
                                if (this.gameState.board[ni][nj].isMine || this.gameState.board[ni][nj].isWall) {
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
        
        // 利用可能なセルをシャッフル
        this.shuffleArray(availableCells);
        
        // お宝の配置
        let treasuresPlaced = 0;
        for (let i = 0; i < Math.min(this.gameState.treasures, availableCells.length); i++) {
            const [row, col] = availableCells[i];
            this.gameState.board[row][col].isTreasure = true;
            treasuresPlaced++;
        }
        
        // 階段の配置（お宝の後に残りの利用可能セルから）
        let stairsPlaced = 0;
        for (let i = treasuresPlaced; i < Math.min(treasuresPlaced + this.gameState.stairs, availableCells.length); i++) {
            const [row, col] = availableCells[i];
            this.gameState.board[row][col].isStairs = true;
            stairsPlaced++;
        }
    }
    
    // 隣接する地雷の数を計算
    calculateNeighborMines() {
        for (let i = 0; i < this.gameState.rows; i++) {
            for (let j = 0; j < this.gameState.cols; j++) {
                if (!this.gameState.board[i][j].isMine && !this.gameState.board[i][j].isWall) {
                    this.gameState.board[i][j].neighborMines = this.countNeighborMines(i, j);
                }
            }
        }
    }
    
    // 隣接する地雷の数を数える
    countNeighborMines(row, col) {
        let count = 0;
        
        for (let i = Math.max(0, row - 1); i <= Math.min(this.gameState.rows - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(this.gameState.cols - 1, col + 1); j++) {
                if (i === row && j === col) continue;
                
                if (this.gameState.board[i][j].isMine) {
                    count++;
                } else if (this.gameState.wallsCountInCalculation && this.gameState.board[i][j].isWall) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    // 壁面クラスター全体を開く
    revealWallCluster(row, col) {
        const cell = this.gameState.board[row][col];
        
        // 壁でない場合は通常セルの処理へ
        if (!cell.isWall) {
            this.revealCell(row, col);
            return;
        }
        
        // オプションが有効（自動オープン）なら、全クラスターを一斉に開く
        if (this.gameState.autoRevealWallCluster) {
            const clusterId = cell.wallClusterId;
            if (clusterId && this.gameState.wallClusterMap[clusterId]) {
                for (const [wallRow, wallCol] of this.gameState.wallClusterMap[clusterId]) {
                    const wallCell = this.gameState.board[wallRow][wallCol];
                    if (!wallCell.isRevealed) {
                        wallCell.isRevealed = true;
                        this.board.updateCellUI(wallRow, wallCol, wallCell);
                    }
                }
            }
        } else {
            // 手動モードの場合
            if (!cell.isRevealed) {
                // 初回クリックでそのセルのみを開く
                cell.isRevealed = true;
                this.board.updateCellUI(row, col, cell);
            } else {
                // すでに開かれているセルをクリックした場合、
                // ４近傍（上下左右）の同じクラスター内の未開示壁セルのみを開く
                const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                const clusterId = cell.wallClusterId;
                for (const [dr, dc] of directions) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < this.gameState.rows && newCol >= 0 && newCol < this.gameState.cols) {
                        const neighbor = this.gameState.board[newRow][newCol];
                        if (neighbor.isWall && neighbor.wallClusterId === clusterId && !neighbor.isRevealed) {
                            neighbor.isRevealed = true;
                            this.board.updateCellUI(newRow, newCol, neighbor);
                        }
                    }
                }
            }
        }
        
        // 勝利条件のチェック
        this.checkWinCondition();
    }
    
    // セルを開く
    revealCell(row, col) {
        const cell = this.gameState.board[row][col];
        
        // 既に開かれているか、旗が立っている場合は何もしない
        if (cell.isRevealed || cell.isFlagged) return;
        
        // 壁の場合は壁面クラスターを開く
        if (cell.isWall) {
            this.revealWallCluster(row, col);
            return;
        }
        
        // セルを開く前のお宝状態を記録
        const wasTreasure = cell.isTreasure;
        const wasStairs = cell.isStairs;
        
        // 幅優先探索（BFS）による自動オープン処理
        const queue = [];
        queue.push([row, col]);
        
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            const currentCell = this.gameState.board[r][c];
            
            // すでに開かれているか旗が立っているならスキップ
            if (currentCell.isRevealed || currentCell.isFlagged) continue;
            
            // 万が一、BFS中に壁セルが混入した場合は除外
            if (currentCell.isWall) continue;
            
            currentCell.isRevealed = true;
            this.gameState.revealedCells++;
            this.board.updateCellUI(r, c, currentCell);
            
            // 地雷を踏んだ場合はゲームオーバー
            if (currentCell.isMine) {
                this.gameOver(false);
                return;
            }
            
            // お宝を見つけた場合は得点を加算
            if (currentCell.isTreasure) {
                this.gameState.score += this.gameState.treasurePoints;
                this.game.gameData.score += this.gameState.treasurePoints;
                this.game.gameData.totalScore += this.gameState.treasurePoints;
                
                // UIを更新
                this.updateUI();
                
                // メッセージを表示
                this.game.events.emit('showMessage', {
                    text: `お宝を見つけました！ +${this.gameState.treasurePoints}点`,
                    color: '#ffd700',
                    duration: 2000
                });
                
                // 効果音を再生
                if (this.sound.get('treasure')) {
                    this.sound.play('treasure');
                }
            }
            
            // 周囲８方向のうち、数字が0なら隣接セルを展開（※非壁セルのみ）
            // お宝と階段は自動展開しない
            if (currentCell.neighborMines === 0 && !wasTreasure && !wasStairs) {
                for (let i = Math.max(0, r - 1); i <= Math.min(this.gameState.rows - 1, r + 1); i++) {
                    for (let j = Math.max(0, c - 1); j <= Math.min(this.gameState.cols - 1, c + 1); j++) {
                        if (i === r && j === c) continue;
                        const neighbor = this.gameState.board[i][j];
                        if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isWall) {
                            queue.push([i, j]);
                        }
                    }
                }
            }
        }
        
        // 勝利条件をチェック
        this.checkWinCondition();
    }
    
    // 開かれたセルの周囲を展開
    expandRevealedNumberCell(row, col) {
        const cell = this.gameState.board[row][col];
        
        // 開かれた数字セルのみ処理
        if (!cell.isRevealed || cell.neighborMines === 0) return;
        
        // 周囲の旗の数をカウント
        let flagCount = 0;
        const neighbors = [];
        
        for (let i = Math.max(0, row - 1); i <= Math.min(this.gameState.rows - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(this.gameState.cols - 1, col + 1); j++) {
                if (i === row && j === col) continue;
                
                const neighbor = this.gameState.board[i][j];
                if (neighbor.isFlagged) {
                    flagCount++;
                } else if (!neighbor.isRevealed && !neighbor.isWall) {
                    neighbors.push([i, j]);
                }
            }
        }
        
        // 周囲の旗の数が隣接地雷数と一致する場合、残りの未開示セルを開く
        if (flagCount === cell.neighborMines) {
            for (const [r, c] of neighbors) {
                this.revealCell(r, c);
            }
        }
    }
    
    // 旗を切り替える
    toggleFlag(row, col) {
        const cell = this.gameState.board[row][col];

        // すでに開かれているか壁の場合は何もしない
        if (cell.isRevealed || cell.isWall) return;

        if (cell.isFlagged) {
            // 旗を取り除く
            cell.isFlagged = false;
            this.gameState.flagsLeft++;
        } else {
            // 旗がすべて使われている場合は何もしない
            if (this.gameState.flagsLeft <= 0) return;
            
            // 旗を立てる
            cell.isFlagged = true;
            this.gameState.flagsLeft--;
        }

        // UIを更新
        this.board.updateCellUI(row, col, cell);
        this.updateUI();
        
        // 勝利条件をチェック
        this.checkWinCondition();
    }
    
    // すべての地雷を表示
    revealAllMines() {
        for (let i = 0; i < this.gameState.rows; i++) {
            for (let j = 0; j < this.gameState.cols; j++) {
                if (this.gameState.board[i][j].isMine) {
                    this.gameState.board[i][j].isRevealed = true;
                    this.board.updateCellUI(i, j, this.gameState.board[i][j]);
                }
            }
        }
    }
    
    // 次のレベルへ進む
    goToNextLevel() {
        // メッセージを表示
        this.game.events.emit('showMessage', {
            text: '階段を見つけました！次のレベルへ…',
            color: '#9370db',
            duration: 1500
        });
        
        // レベルを増加
        this.game.gameData.level++;
        
        // 少し待ってから次のレベルを開始
        this.time.delayedCall(1500, () => {
            // 現在のスコアを総スコアに加算（既にお宝分は加算済みなので不要）
            // 新しいゲームを開始（スコアを引き継ぐ）
            this.scene.restart();
        });
    }
    
    // 勝利条件をチェック
    checkWinCondition() {
        const totalCells = this.gameState.rows * this.gameState.cols;
        const nonMineCells = totalCells - this.gameState.mines;
        const wallCells = this.getTotalWallCells();
        
        let revealedNonWallCells = 0;
        
        // 実際に開かれたセルをカウント（壁を除く）
        for (let i = 0; i < this.gameState.rows; i++) {
            for (let j = 0; j < this.gameState.cols; j++) {
                if (this.gameState.board[i][j].isRevealed && !this.gameState.board[i][j].isWall) {
                    revealedNonWallCells++;
                }
            }
        }
        
        // すべての非地雷＆非壁セルが開かれているか
        if (revealedNonWallCells === nonMineCells - wallCells) {
            this.gameOver(true);
        }
    }
    
    // 壁セルの総数を取得
    getTotalWallCells() {
        let count = 0;
        for (let i = 0; i < this.gameState.rows; i++) {
            for (let j = 0; j < this.gameState.cols; j++) {
                if (this.gameState.board[i][j].isWall) {
                    count++;
                }
            }
        }
        return count;
    }
    
    // ゲーム終了処理
    gameOver(isWin) {
        this.gameState.isGameOver = true;
        
        if (isWin) {
            // 残りの得点をボーナスとして加算
            const timeBonus = Math.max(500 - this.gameState.timer, 0);
            const flagBonus = this.gameState.flagsLeft * 10;
            const totalBonus = timeBonus + flagBonus;
            
            this.gameState.score += totalBonus;
            this.game.gameData.score += totalBonus;
            this.game.gameData.totalScore += totalBonus;
            
            // UIを更新
            this.updateUI();
            
            // 勝利メッセージを表示
            this.game.events.emit('showMessage', {
                text: `勝利！おめでとうございます！ ボーナス: +${totalBonus}点`,
                color: '#00aa00'
            });
        } else {
            // 全ての地雷を表示
            this.revealAllMines();
            
            // 敗北メッセージを表示
            this.game.events.emit('showMessage', {
                text: 'ゲームオーバー！',
                color: '#ff0000'
            });
            
            // 爆発音を再生
            if (this.sound.get('explosion')) {
                this.sound.play('explosion');
            }
        }
    }
    
    // タイマーの更新
    updateTimer(delta) {
        this.gameState.elapsedMS += delta;
        
        // 1秒ごとにタイマーを更新
        if (this.gameState.elapsedMS >= 1000) {
            this.gameState.timer++;
            this.gameState.elapsedMS -= 1000;
            
            // UIを更新
            this.updateUI();
        }
    }
    
    // UIの更新
    updateUI() {
        // UIシーンに更新イベントを送信
        this.game.events.emit('updateUI', {
            flagsLeft: this.gameState.flagsLeft,
            timer: this.gameState.timer,
            score: this.gameState.score,
            totalScore: this.game.gameData.totalScore
        });
    }
    
    // ボードUIの更新
    updateBoardUI() {
        for (let i = 0; i < this.gameState.rows; i++) {
            for (let j = 0; j < this.gameState.cols; j++) {
                this.board.updateCellUI(i, j, this.gameState.board[i][j]);
            }
        }
    }
    
    // ゲームの再スタート
    restartGame() {
        // 同じ設定で新しいゲームを開始
        this.scene.restart();
    }
    
    // 配列をシャッフルするユーティリティ関数
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}