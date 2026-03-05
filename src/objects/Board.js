// Board.js - ゲームボードを管理するクラス
class Board extends Phaser.GameObjects.Container {
    constructor(scene, x, y, rows, cols, cellSize) {
        super(scene, x, y);
        scene.add.existing(this);

        this.rows = rows;
        this.cols = cols;
        this.cellSize = cellSize;

        // セルの2次元配列
        this.cells = [];

        // ボードを作成
        this.createBoard();
    }

    // ボードの作成
    createBoard() {
        // 既存のセルをクリア
        this.removeAll(true);
        this.cells = [];

        // 行ごとにセルを作成
        for (let i = 0; i < this.rows; i++) {
            this.cells[i] = [];

            for (let j = 0; j < this.cols; j++) {
                // セルの位置
                const x = j * this.cellSize;
                const y = i * this.cellSize;

                // 通常のセルを作成
                const cell = new Cell(this.scene, x, y, this.cellSize, i, j);

                // セルをボードに追加
                this.add(cell);
                this.cells[i][j] = cell;

                // セルのイベントをボードに伝播
                cell.on('cellClicked', this.handleCellClick, this);
                cell.on('cellRightClicked', this.handleCellRightClick, this);
            }
        }

        // Overlay Layer (for Enemy Danger Zones etc.)
        this.overlayLayer = this.scene.add.graphics();
        this.add(this.overlayLayer);
    }

    // セルの種類を更新（壁、地雷、お宝、階段）
    updateCellTypes(boardData) {
        // セルの種類を適切に設定
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cellData = boardData[i][j];
                const currentCell = this.cells[i][j];

                // 現在のセルを削除
                const cellIndex = this.getAll().indexOf(currentCell);
                if (cellIndex !== -1) {
                    this.removeAt(cellIndex, true);
                }

                // セルの位置
                const x = j * this.cellSize;
                const y = i * this.cellSize;

                // 新しいセルを作成（タイプに応じて）
                let newCell;

                if (cellData.isWall) {
                    newCell = new WallCell(this.scene, x, y, this.cellSize, i, j);
                    if (cellData.wallClusterId) {
                        newCell.setClusterId(cellData.wallClusterId);
                    }
                } else if (cellData.isMine) {
                    newCell = new MineCell(this.scene, x, y, this.cellSize, i, j);
                } else if (cellData.isEnemy) {
                    newCell = new EnemyCell(this.scene, x, y, this.cellSize, i, j);
                } else if (cellData.isTreasure) {
                    newCell = new TreasureCell(this.scene, x, y, this.cellSize, i, j);
                } else if (cellData.isStairs) {
                    newCell = new StairsCell(this.scene, x, y, this.cellSize, i, j);
                } else {
                    newCell = new Cell(this.scene, x, y, this.cellSize, i, j);
                }

                // セルをボードに追加
                this.add(newCell);
                this.cells[i][j] = newCell;

                // セルのイベントをボードに伝播
                newCell.on('cellClicked', this.handleCellClick, this);
                newCell.on('cellRightClicked', this.handleCellRightClick, this);

                // セルの状態を更新
                if (cellData.isRevealed) {
                    newCell.reveal(cellData.neighborMines);
                }

                if (cellData.isFlagged) {
                    newCell.toggleFlag();
                }
            }
        }
    }

    // セルクリックイベントのハンドラー
    handleCellClick(cell) {
        // ボードレベルのイベントを発火
        this.emit('cellClicked', cell);
    }

    // セル右クリックイベントのハンドラー
    handleCellRightClick(cell) {
        // ボードレベルのイベントを発火
        this.emit('cellRightClicked', cell);
    }

    // 特定のセルのUI状態を更新
    updateCellUI(row, col, cellData) {
        const cell = this.cells[row][col];
        if (!cell) return;

        // セルの状態を更新
        if (cellData.isRevealed && !cell.revealed) {
            // もし特殊セルなら置き換える
            if (this.shouldReplaceCell(cellData, cell)) {
                this.replaceCell(row, col, cellData);
            } else {
                // 通常の更新
                cell.reveal(cellData.neighborMines);
            }
        }

        // 旗の状態を更新
        if (cellData.isFlagged !== cell.flagged) {
            cell.toggleFlag();
        }
    }

    // セルを置き換えるべきか判断
    shouldReplaceCell(cellData, cell) {
        // セルのタイプが変わる場合は置き換え
        if (cellData.isWall && cell.type !== 'wall') return true;
        if (cellData.isMine && cell.type !== 'mine') return true;
        if (cellData.isEnemy && cell.type !== 'enemy') return true;
        if (cellData.isTreasure && cell.type !== 'treasure') return true;
        if (cellData.isStairs && cell.type !== 'stairs') return true;

        return false;
    }

    // セルを置き換える
    replaceCell(row, col, cellData) {
        const oldCell = this.cells[row][col];
        const cellIndex = this.getAll().indexOf(oldCell);

        // 古いセルを削除
        if (cellIndex !== -1) {
            this.removeAt(cellIndex, true);
        }

        // セルの位置
        const x = col * this.cellSize;
        const y = row * this.cellSize;

        // 新しいセルを作成
        let newCell;

        if (cellData.isWall) {
            newCell = new WallCell(this.scene, x, y, this.cellSize, row, col);
            if (cellData.wallClusterId) {
                newCell.setClusterId(cellData.wallClusterId);
            }
        } else if (cellData.isMine) {
            newCell = new MineCell(this.scene, x, y, this.cellSize, row, col);
        } else if (cellData.isEnemy) {
            newCell = new EnemyCell(this.scene, x, y, this.cellSize, row, col);
        } else if (cellData.isTreasure) {
            newCell = new TreasureCell(this.scene, x, y, this.cellSize, row, col);
        } else if (cellData.isStairs) {
            newCell = new StairsCell(this.scene, x, y, this.cellSize, row, col);
        } else {
            newCell = new Cell(this.scene, x, y, this.cellSize, row, col);
        }

        // セルをボードに追加
        this.add(newCell);
        this.cells[row][col] = newCell;

        // セルのイベントをボードに伝播
        newCell.on('cellClicked', this.handleCellClick, this);
        newCell.on('cellRightClicked', this.handleCellRightClick, this);

        // セルの状態を更新
        if (cellData.isRevealed) {
            newCell.reveal(cellData.neighborMines);
        }

        if (cellData.isFlagged) {
            newCell.toggleFlag();
        }
    }

    // 階段セルをアクティブに
    activateStairs() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = this.cells[i][j];
                if (cell instanceof StairsCell && cell.revealed) {
                    cell.activate();
                }
            }
        }
    }

    // 敵の危険地帯を描画（現状はクリアのみ）
    drawEnemyDangerZones(boardData) {
        if (!this.overlayLayer) return;
        this.overlayLayer.clear();

        // 必要に応じてここに描画ロジックを追加
        // 例: Debugモードでのみ表示するなど
    }

    // ボードのサイズ変更
    resize(rows, cols, cellSize) {
        this.rows = rows;
        this.cols = cols;
        this.cellSize = cellSize;

        // ボードを再作成
        this.createBoard();
    }
}