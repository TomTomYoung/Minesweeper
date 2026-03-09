// Board.js - 繧ｲ繝ｼ繝繝懊・繝峨ｒ邂｡逅・☆繧九け繝ｩ繧ｹ
class Board extends Phaser.GameObjects.Container {
    constructor(scene, x, y, rows, cols, cellSize) {
        super(scene, x, y);
        scene.add.existing(this);

        this.rows = rows;
        this.cols = cols;
        this.cellSize = cellSize;

        // 繧ｻ繝ｫ縺ｮ2谺｡蜈・・蛻・
        this.cells = [];

        // 繝懊・繝峨ｒ菴懈・
        this.createBoard();
    }

    // 繝懊・繝峨・菴懈・
    createBoard() {
        // 譌｢蟄倥・繧ｻ繝ｫ繧偵け繝ｪ繧｢
        this.removeAll(true);
        this.cells = [];

        // 陦後＃縺ｨ縺ｫ繧ｻ繝ｫ繧剃ｽ懈・
        for (let i = 0; i < this.rows; i++) {
            this.cells[i] = [];

            for (let j = 0; j < this.cols; j++) {
                // 繧ｻ繝ｫ縺ｮ菴咲ｽｮ
                const x = j * this.cellSize;
                const y = i * this.cellSize;

                // 騾壼ｸｸ縺ｮ繧ｻ繝ｫ繧剃ｽ懈・
                const cell = new Cell(this.scene, x, y, this.cellSize, i, j);

                // 繧ｻ繝ｫ繧偵・繝ｼ繝峨↓霑ｽ蜉
                this.add(cell);
                this.cells[i][j] = cell;

                // 繧ｻ繝ｫ縺ｮ繧､繝吶Φ繝医ｒ繝懊・繝峨↓莨晄眺
                cell.on('cellClicked', this.handleCellClick, this);
                cell.on('cellRightClicked', this.handleCellRightClick, this);
            }
        }

        // Overlay Layer (for Enemy Danger Zones etc.)
        this.overlayLayer = this.scene.add.graphics();
        this.add(this.overlayLayer);
    }

    // 繧ｻ繝ｫ縺ｮ遞ｮ鬘槭ｒ譖ｴ譁ｰ・亥｣√∝慍髮ｷ縲√♀螳昴・嚴谿ｵ・・
    updateCellTypes(boardData) {
        // 繧ｻ繝ｫ縺ｮ遞ｮ鬘槭ｒ驕ｩ蛻・↓險ｭ螳・
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cellData = boardData[i][j];
                const currentCell = this.cells[i][j];

                // 迴ｾ蝨ｨ縺ｮ繧ｻ繝ｫ繧貞炎髯､
                const cellIndex = this.getAll().indexOf(currentCell);
                if (cellIndex !== -1) {
                    this.removeAt(cellIndex, true);
                }

                // 繧ｻ繝ｫ縺ｮ菴咲ｽｮ
                const x = j * this.cellSize;
                const y = i * this.cellSize;

                // 譁ｰ縺励＞繧ｻ繝ｫ繧剃ｽ懈・・医ち繧､繝励↓蠢懊§縺ｦ・・
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

                // 繧ｻ繝ｫ繧偵・繝ｼ繝峨↓霑ｽ蜉
                this.add(newCell);
                this.cells[i][j] = newCell;

                // 繧ｻ繝ｫ縺ｮ繧､繝吶Φ繝医ｒ繝懊・繝峨↓莨晄眺
                newCell.on('cellClicked', this.handleCellClick, this);
                newCell.on('cellRightClicked', this.handleCellRightClick, this);

                // 繧ｻ繝ｫ縺ｮ迥ｶ諷九ｒ譖ｴ譁ｰ
                if (cellData.isRevealed) {
                    newCell.reveal(cellData.neighborMines);
                }

                if (cellData.isFlagged) {
                    newCell.toggleFlag();
                }
            }
        }
    }

    // 繧ｻ繝ｫ繧ｯ繝ｪ繝・け繧､繝吶Φ繝医・繝上Φ繝峨Λ繝ｼ
    handleCellClick(cell) {
        // 繝懊・繝峨Ξ繝吶Ν縺ｮ繧､繝吶Φ繝医ｒ逋ｺ轣ｫ
        this.emit('cellClicked', cell);
    }

    // 繧ｻ繝ｫ蜿ｳ繧ｯ繝ｪ繝・け繧､繝吶Φ繝医・繝上Φ繝峨Λ繝ｼ
    handleCellRightClick(cell) {
        // 繝懊・繝峨Ξ繝吶Ν縺ｮ繧､繝吶Φ繝医ｒ逋ｺ轣ｫ
        this.emit('cellRightClicked', cell);
    }

    // 迚ｹ螳壹・繧ｻ繝ｫ縺ｮUI迥ｶ諷九ｒ譖ｴ譁ｰ
    updateCellUI(row, col, cellData) {
        const cell = this.cells[row][col];
        if (!cell) return;

        // 繧ｻ繝ｫ縺ｮ迥ｶ諷九ｒ譖ｴ譁ｰ
        if (cellData.isRevealed && !cell.revealed) {
            // 繧ゅ＠迚ｹ谿翫そ繝ｫ縺ｪ繧臥ｽｮ縺肴鋤縺医ｋ
            if (this.shouldReplaceCell(cellData, cell)) {
                this.replaceCell(row, col, cellData);
            } else {
                // 騾壼ｸｸ縺ｮ譖ｴ譁ｰ
                cell.reveal(cellData.neighborMines);
            }
        }

        // 譌励・迥ｶ諷九ｒ譖ｴ譁ｰ
        if (cellData.isFlagged !== cell.flagged) {
            cell.toggleFlag();
        }
    }

    // 繧ｻ繝ｫ繧堤ｽｮ縺肴鋤縺医ｋ縺ｹ縺阪°蛻､譁ｭ
    shouldReplaceCell(cellData, cell) {
        // 繧ｻ繝ｫ縺ｮ繧ｿ繧､繝励′螟峨ｏ繧句ｴ蜷医・鄂ｮ縺肴鋤縺・
        if (cellData instanceof WallLogicCell && !(cell instanceof WallCell)) return true;
        if (cellData instanceof MineLogicCell && !(cell instanceof MineCell)) return true;
        if (cellData instanceof EnemyLogicCell && !(cell instanceof EnemyCell)) return true;
        if (cellData instanceof TreasureLogicCell && !(cell instanceof TreasureCell)) return true;
        if (cellData instanceof StairsLogicCell && !(cell instanceof StairsCell)) return true;

        return false;
    }

    // 繧ｻ繝ｫ繧堤ｽｮ縺肴鋤縺医ｋ
    replaceCell(row, col, cellData) {
        const oldCell = this.cells[row][col];
        const cellIndex = this.getAll().indexOf(oldCell);

        // 蜿､縺・そ繝ｫ繧貞炎髯､
        if (cellIndex !== -1) {
            this.removeAt(cellIndex, true);
        }

        // 繧ｻ繝ｫ縺ｮ菴咲ｽｮ
        const x = col * this.cellSize;
        const y = row * this.cellSize;

        // 譁ｰ縺励＞繧ｻ繝ｫ繧剃ｽ懈・
        // !WARNING: This uses the global Phaser cell classes (e.g., window.WallCell if available, or just assumes they are loaded).
        // Since we introduced Logic cells with the EXACT SAME NAMES (WallCell, MineCell, etc.), 
        // there is a namespace collision. The logic cells in src/logic/cells/ overwritten the Phaser UI cells in src/objects/special/.

        let newCell;

        // Logic cells and UI cells share names (WallCell, MineCell, etc.).
        // Because of the script load order, the UI cells (src/objects/special/) define WallCell,
        // and then logic cells (src/logic/cells/) redefine WallCell as a plain JS class.
        // Therefore, `new WallCell(this.scene, ...)` fails because the logic WallCell expects no arguments 
        // and doesn't extend Phaser.GameObjects.Container (thus reading 'sys' of undefined scene).

        // To fix this quickly without renaming all logic or UI classes, we can explicitly instantiate the View classes 
        // if we rename the Logic classes. But since we already wrote the UI classes as MineCell, we need to rename the logic classes.

        // 繧ｻ繝ｫ繧偵・繝ｼ繝峨↓霑ｽ蜉
        this.add(newCell);
        this.cells[row][col] = newCell;

        // 繧ｻ繝ｫ縺ｮ繧､繝吶Φ繝医ｒ繝懊・繝峨↓莨晄眺
        newCell.on('cellClicked', this.handleCellClick, this);
        newCell.on('cellRightClicked', this.handleCellRightClick, this);

        // 繧ｻ繝ｫ縺ｮ迥ｶ諷九ｒ譖ｴ譁ｰ
        if (cellData.isRevealed) {
            newCell.reveal(cellData.neighborMines);
        }

        if (cellData.isFlagged) {
            newCell.toggleFlag();
        }
    }

    // 髫取ｮｵ繧ｻ繝ｫ繧偵い繧ｯ繝・ぅ繝悶↓
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

    // 謨ｵ縺ｮ蜊ｱ髯ｺ蝨ｰ蟶ｯ繧呈緒逕ｻ・育樟迥ｶ縺ｯ繧ｯ繝ｪ繧｢縺ｮ縺ｿ・・
    drawEnemyDangerZones(boardData) {
        if (!this.overlayLayer) return;
        this.overlayLayer.clear();

        // 蠢・ｦ√↓蠢懊§縺ｦ縺薙％縺ｫ謠冗判繝ｭ繧ｸ繝・け繧定ｿｽ蜉
        // 萓・ Debug繝｢繝ｼ繝峨〒縺ｮ縺ｿ陦ｨ遉ｺ縺吶ｋ縺ｪ縺ｩ
    }

    // 繝懊・繝峨・繧ｵ繧､繧ｺ螟画峩
    resize(rows, cols, cellSize) {
        this.rows = rows;
        this.cols = cols;
        this.cellSize = cellSize;

        // 繝懊・繝峨ｒ蜀堺ｽ懈・
        this.createBoard();
    }
}
