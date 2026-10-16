class MenuController {
    constructor(scene) {
        this.scene = scene;
        const gameData = scene.game.gameData;
        this.currentMode = gameData ? (gameData.mode || GameConfig.MODES.RPG) : GameConfig.MODES.RPG;
    }

    setMode(mode) {
        this.currentMode = mode;
    }

    startGame(difficulty, customConfig = null) {
        const gameData = this.scene.game.gameData;
        const gameConfig = gameData.gameConfig;

        const base = difficulty === 'custom'
            ? { ...gameConfig.getConfig('easy'), ...customConfig }
            : gameConfig.getConfig(difficulty);
        // Validate the effective mode configuration, not unused RPG fields in CLASSIC.
        const config = GameConfig.applyMode(base, this.currentMode);
        const error = GameConfig.validate(config, this.currentMode);
        if (error) return { error };
        if (difficulty === 'custom') {
            config.cellSize = Math.min(40, Math.floor(700 / config.cols), Math.floor(390 / config.rows));
        }
        gameConfig.updateConfig(config);

        // Save State
        gameData.difficulty = difficulty;
        gameData.mode = this.currentMode;
        gameData.score = 0;
        gameData.totalScore = 0;
        gameData.level = 1;

        // Start Scenes - ensure clean restart
        if (this.scene.scene.isActive('GameScene')) {
            this.scene.scene.stop('GameScene');
        }

        if (this.scene.scene.isActive('UIScene')) {
            this.scene.scene.stop('UIScene');
        }

        this.scene.scene.start('GameScene');
        this.scene.scene.start('UIScene');

        return { success: true };
    }
}

