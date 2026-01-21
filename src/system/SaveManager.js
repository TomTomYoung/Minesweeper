/**
 * SaveManager.js
 * 
 * Central system for persisting data to LocalStorage.
 * Handles:
 * - Saving/Loading High Scores
 * - Saving/Loading Game Settings
 */
class SaveManager {
    constructor() {
        this.STORAGE_KEY_PREFIX = 'minesweeper_rpg_';
    }

    saveHighScore(mode, difficulty, score) {
        const key = `${this.STORAGE_KEY_PREFIX}highscore_${mode}_${difficulty}`;
        const currentHigh = this.getHighScore(mode, difficulty);

        if (score > currentHigh) {
            localStorage.setItem(key, score.toString());
            return true; // New record
        }
        return false;
    }

    getHighScore(mode, difficulty) {
        const key = `${this.STORAGE_KEY_PREFIX}highscore_${mode}_${difficulty}`;
        const val = localStorage.getItem(key);
        return val ? parseInt(val, 10) : 0;
    }

    saveSettings(settings) {
        const key = `${this.STORAGE_KEY_PREFIX}settings`;
        localStorage.setItem(key, JSON.stringify(settings));
    }

    loadSettings() {
        const key = `${this.STORAGE_KEY_PREFIX}settings`;
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
    }
}
