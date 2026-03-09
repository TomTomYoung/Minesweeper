/**
 * @fileoverview BoardGenerator.js
 * 
 * 繧ｲ繝ｼ繝逶､髱｢逕滓・繝ｭ繧ｸ繝・け (Game Board Generator Logic)
 * 
 * 繝槭う繝ｳ繧ｹ繧､繝ｼ繝代・縺ｮ逶､髱｢繧偵・繝ｭ繧ｷ繝ｼ繧ｸ繝｣繝ｫ縺ｫ逕滓・縺吶ｋ髱咏噪繧ｯ繝ｩ繧ｹ縺ｧ縺吶・
 * 蝨ｰ髮ｷ縲∝｣√√♀螳昴・嚴谿ｵ縺ｮ驟咲ｽｮ繧貞ｰる摩縺ｮ繧ｹ繝医Λ繝・ず繝ｼ・域姶逡･繧ｯ繝ｩ繧ｹ・峨↓蟋碑ｭｲ縺励※陦後＞縺ｾ縺吶・
 */

class BoardGenerator {
    /**
     * 逶､髱｢繝・・繧ｿ繧堤函謌舌☆繧・
     * @param {Object} config - GameConfig縺九ｉ蜿門ｾ励＠縺溯ｨｭ螳壹が繝悶ず繧ｧ繧ｯ繝・
     * @param {Object} firstClick - 蛻晏屓繧ｯ繝ｪ繝・け菴咲ｽｮ {row, col}
     * @returns {Array<Array<Object>>} 逕滓・縺輔ｌ縺溽乢髱｢繝・・繧ｿ縺ｮ2谺｡蜈・・蛻・
     */
    static generate(config, firstClick) {
        // 1. 逶､髱｢縺ｮ蛻晄悄蛹厄ｼ亥・繧ｻ繝ｫ繧偵ョ繝輔か繝ｫ繝育憾諷九〒菴懈・・・
        const board = this.initBoardData(config.rows, config.cols);

        // 2. 螳牙・蝨ｰ蟶ｯ・・afe Zone・峨・遒ｺ菫・
        // 蛻晏屓繧ｯ繝ｪ繝・け菴咲ｽｮ縺ｨ縺昴・蜻ｨ蝗ｲ縺ｯ蝨ｰ髮ｷ縺ｪ縺ｩ繧帝・鄂ｮ縺励↑縺・
        const safeZone = this.getSafeZone(config.rows, config.cols, firstClick.row, firstClick.col);

        // 3. 蝨ｰ髮ｷ縺ｮ驟咲ｽｮ (MinePlacementStrategy)
        // 繝ｩ繝ｳ繝繝縺ｫ蝨ｰ髮ｷ繧帝・鄂ｮ縺励∪縺吶りｨｭ螳壹＆繧後◆蝨ｰ髮ｷ謨ｰ(config.mines)驟咲ｽｮ縺輔ｌ繧九∪縺ｧ郢ｰ繧願ｿ斐＠縺ｾ縺吶・
        MinePlacementStrategy.place(board, config, safeZone);

        // 4. 縺雁ｮ昴→髫取ｮｵ縺ｮ驟咲ｽｮ (ItemPlacementStrategy)
        // RPG繝｢繝ｼ繝臥畑縲ょ慍髮ｷ縺後↑縺・ｮ牙・縺ｪ蝣ｴ謇・医け繝ｩ繧ｹ繧ｿ繝ｼ・峨ｒ隕九▽縺代※驟咲ｽｮ縺励∪縺吶・
        // 騾壼ｸｸ繝｢繝ｼ繝峨〒縺ｯ0蛟九↑縺ｮ縺ｧ繧ｹ繧ｭ繝・・縺輔ｌ縺ｾ縺吶・
        ItemPlacementStrategy.place(board, config, safeZone);

        // 5. 繧ｨ繝阪Α繝ｼ・医・繝繧ｻ繝ｫ・峨・驟咲ｽｮ (EnemyPlacementStrategy)
        // RPG繝｢繝ｼ繝臥畑縲りｨｭ螳壽焚(config.enemies)縺縺代お繝阪Α繝ｼ繧帝・鄂ｮ縺励∪縺吶る壼ｸｸ繝｢繝ｼ繝峨〒縺ｯ0蛟九↑縺ｮ縺ｧ繧ｹ繧ｭ繝・・縺輔ｌ縺ｾ縺吶・
        EnemyPlacementStrategy.place(board, config, safeZone);

        // Note: 螢・ｼ・all・峨・驟咲ｽｮ
        // config.wallClusters 縺ｫ蠢懊§縺ｦ逕滓・縺励∪縺吶・
        WallPlacementStrategy.place(board, config, safeZone);

        // 6. 謨ｰ蟄暦ｼ磯團謗･縺吶ｋ蝨ｰ髮ｷ謨ｰ・峨・險育ｮ・
        // 逶､髱｢荳翫・蝨ｰ髮ｷ繝ｻ繧ｨ繝阪Α繝ｼ繝ｻ螢√ｒ繧ｫ繧ｦ繝ｳ繝医＠縺ｦ蜷・そ繝ｫ縺ｫ險ｭ螳壹＠縺ｾ縺吶・
        this.calculateNeighborMines(board, config.rows, config.cols);

        return board;
    }

    /**
     * 謖・ｮ壹し繧､繧ｺ縺ｧ遨ｺ縺ｮ逶､髱｢繝・・繧ｿ繧貞・譛溷喧縺吶ｋ
     */
    static initBoardData(rows, cols) {
        return Array(rows).fill().map(() =>
            Array(cols).fill().map(() => new EmptyLogicCell())
        );
    }

    /**
     * 蛻晏屓繧ｯ繝ｪ繝・け菴咲ｽｮ蜻ｨ蝗ｲ縺ｮ螳牙・蝨ｰ蟶ｯ・亥慍髮ｷ繧堤ｽｮ縺九↑縺・ｴ謇・峨ｒ蜿門ｾ励☆繧・
     * 
     * 繧ｲ繝ｼ繝髢句ｧ区凾縺ｮ逅・ｸ榊ｰｽ縺ｪ蜊ｳ豁ｻ繧帝亟縺舌◆繧√∵怙蛻昴↓繧ｯ繝ｪ繝・け縺励◆繝槭せ縺ｨ
     * 縺昴・蜻ｨ蝗ｲ8繝槭せ・郁ｨ・繝槭せ・峨ｒ縲悟ｮ牙・蝨ｰ蟶ｯ縲阪→縺励※遒ｺ菫昴＠縺ｾ縺吶・
     * 
     * @returns {Set<string>} 螳牙・蝨ｰ蟶ｯ縺ｮ蠎ｧ讓吶そ繝・ヨ ("row,col"蠖｢蠑・
     */
    static getSafeZone(rows, cols, centerRow, centerCol) {
        const safeZone = new Set();

        // 蛻晏屓繧ｯ繝ｪ繝・け菴咲ｽｮ(centerRow, centerCol)繧剃ｸｭ蠢・→縺励◆3x3縺ｮ遽・峇繧偵Ν繝ｼ繝励＠縺ｾ縺・
        // Math.max/min 繧剃ｽｿ縺・％縺ｨ縺ｧ縲∫乢髱｢縺ｮ遶ｯ・・陦檎岼繧・怙邨り｡後↑縺ｩ・峨°繧峨・縺ｿ蜃ｺ縺輔↑縺・ｈ縺・↓蛻ｶ蠕｡縺励※縺・∪縺・

        // 髢句ｧ玖｡・ 繧ｯ繝ｪ繝・け菴咲ｽｮ縺ｮ1縺､荳翫ゅ◆縺縺・繧医ｊ蟆上＆縺上↑繧峨↑縺・ｈ縺・↓縺吶ｋ・育乢髱｢荳顔ｫｯ縺ｮ蟇ｾ遲厄ｼ・
        const startRow = Math.max(0, centerRow - 1);

        // 邨ゆｺ・｡・ 繧ｯ繝ｪ繝・け菴咲ｽｮ縺ｮ1縺､荳九ゅ◆縺縺・rows-1)繧医ｊ螟ｧ縺阪￥縺ｪ繧峨↑縺・ｈ縺・↓縺吶ｋ・育乢髱｢荳狗ｫｯ縺ｮ蟇ｾ遲厄ｼ・
        const endRow = Math.min(rows - 1, centerRow + 1);

        // 蛻励↓縺､縺・※繧ょ酔讒倥↓縲∝ｷｦ蜿ｳ縺ｮ遶ｯ繧定ｶ・∴縺ｪ縺・ｯ・峇繧定ｨ育ｮ励＠縺ｾ縺・
        const startCol = Math.max(0, centerCol - 1);
        const endCol = Math.min(cols - 1, centerCol + 1);

        // 險育ｮ励＠縺溽ｯ・峇・域怙螟ｧ3x3繝槭せ・峨ｒ襍ｰ譟ｻ
        for (let i = startRow; i <= endRow; i++) {
            for (let j = startCol; j <= endCol; j++) {
                // 螳牙・蝨ｰ蟶ｯ縺ｮ蠎ｧ讓吶ｒ "陦・蛻・ 縺ｨ縺・≧譁・ｭ怜・蠖｢蠑上〒險倬鹸
                // Set繧剃ｽｿ縺・％縺ｨ縺ｧ縲・㍾隍・↑縺丞ｺｧ讓吶ｒ邂｡逅・〒縺阪∪縺・
                safeZone.add(`${i},${j}`);
            }
        }
        return safeZone;
    }

    /**
     * 蜈ｨ繧ｻ繝ｫ縺ｮ髫｣謗･蝨ｰ髮ｷ謨ｰ繧定ｨ育ｮ励＠縺ｦ險ｭ螳壹☆繧・
     */
    static calculateNeighborMines(board, rows, cols) {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (!board[i][j].isMine) {
                    const count = this.countNeighborMines(board, rows, cols, i, j);

                    // If the cell is an empty cell but has neighbor mines, upgrade it to a NumberCell
                    if (count > 0 && board[i][j] instanceof EmptyLogicCell) {
                        const newCell = new NumberLogicCell();
                        // Transfer state
                        newCell.isRevealed = board[i][j].isRevealed;
                        newCell.isFlagged = board[i][j].isFlagged;
                        newCell.state = board[i][j].state;
                        board[i][j] = newCell;
                    }

                    board[i][j].neighborMines = count;
                }
            }
        }
    }

    /**
     * 迚ｹ螳壹・繧ｻ繝ｫ蜻ｨ蝗ｲ縺ｮ蝨ｰ髮ｷ謨ｰ繧偵き繧ｦ繝ｳ繝医☆繧・
     * ・井ｻ墓ｧ俶嶌29陦檎岼繝ｻ145陦檎岼・壹お繝阪Α繝ｼ繧・｣∬・菴薙・謨ｰ蟄励・險育ｮ励↓蜷ｫ縺ｾ繧後↑縺・ｼ・
     * 
     * @param {Array<Array<Object>>} board - 逶､髱｢繝・・繧ｿ驟榊・
     * @param {number} rows - 繧ｰ繝ｪ繝・ラ縺ｮ陦梧焚
     * @param {number} cols - 繧ｰ繝ｪ繝・ラ縺ｮ蛻玲焚
     * @param {number} row - 蟇ｾ雎｡繧ｻ繝ｫ縺ｮ陦後う繝ｳ繝・ャ繧ｯ繧ｹ
     * @param {number} col - 蟇ｾ雎｡繧ｻ繝ｫ縺ｮ蛻励う繝ｳ繝・ャ繧ｯ繧ｹ
     * @returns {number} 蜻ｨ蝗ｲ8繝槭せ縺ｮ蝨ｰ髮ｷ縺ｮ蜷郁ｨ域焚
     */
    static countNeighborMines(board, rows, cols, row, col) {
        let count = 0;
        for (let i = Math.max(0, row - 1); i <= Math.min(rows - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(cols - 1, col + 1); j++) {
                // 閾ｪ蛻・・霄ｫ縺ｯ繧ｫ繧ｦ繝ｳ繝医＠縺ｪ縺・
                if (i === row && j === col) continue;

                const cell = board[i][j];
                // 蝨ｰ髮ｷ縺ｮ縺ｿ繧ｫ繧ｦ繝ｳ繝・
                if (cell.isMine) {
                    count++;
                }
            }
        }
        return count;
    }
}
