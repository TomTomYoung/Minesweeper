// BootScene.js - アセットのロードと初期化を行うシーン
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // ロード中の表示
        this.createLoadingBar();

        // アセットのロード
        this.loadAssets();
    }

    create() {
        console.log('BootScene started');
        if (this.game.plugins.plugins.some(p => p.key === 'rexUI')) {
            console.log('RexUI plugin found in plugin manager');
        } else if (window.rexuiplugin) {
            console.log('RexUI plugin found in window');
        } else {
            console.warn('RexUI plugin NOT found');
        }

        // ゲーム設定の初期化
        this.game.gameData.gameConfig = new GameConfig();

        // メインメニューへ
        this.scene.start('MenuScene');
    }

    // ロード中の進行バーを作成
    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // ロード中テキスト
        this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#333333'
        }).setOrigin(0.5);

        // 進行バーの背景
        const progressBarBg = this.add.rectangle(width / 2, height / 2, 400, 30, 0x222222);

        // 進行バー
        const progressBar = this.add.rectangle(width / 2 - 200, height / 2, 0, 30, 0x00ff00).setOrigin(0, 0.5);

        // 進行状況を更新
        this.load.on('progress', (value) => {
            progressBar.width = 400 * value;
        });

        this.load.on('loaderror', (file) => {
            console.error('Asset load error:', file.src);
        });
    }

    // ゲームで使用するアセットをロード
    loadAssets() {
        // 画像
        this.load.image('dummy', 'assets/images/dummy.png');
        this.load.image('mine', 'assets/images/mine.png');
        this.load.image('flag', 'assets/images/flag.png');
        this.load.image('wall', 'assets/images/wall.png');
        this.load.image('treasure', 'assets/images/treasure.png');
        this.load.image('stairs', 'assets/images/stairs.png');
        this.load.image('enemy', 'assets/images/enemy.png');
        this.load.image('key', 'assets/images/key.png');
        this.load.image('sword', 'assets/images/sword.png');

        // 音声素材はまだ同梱していないため、正式採用するまで読み込まない。
        // 呼び出し側はサウンドが登録済みかを確認してから再生する。

        // テクスチャアトラスやスプライトシートがあれば追加
    }
}
