/**
 * @fileoverview GameSession.js
 * 
 * Game Session Manager.
 * 
 * This class coordinates the overall game flow, managing the "Session State"
 * which includes the current score, time, level, and victory/defeat status.
 * 
 * It acts as the Controller in the MVC pattern (Model: BoardModel, View: GameScene/Board).
 * It delegates board operations to BoardModel and interprets the results to update the session state.
 * 
 * Input:
 * - Game Config (from GameConfig).
 * - User inputs (Click / Right Click) from GameScene.
 * 
 * Output:
 * - High-level game events (GAME_OVER, WIN, NEXT_LEVEL).
 * - Updates key game stats (Score, Timer).
 */

class GameSession {
    /**
     * @param {Object} config - ゲーム設定
     * @param {number} level - 現在のレベル
     * @param {number} currentScore - 現在のスコア
     * @param {number} totalScore - 累計スコア
     */
    constructor(config, level = 1, currentScore = 0, totalScore = 0) {
        this.config = config; // BoardGenerator用の設定も含む
        this.level = level;
        this.score = currentScore;
        this.totalScore = totalScore;

        this.timer = 0;
        this.elapsedMS = 0;
        this.flagsLeft = config.mines;
        this.isGameOver = false;
        this.isFirstClick = true;

        // BoardModelは初期化時に生成されるか、後でセットされる
        this.boardModel = null;
        this.boardData = null; // View用の参照
    }

    /**
     * ゲームを開始/初期化
     * @param {Object} firstClick - {row, col} 最初のクリック位置。nullの場合は空のボードを作成。
     */
    start(firstClick = null) {
        if (firstClick) {
            // 最初のクリック位置に基づいてボードを生成
            this.boardData = BoardGenerator.generate(this.config, firstClick);
            this.boardModel = new BoardModel(this.boardData);
            this.isFirstClick = false;

            // 隣接地雷数は generator で計算済み
        } else {
            // 空のボードを初期化
            this.boardData = BoardGenerator.initBoardData(this.config.rows, this.config.cols);
            this.boardModel = new BoardModel(this.boardData);
            this.isFirstClick = true;
        }

        // 状態リセット
        this.flagsLeft = this.config.mines;
        this.isGameOver = false;

        return this.boardData;
    }

    /**
     * タイマー更新
     * @param {number} delta - 経過時間(ms)
     * @returns {boolean} タイマーが更新されたか（秒が変わったか）
     */
    updateTimer(delta) {
        if (this.isGameOver || this.isFirstClick) return false;

        this.elapsedMS += delta;
        if (this.elapsedMS >= 1000) {
            this.timer++;
            this.elapsedMS -= 1000;
            return true;
        }
        return false;
    }

    /**
     * セルをクリック
     * @param {number} row 
     * @param {number} col 
     * @returns {Object} 結果 { events, scoreEvents, boardUpdates }
     */
    handleCellClick(row, col) {
        if (this.isGameOver) return { events: [] };

        if (this.isFirstClick) {
            this.start({ row, col });
            // 初期化後、そのセルを開く処理はBoardModelにはない（Generateで安全確保済み）
            // ただし、Generatorは「安全地帯」を作るだけで「開く」処理はしない。
            // したがって、初期化後に通常通り reveal を呼ぶ必要がある。
        }

        const cell = this.boardModel.getCell(row, col);

        // 既に開かれている場合（特殊処理：お宝、階段、数字クリック）
        if (cell.isRevealed) {
            if (cell.isStairs) {
                return { events: ['NEXT_LEVEL'] };
            }
            if (!cell.isWall && !cell.isMine && !cell.isTreasure) {
                return this.boardModel.expandRevealedNumberCell(row, col);
            }
            return { events: [] };
        }

        // 未開封セルを開く
        const result = this.boardModel.reveal(row, col, {
            autoRevealWallCluster: this.config.autoRevealWallCluster
        });

        // 結果の反映（スコア計算など）
        this._processResult(result);

        return result;
    }

    /**
     * 右クリック（旗）
     */
    handleCellRightClick(row, col) {
        if (this.isGameOver) return { success: false };

        // まだクリックされていない（ボード未生成）場合は、仮のボードに対して処理するか、
        // あるいは最初のクリックまでは旗を立てられない仕様にするか。
        // ここではまだ生成されていないなら何もしない（通常ありえないが）
        if (this.isFirstClick) return { success: false };

        const result = this.boardModel.toggleFlag(row, col, this.flagsLeft);
        if (result.success) {
            this.flagsLeft += result.flagsDelta;
            this._checkWinCondition();
        }
        return result;
    }

    /**
     * Modelの結果をSessionに反映
     */
    _processResult(result) {
        if (result.events.includes('GAME_OVER')) {
            this.isGameOver = true;
        }

        if (result.scoreEvents) {
            for (const evt of result.scoreEvents) {
                if (evt.type === 'TREASURE') {
                    this._addScore(this.config.treasurePoints);
                }
            }
        }

        if (!this.isGameOver) {
            this._checkWinCondition();
        }
    }

    _addScore(points) {
        this.score += points;
        this.totalScore += points; // グローバルスコアへの反映は呼び出し元で行うか、ここで管理するか
        // GameDataという共有オブジェクトがあるようなので、同期が必要
    }

    _checkWinCondition() {
        const totalCells = this.config.rows * this.config.cols;
        const nonMineCells = totalCells - this.config.mines;

        let wallCells = 0;
        let revealedNonWallCells = 0;

        // Modelからデータを走査
        for (let i = 0; i < this.config.rows; i++) {
            for (let j = 0; j < this.config.cols; j++) {
                const cell = this.boardModel.getCell(i, j);
                if (cell.isWall) {
                    wallCells++;
                } else if (cell.isRevealed) {
                    revealedNonWallCells++;
                }
            }
        }

        if (revealedNonWallCells === nonMineCells - wallCells) {
            this.isGameOver = true;
            this.win = true;
            // ボーナス計算
            const timeBonus = Math.max(500 - this.timer, 0);
            const flagBonus = this.flagsLeft * 10;
            const totalBonus = timeBonus + flagBonus;
            this._addScore(totalBonus);

            return { event: 'WIN', bonus: totalBonus };
        }
        return null; // まだ続いてる
    }

    getWinState() {
        // 前回のcheckWinConditionの結果を保存しておくか、毎回計算するか。
        // ここでは簡易的に、isGameOverかつwinフラグがあれば勝ちとする
        if (this.isGameOver && this.win) return { isWin: true };
        return { isWin: false };
    }
}
