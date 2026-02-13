/**
 * @fileoverview GameConfig.js
 * 
 * Game Logic Configuration Manager.
 * 
 * This class manages the configuration settings for the Minesweeper game logic,
 * including difficulty levels (easy, medium, hard) and their specific parameters
 * such as grid size, mine count, and special cell generation rules.
 * 
 * Usages:
 * - Instantiated in global scope (or GameData) to hold current game settings.
 * - Used by GameSession and BoardGenerator to determine board layout and rules.
 */

class GameConfig {
    /**
     * @constructor
     * Initializes default configurations for 'easy', 'medium', and 'hard'.
     */
    constructor() {
        /**
         * Default configuration templates.
         * @type {Object.<string, Object>}
         */
        this.defaultConfigs = {
            easy: {
                /** @type {number} Number of rows in the grid */
                rows: 9,
                /** @type {number} Number of columns in the grid */
                cols: 9,
                /** @type {number} Total number of mines */
                mines: 10,
                /** @type {number} Number of wall clusters to generate */
                wallClusters: 3,
                /** @type {number} Total number of wall cells */
                totalWalls: 10,
                /** @type {number} Number of treasure cells */
                treasures: 3,
                /** @type {number} Number of enemies (must be defeated to advance) */
                enemies: 2,
                /** @type {number} Number of stairs cells (for level transition) */
                stairs: 1,
                /** @type {boolean} Whether wall cells count towards neighbor mine numbers */
                wallsCountInCalculation: true,
                /** @type {boolean} Whether clicking a wall reveals the entire cluster */
                autoRevealWallCluster: false,
                /** @type {number} Score points awarded for finding a treasure */
                treasurePoints: 100,
                /** @type {number} Pixel size of a cell (View parameter) */
                cellSize: 40
            },
            medium: {
                rows: 16,
                cols: 16,
                mines: 40,
                wallClusters: 5,
                totalWalls: 25,
                treasures: 5,
                enemies: 3,
                stairs: 1,
                wallsCountInCalculation: true,
                autoRevealWallCluster: false,
                treasurePoints: 100,
                cellSize: 35
            },
            hard: {
                rows: 16,
                cols: 30,
                mines: 99,
                wallClusters: 8,
                totalWalls: 40,
                treasures: 8,
                enemies: 5,
                stairs: 2,
                wallsCountInCalculation: true,
                autoRevealWallCluster: false,
                treasurePoints: 100,
                cellSize: 30
            }
        };

        /**
         * The currently active configuration.
         * @type {Object}
         */
        this.currentConfig = { ...this.defaultConfigs.easy };
    }

    /**
     * Retrieves a copy of the configuration for a specific difficulty.
     * 
     * @param {string} [difficulty='easy'] - The difficulty key ('easy', 'medium', 'hard').
     * @returns {Object} A copy of the configuration object.
     */
    getConfig(difficulty = 'easy') {
        if (this.defaultConfigs[difficulty]) {
            return { ...this.defaultConfigs[difficulty] };
        }
        return { ...this.defaultConfigs.easy };
    }

    /**
     * Updates the current configuration with partial new settings.
     * 
     * @param {Object} newConfig - Partial configuration object to merge.
     * @returns {Object} The updated current configuration.
     */
    updateConfig(newConfig) {
        this.currentConfig = { ...this.currentConfig, ...newConfig };
        return this.currentConfig;
    }

    /**
     * Returns a copy of the current configuration.
     * 
     * @returns {Object} A copy of the current configuration.
     */
    getCurrentConfig() {
        return { ...this.currentConfig };
    }

    /**
     * Adjusts the current configuration based on the game level.
     * Increases difficulty (mines, treasure points) as levels progress.
     * 
     * @param {number} level - The current game level (1-based).
     * @returns {Object} A new configuration object adjusted for the level.
     */
    adjustForLevel(level) {
        if (level <= 1) return this.currentConfig;

        const adjustedConfig = { ...this.currentConfig };

        // Slightly increase mines (up to 30% of total cells)
        const totalCells = adjustedConfig.rows * adjustedConfig.cols;
        adjustedConfig.mines = Math.min(
            Math.floor(adjustedConfig.mines * (1 + 0.1 * (level - 1))),
            Math.floor(totalCells * 0.3)
        );

        // Increase treasure value
        adjustedConfig.treasurePoints = Math.floor(adjustedConfig.treasurePoints * (1.0 + 0.2 * (level - 1)));

        return adjustedConfig;
    }

    /**
     * Applies mode-specific overrides to the configuration.
     * @param {Object} config - The base configuration.
     * @param {string} mode - The game mode ('RPG' or 'STANDARD').
     * @returns {Object} The config with mode settings applied.
     */
    static applyMode(config, mode) {
        const newConfig = { ...config };
        if (mode === 'STANDARD') {
            newConfig.wallClusters = 0;
            newConfig.totalWalls = 0;
            newConfig.treasures = 0;
            newConfig.stairs = 0;
            newConfig.enemies = 0;
            newConfig.wallsCountInCalculation = false;
            newConfig.autoRevealWallCluster = false;
        }
        return newConfig;
    }
}

GameConfig.MODES = {
    RPG: 'RPG',
    STANDARD: 'STANDARD'
};