// Board.js - ゲームボ�Eドを管琁E��るクラス
class Board extends Phaser.GameObjects.Container {
    constructor(scene, x, y, rows, cols, cellSize) {
        super(scene, x, y);
        scene.add.existing(this);

        this.rows = rows;
        this.cols = cols;
        this.cellSize = cellSize;

        // セルの2次允E�E刁E
        this.cells = [];

        // ボ�Eドを作�E
        this.createBoard();
    }

    // ボ�Eド�E作�E
    createBoard() {
        // 既存�Eセルをクリア
        this.removeAll(true);
        this.cells = [];

        // 行ごとにセルを作�E
        for (let i = 0; i < this.rows; i++) {
            this.cells[i] = [];

            for (let j = 0; j < this.cols; j++) {
                // セルの位置
                const x = j * this.cellSize;
                const y = i * this.cellSize;

                // 通常のセルを作�E
                const cell = new Cell(this.scene, x, y, this.cellSize, i, j);

                // セルを�Eードに追加
                this.add(cell);
                this.cells[i][j] = cell;

                // セルのイベントをボ�Eドに伝播
                cell.on('cellClicked', this.handleCellClick, this);
                cell.on('cellRightClicked', this.handleCellRightClick, this);
            }
        }

        // Overlay Layer (for Enemy Danger Zones etc.)
        this.overlayLayer = this.scene.add.graphics();
        this.add(this.overlayLayer);
    }

    // セルの種類を更新�E�壁、地雷、お宝、E��段�E�E
    updateCellTypes(boardData) {
        // セルの種類を適刁E��設宁E
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

                // 新しいセルを作�E�E�タイプに応じて�E�E
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

                // セルを�Eードに追加
                this.add(newCell);
                this.cells[i][j] = newCell;

                // セルのイベントをボ�Eドに伝播
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

    // セルクリチE��イベント�Eハンドラー
    handleCellClick(cell) {
        // ボ�Eドレベルのイベントを発火
        this.emit('cellClicked', cell);
    }

    // セル右クリチE��イベント�Eハンドラー
    handleCellRightClick(cell) {
        // ボ�Eドレベルのイベントを発火
        this.emit('cellRightClicked', cell);
    }

    // 特定�EセルのUI状態を更新
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

        // 旗�E状態を更新
        if (cellData.isFlagged !== cell.flagged) {
            cell.toggleFlag();
        }
    }

    shouldReplaceCell(cellData, cell) {
        // セルのタイプが変わる場合�E置き換ぁE
        if (cellData instanceof WallLogicCell && !(cell instanceof WallCell)) return true;
        if (cellData instanceof MineLogicCell && !(cell instanceof MineCell)) return true;
        if (cellData instanceof EnemyLogicCell && !(cell instanceof EnemyCell)) return true;
        if (cellData instanceof TreasureLogicCell && !(cell instanceof TreasureCell)) return true;
        if (cellData instanceof StairsLogicCell && !(cell instanceof StairsCell)) return true;

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

        let newCell;

        if (cellData instanceof WallLogicCell) {
            newCell = new WallCell(this.scene, x, y, this.cellSize, row, col);
            if (cellData.wallClusterId) {
                newCell.setClusterId(cellData.wallClusterId);
            }
        } else if (cellData instanceof MineLogicCell) {
            newCell = new MineCell(this.scene, x, y, this.cellSize, row, col);
        } else if (cellData instanceof EnemyLogicCell) {
            newCell = new EnemyCell(this.scene, x, y, this.cellSize, row, col);
        } else if (cellData instanceof TreasureLogicCell) {
            newCell = new TreasureCell(this.scene, x, y, this.cellSize, row, col);
        } else if (cellData instanceof StairsLogicCell) {
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
    // 階段セルをアクチE��ブに
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

    // 敵の危険地帯を描画�E�現状はクリアのみ�E�E
    drawEnemyDangerZones(boardData) {
        if (!this.overlayLayer) return;
        this.overlayLayer.clear();

        // 忁E��に応じてここに描画ロジチE��を追加
        // 侁E Debugモードでのみ表示するなど
    }

    // ボ�Eド�Eサイズ変更
    resize(rows, cols, cellSize) {
        this.rows = rows;
        this.cols = cols;
        this.cellSize = cellSize;

        // ボ�Eドを再作�E
        this.createBoard();
    }
}

