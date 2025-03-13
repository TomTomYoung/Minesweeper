// UIScene.js - ゲームUIを管理するシーン（GameSceneの上に重ねて表示）
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // UIの初期化
        this.createUI();
        
        // イベントリスナーの設定
        this.setupEventListeners();
    }
    
    createUI() {
        // UIコンテナを作成
        this.uiContainer = this.add.container(0, 0);
        
        // 上部パネル
        this.createTopPanel();
        
        // メッセージパネル
        this.createMessagePanel();
        
        // 新しいゲームボタン
        this.createNewGameButton();
        
        // メニューに戻るボタン
        this.createMenuButton();
    }
    
    createTopPanel() {
        // 上部パネル背景
        const topPanelBg = this.add.rectangle(
            this.cameras.main.width / 2,
            25,
            this.cameras.main.width,
            50,
            0xf0f0f0
        ).setStrokeStyle(1, 0xdddddd);
        this.uiContainer.add(topPanelBg);
        
        // 情報アイテムの間隔と幅
        const itemWidth = 180;
        const spacing = 20;
        const totalItems = 4; // 旗、時間、スコア、総スコア
        const totalWidth = itemWidth * totalItems + spacing * (totalItems - 1);
        const startX = (this.cameras.main.width - totalWidth) / 2;
        
        // 旗（地雷）カウンター
        this.createInfoItem(
            startX + itemWidth / 2,
            25,
            '🚩 残り:',
            '10',
            'flagsLeft'
        );
        
        // タイマー
        this.createInfoItem(
            startX + itemWidth + spacing + itemWidth / 2,
            25,
            '⏱️ 時間:',
            '0',
            'timer'
        );
        
        // スコア
        this.createInfoItem(
            startX + (itemWidth + spacing) * 2 + itemWidth / 2,
            25,
            '💎 得点:',
            '0',
            'score'
        );
        
        // 総スコア
        this.createInfoItem(
            startX + (itemWidth + spacing) * 3 + itemWidth / 2,
            25,
            '🏆 総得点:',
            '0',
            'totalScore'
        );
    }
    
    createInfoItem(x, y, label, value, key) {
        const container = this.add.container(x, y);
        
        // 背景
        const bg = this.add.rectangle(0, 0, 170, 35, 0xdddddd, 0.7)
            .setStrokeStyle(1, 0xcccccc);
            
        // ラベル
        const labelText = this.add.text(-75, 0, label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#333'
        }).setOrigin(0, 0.5);
        
        // 値
        const valueText = this.add.text(30, 0, value, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#333'
        }).setOrigin(0, 0.5);
        
        container.add([bg, labelText, valueText]);
        this.uiContainer.add(container);
        
        // 参照を保存
        if (!this.uiElements) this.uiElements = {};
        this.uiElements[key] = valueText;
    }
    
    createMessagePanel() {
        // メッセージパネル（画面下部）
        const messageY = this.cameras.main.height - 35;
        
        this.messageText = this.add.text(
            this.cameras.main.width / 2,
            messageY,
            '',
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                fontWeight: 'bold',
                color: '#333'
            }
        ).setOrigin(0.5);
        
        this.uiContainer.add(this.messageText);
    }
    
    createNewGameButton() {
        const button = this.add.container(70, 70);
        
        // 背景
        const bg = this.add.rectangle(0, 0, 120, 35, 0x4CAF50, 1)
            .setInteractive()
            .on('pointerdown', () => this.restartGame())
            .on('pointerover', () => bg.setFillColor(0x45a049))
            .on('pointerout', () => bg.setFillColor(0x4CAF50));
        
        // テキスト
        const text = this.add.text(0, 0, '新しいゲーム', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#fff'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        this.uiContainer.add(button);
    }
    
    createMenuButton() {
        const button = this.add.container(70, 110);
        
        // 背景
        const bg = this.add.rectangle(0, 0, 120, 35, 0x2196F3, 1)
            .setInteractive()
            .on('pointerdown', () => this.returnToMenu())
            .on('pointerover', () => bg.setFillColor(0x1976D2))
            .on('pointerout', () => bg.setFillColor(0x2196F3));
        
        // テキスト
        const text = this.add.text(0, 0, 'メニューへ', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#fff'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        this.uiContainer.add(button);
    }
    
    setupEventListeners() {
        // GameSceneからのイベントをリッスン
        this.game.events.on('updateUI', this.updateUI, this);
        this.game.events.on('showMessage', this.showMessage, this);
    }
    
    // UI要素を更新
    updateUI(data) {
        // 各UI要素を更新
        if (data.flagsLeft !== undefined && this.uiElements.flagsLeft) {
            this.uiElements.flagsLeft.setText(data.flagsLeft.toString());
        }
        
        if (data.timer !== undefined && this.uiElements.timer) {
            this.uiElements.timer.setText(data.timer.toString());
        }
        
        if (data.score !== undefined && this.uiElements.score) {
            this.uiElements.score.setText(data.score.toString());
        }
        
        if (data.totalScore !== undefined && this.uiElements.totalScore) {
            this.uiElements.totalScore.setText(data.totalScore.toString());
        }
    }
    
    // メッセージを表示
    showMessage(data) {
        // 既存のタイマーをキャンセル
        if (this.messageTimer) {
            this.messageTimer.remove();
        }
        
        // メッセージを設定
        this.messageText.setText(data.text);
        this.messageText.setColor(data.color || '#333');
        
        // 時間指定がある場合、タイマーを設定
        if (data.duration) {
            this.messageTimer = this.time.delayedCall(data.duration, () => {
                this.messageText.setText('');
            });
        }
    }
    
    // ゲームを再スタート
    restartGame() {
        // 同じ設定で新しいゲームを開始
        this.scene.get('GameScene').restartGame();
    }
    
    // メニューに戻る
    returnToMenu() {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
    }
}