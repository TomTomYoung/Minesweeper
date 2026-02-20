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
        this.config = config;
        this.level = level;

        // Score Manager
        this.scoreManager = new ScoreManager(currentScore, totalScore);

        this.elapsedMS = 0;
        this.timer = 0;
        this.flagsLeft = config.mines;
        this.isGameOver = false;
        this.isFirstClick = true;
        this.enemiesDefeated = 0;
        this.totalEnemies = config.enemies || 0;

        this.boardModel = null;
        this.boardData = null;
    }

    get score() {
        return this.scoreManager.getScore();
    }

    get totalScore() {
        return this.scoreManager.getTotalScore();
    }

    start(firstClick = null) {
        if (firstClick) {
            this.boardData = BoardGenerator.generate(this.config, firstClick);
            this.boardModel = new BoardModel(this.boardData);
            this.isFirstClick = false;
        } else {
            this.boardData = BoardGenerator.initBoardData(this.config.rows, this.config.cols);
            this.boardModel = new BoardModel(this.boardData);
            this.isFirstClick = true;
        }

        this.flagsLeft = this.config.mines;
        this.isGameOver = false;

        // Enemy Tracking
        this.enemiesDefeated = 0;
        this.totalEnemies = this.config.enemies || 0;

        return this.boardData;
    }

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

    handleCellClick(row, col) {
        if (this.isGameOver) return { events: [] };

        if (this.isFirstClick) {
            this.start({ row, col });
        }

        const result = this.boardModel.advanceState(row, col, {
            autoRevealWallCluster: this.config.autoRevealWallCluster
        });

        if (result.events.includes('STAIRS_INTERACTED')) {
            if (this.enemiesDefeated >= this.totalEnemies) {
                result.events.push('NEXT_LEVEL');
            } else {
                console.log(`Cannot advance. Enemies defeated: ${this.enemiesDefeated}/${this.totalEnemies}`);
            }
        }

        this._processResult(result);
        return result;
    }

    handleCellRightClick(row, col) {
        if (this.isGameOver) return { success: false };
        if (this.isFirstClick) return { success: false };

        const result = this.boardModel.toggleFlag(row, col, this.flagsLeft);
        if (result.success) {
            this.flagsLeft += result.flagsDelta;
            this._checkWinCondition();
        }
        return result;
    }

    _processResult(result) {
        if (result.events.includes('GAME_OVER')) {
            this.isGameOver = true;
        }

        if (result.scoreEvents) {
            for (const evt of result.scoreEvents) {
                if (evt.type === 'TREASURE') {
                    this.scoreManager.addPoints(this.config.treasurePoints);
                }
            }
        }

        if (result.events.includes('ENEMY_DEFEATED')) {
            this.enemiesDefeated++;
            console.log(`Enemy defeated! Total: ${this.enemiesDefeated}/${this.totalEnemies}`);
            // Bonus points for enemy?
            this.scoreManager.addPoints(50); // Arbitrary 50 points
        }

        if (!this.isGameOver) {
            this._checkWinCondition();
        }
    }

    _checkWinCondition() {
        const totalCells = this.config.rows * this.config.cols;
        const nonMineCells = totalCells - this.config.mines;

        let wallCells = 0;
        let revealedNonWallCells = 0;

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

            const timeBonus = this.scoreManager.calculateTimeBonus(this.timer);
            const flagBonus = this.flagsLeft * 10;
            const totalBonus = timeBonus + flagBonus;

            this.scoreManager.addPoints(totalBonus);

            return { event: 'WIN', bonus: totalBonus };
        }
        return null;
    }

    getWinState() {
        if (this.isGameOver && this.win) return { isWin: true };
        return { isWin: false };
    }
}
