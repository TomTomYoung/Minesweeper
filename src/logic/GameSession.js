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
     * @param {string} mode - game mode or a supported legacy mode name
     */
    constructor(config, level = 1, currentScore = 0, totalScore = 0, mode = 'STANDARD') {
        this.config = config;
        this.level = level;
        this.modeDefinition = GameModeRegistry.resolve(mode);
        this.mode = this.modeDefinition.id;
        this.ruleSet = this.modeDefinition.ruleSet;

        // Score Manager
        this.scoreManager = new ScoreManager(currentScore, totalScore);

        this.elapsedMS = 0;
        this.timer = 0;
        this.flagsLeft = config.mines;
        this.isGameOver = false;
        this.isTransitioning = false;
        this.isFirstClick = true;
        this.enemiesDefeated = 0;
        this.totalEnemies = config.enemies || 0;
        this.inventory = { swords: 0, pickaxes: 0 };

        this.boardModel = null;
        this.boardData = null;
        this.placementCounts = null;
    }

    get score() {
        return this.scoreManager.getScore();
    }

    get totalScore() {
        return this.scoreManager.getTotalScore();
    }

    start(firstClick = null) {
        if (firstClick) {
            this.boardData = this.modeDefinition.boardGenerator.generate(this.config, firstClick);
            this.boardModel = new this.modeDefinition.boardModel(this.boardData);
            this.placementCounts = this.boardData.placementCounts;
            this.isFirstClick = false;
        } else {
            this.boardData = this.modeDefinition.boardGenerator.initBoardData(this.config.rows, this.config.cols);
            this.boardModel = new this.modeDefinition.boardModel(this.boardData);
            this.placementCounts = null;
            this.isFirstClick = true;
        }

        this.flagsLeft = this.placementCounts ? this.placementCounts.mines : this.config.mines;
        this.isGameOver = false;
        this.isTransitioning = false;
        this.win = false;
        this.elapsedMS = 0;
        this.timer = 0;

        this.enemiesDefeated = 0;
        this.totalEnemies = this.placementCounts ? this.placementCounts.enemies : (this.config.enemies || 0);

        // Item flags
        this.hasKey = false;
        this.hasSword = false;
        this.inventory = { swords: 0, pickaxes: 0 };

        return this.boardData;
    }

    updateTimer(delta) {
        if (this.isGameOver || this.isFirstClick || this.isTransitioning) return false;

        this.elapsedMS += delta;
        if (this.elapsedMS >= 1000) {
            const seconds = Math.floor(this.elapsedMS / 1000);
            this.timer += seconds;
            this.elapsedMS -= seconds * 1000;
            return true;
        }
        return false;
    }

    handleCellClick(row, col) {
        if (this.isGameOver || this.isTransitioning) return { events: [] };

        if (this.isFirstClick) {
            try {
                this.start({ row, col });
            } catch (error) {
                if (!(error instanceof RangeError)) throw error;
                return { events: ['GENERATION_FAILED'], scoreEvents: [], error: error.message };
            }
        }

        const result = this.boardModel.advanceState(row, col, {
            autoRevealWallCluster: this.config.autoRevealWallCluster,
            inventory: this.inventory
        });

        if (result.events.includes('STAIRS_INTERACTED')) {
            const progression = this.ruleSet.evaluateStairs(this);
            if (progression.canAdvance) {
                this.isTransitioning = true;
                result.events.push('NEXT_LEVEL');
            }
            result.progression = progression;
        }

        this._processResult(result);
        return result;
    }

    handleCellRightClick(row, col) {
        if (this.isGameOver || this.isTransitioning) return { success: false };
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
            this.boardModel.revealAll();
        }

        if (result.scoreEvents) {
            for (const evt of result.scoreEvents) {
                if (evt.type === 'TREASURE_GOLD') {
                    this.scoreManager.addPoints(this.config.treasurePoints);
                }
            }
        }

        if (result.events.includes('ITEM_KEY')) {
            this.hasKey = true;
            console.log("Got Key!");
        }

        if (result.events.includes('ITEM_SWORD')) {
            this.hasSword = true;
            // Optionally add some bonus points or handle later
            if (this.mode !== GameModeId.RPG_LAYERED) this.scoreManager.addPoints(50);
            console.log("Got Sword!");
        }

        for (const reward of result.itemRewards || []) {
            const key = reward.type === 'sword' ? 'swords' : 'pickaxes';
            this.inventory[key] += reward.amount;
        }
        if (this.mode === GameModeId.RPG_LAYERED) this.hasSword = this.inventory.swords > 0;

        for (const event of result.events) {
            if (event !== 'ENEMY_DEFEATED') continue;
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
        if (this.isGameOver || !this.ruleSet.shouldCheckClassicWin()) return null;

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
            this.boardModel.revealAll();

            const timeBonus = this.scoreManager.calculateTimeBonus(this.timer);
            const flagBonus = this.flagsLeft * 10;
            const totalBonus = timeBonus + flagBonus;

            this.scoreManager.addPoints(totalBonus);

            return { event: 'WIN', bonus: totalBonus };
        }
        return null;
    }

    // Commit a reserved transition exactly once. Items belong to their floor.
    advanceLevel() {
        if (!this.isTransitioning || this.isGameOver) return false;
        this.level++;
        this.scoreManager.reset();
        this.hasKey = false;
        this.hasSword = false;
        this.inventory = { swords: 0, pickaxes: 0 };
        // Keep input locked until the scene creates the next session.
        this.isGameOver = true;
        return true;
    }

    getWinState() {
        if (this.isGameOver && this.win) return { isWin: true };
        return { isWin: false };
    }
}

