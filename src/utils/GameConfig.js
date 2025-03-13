// GameConfig.js - ゲーム設定を管理するクラス
class GameConfig {
    constructor() {
        // デフォルト設定
        this.defaultConfigs = {
            easy: {
                rows: 9,
                cols: 9,
                mines: 10,
                wallClusters: 3,
                totalWalls: 10,
                treasures: 3,
                stairs: 1,
                wallsCountInCalculation: true,
                autoRevealWallCluster: false,
                treasurePoints: 100,
                cellSize: 40 // Phaserでのセルのピクセルサイズ
            },
            medium: {
                rows: 16,
                cols: 16,
                mines: 40,
                wallClusters: 5,
                totalWalls: 25,
                treasures: 5,
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
                stairs: 2,
                wallsCountInCalculation: true,
                autoRevealWallCluster: false,
                treasurePoints: 100,
                cellSize: 30
            }
        };
        
        // 現在のゲーム設定
        this.currentConfig = { ...this.defaultConfigs.easy };
    }
    
    // 難易度に基づいて設定を取得
    getConfig(difficulty = 'easy') {
        if (this.defaultConfigs[difficulty]) {
            return { ...this.defaultConfigs[difficulty] };
        }
        return { ...this.defaultConfigs.easy };
    }
    
    // 設定を更新
    updateConfig(newConfig) {
        this.currentConfig = { ...this.currentConfig, ...newConfig };
        return this.currentConfig;
    }
    
    // 現在の設定を取得
    getCurrentConfig() {
        return { ...this.currentConfig };
    }
    
    // レベルに応じて難易度を調整
    adjustForLevel(level) {
        if (level <= 1) return this.currentConfig;
        
        const adjustedConfig = { ...this.currentConfig };
        
        // 地雷を少し増やす（最大でセル数の30%まで）
        const totalCells = adjustedConfig.rows * adjustedConfig.cols;
        adjustedConfig.mines = Math.min(
            Math.floor(adjustedConfig.mines * (1 + 0.1 * (level - 1))),
            Math.floor(totalCells * 0.3)
        );
        
        // お宝の価値を上げる
        adjustedConfig.treasurePoints = Math.floor(adjustedConfig.treasurePoints * (1.0 + 0.2 * (level - 1)));
        
        return adjustedConfig;
    }
}