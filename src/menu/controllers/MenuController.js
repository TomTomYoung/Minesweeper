class MenuController {
    constructor(scene) {
        this.scene = scene;
        this.currentMode = GameConfig.MODES.RPG; // Default
    }

    setMode(mode) {
        this.currentMode = mode;
    }

    startGame(difficulty, customConfig = null) {
        const gameData = this.scene.game.gameData;
        const gameConfig = gameData.gameConfig;

        if (difficulty !== 'custom') {
            const config = gameConfig.getConfig(difficulty);
            const modeConfig = GameConfig.applyMode(config, this.currentMode);
            gameConfig.updateConfig(modeConfig);
        } else if (customConfig) {
            // Validate Logic from original MenuScene
            const totalCells = customConfig.rows * customConfig.cols;
            const totalSpecial = customConfig.mines + customConfig.totalWalls + customConfig.treasures + customConfig.stairs;

            if (totalSpecial >= totalCells - 9) {
                return { error: '地雷・壁・お宝・階段の合計が多すぎます' };
            }

            // Cell Size
            const maxWidth = 700;
            const maxHeight = 500;
            const cellW = Math.min(Math.floor(maxWidth / customConfig.cols), 40);
            const cellH = Math.min(Math.floor(maxHeight / customConfig.rows), 40);
            customConfig.cellSize = Math.min(cellW, cellH);

            const modeConfig = GameConfig.applyMode(customConfig, this.currentMode); // Apply mode even to custom? Original code did.
            gameConfig.updateConfig(modeConfig);
        }

        // Save State
        gameData.difficulty = difficulty;
        gameData.mode = this.currentMode;
        gameData.score = 0;
        gameData.totalScore = 0;
        gameData.level = 1;

        // Start Scenes
        this.scene.scene.start('GameScene');
        this.scene.scene.start('UIScene');

        return { success: true };
    }
}
