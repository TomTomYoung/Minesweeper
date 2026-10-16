/**
 * @fileoverview BoardModel.js
 * 
 * Game Board State Model.
 * 
 * This class encapsulates the state and logic of the Minesweeper board.
 * It manages the grid of cells, handles cell revealing logic (including recursion),
 * manages flags, and provides state queries (e.g., neighbor mine counts).
 * 
 * It is a pure logic class and does not directly interact with the Phaser UI.
 * Start/End of game states are reported back via return values.
 * 
 * Input:
 * - Initialized board data array (from BoardGenerator).
 * 
 * Output:
 * - Result objects containing events ('GAME_OVER', 'TREASURE', etc.) and state updates.
 */

class BoardModel {
    /**
     * @param {Array<Array<Object>>} boardData - BoardGeneratorで生成されたボードデータ
     */
    constructor(boardData) {
        this.board = boardData;
        this.rows = boardData.length;
        this.cols = boardData[0].length;
    }

    /**
     * セルの状態を進める（クリックやインタラクト）
     * 状態: 0=隠蔽、1=表示、2=アクション完了
     */
    advanceState(row, col, options = {}) {
        const cell = this.board[row][col];
        if (cell.isFlagged) return { events: [], scoreEvents: [] };

        if (!cell.isRevealed) {
            return this.reveal(row, col, options);
        } else {
            return cell.interact(this, row, col);
        }
    }

    /**
     * 指定されたセルを取得
     */
    getCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.board[row][col];
        }
        return null;
    }

    getViewState(row, col) {
        const cell = this.getCell(row, col);
        return { viewType: cell.viewType, isRevealed: cell.isRevealed,
            isFlagged: cell.isFlagged, state: cell.state, neighborMines: cell.neighborMines,
            wallClusterId: cell.wallClusterId, treasureContent: cell.treasureContent };
    }

    getViewData() {
        return this.board.map((row, r) => row.map((cell, c) => this.getViewState(r, c)));
    }

    /**
     * 旗の切り替え
     * @param {number} row 
     * @param {number} col 
     * @param {number} flagsLeft - 残りの旗の数
     * @returns {Object} 結果 { success: boolean, flagsDelta: number }
     */
    toggleFlag(row, col, flagsLeft) {
        const cell = this.board[row][col];

        if (cell.isRevealed) {
            return { success: false, flagsDelta: 0 };
        }

        if (cell.isFlagged) {
            cell.isFlagged = false;
            return { success: true, flagsDelta: 1 };
        } else {
            if (flagsLeft <= 0) {
                return { success: false, flagsDelta: 0 };
            }
            cell.isFlagged = true;
            return { success: true, flagsDelta: -1 };
        }
    }

    /**
     * セルを開く
     * @param {number} row 
     * @param {number} col 
     * @param {Object} options - オプション
     * @param {boolean} options.autoRevealWallCluster - 壁クラスターの一括オープン有無
     * @returns {Object} 結果レポート { events: Array<string>, scoreInfo: Array<Object> }
     */
    reveal(row, col, options = {}) {
        const cell = this.board[row][col];
        return cell.reveal(this, row, col, options);
    }

    /**
     * 全てのセルを表示 (ゲームオーバー時)
     */
    revealAll() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j].isRevealed = true;
                this.board[i][j].isFlagged = false;
                this.board[i][j].state = Math.max(1, this.board[i][j].state);
            }
        }
    }
}

