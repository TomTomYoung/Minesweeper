// Phaserゲームインスタンスを作成
window.addEventListener('load', () => {
    // ゲーム設定を作成
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#f0f0f0',
        scene: [BootScene, MenuScene, GameScene, UIScene],
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        plugins: {
            scene: [{
                key: 'rexUI',
                plugin: rexuiplugin,
                mapping: 'rexUI'
            }]
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };

    // ゲームインスタンスを作成
    const game = new Phaser.Game(config);

    // グローバルゲームデータを追加
    game.gameData = {
        difficulty: 'easy',
        level: 1,
        mode: window.initialGameMode || 'RPG', // Default to RPG if not set
        score: 0,
        totalScore: 0,
        gameConfig: null
    };
});