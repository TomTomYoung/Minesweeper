/**
 * ScoreManager.js
 * 
 * Manages game score, total score, and high score tracking.
 * 
 * Responsibilities:
 * - Tracking current game score.
 * - Tracking global total score.
 * - Handling score addition rules (bonuses etc).
 */
class ScoreManager {
    constructor(initialScore = 0, initialTotalScore = 0) {
        this.score = initialScore;
        this.totalScore = initialTotalScore;
    }

    reset() {
        this.score = 0;
        // Total score might persist across levels, so typically we don't reset totalScore here unless full game restart.
    }

    addPoints(points) {
        this.score += points;
        this.totalScore += points;
        return this.score;
    }

    getScore() {
        return this.score;
    }

    getTotalScore() {
        return this.totalScore;
    }

    calculateTimeBonus(timer) {
        return Math.max(500 - timer, 0);
    }
}
