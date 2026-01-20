// MenuScene.js - ゲームのメインメニュー画面
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // デフォルトモード
        this.currentMode = GameConfig.MODES.RPG;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // タイトル
        this.add.text(width / 2, 80, 'マインスイーパー', GAME_CONFIG.TEXT_STYLES.TITLE)
            .setOrigin(0.5);

        // サブタイトル
        this.add.text(width / 2, 130, 'お宝と階段セル付き', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#555',
            align: 'center'
        }).setOrigin(0.5);

        // モード選択
        this.createModeSelection();

        // 難易度選択ボタン
        this.createDifficultyButtons();

        // カスタム設定ボタン
        this.createCustomButton();

        // カスタム設定パネル（初期状態では非表示）
        this.createCustomPanel();
    }

    // モード選択UIを作成
    createModeSelection() {
        const width = this.cameras.main.width;
        const y = 180;

        this.add.text(width / 2 - 100, y, 'モード:', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#333'
        }).setOrigin(1, 0.5);

        // RPGモードボタン
        this.btnRPG = this.createButton(
            width / 2,
            y,
            120,
            30,
            'RPGモード',
            0xFF9800, // Orange
            () => this.setMode(GameConfig.MODES.RPG)
        );

        // 通常モードボタン
        this.btnStandard = this.createButton(
            width / 2 + 140,
            y,
            120,
            30,
            '通常モード',
            0x9E9E9E, // Grey (inactive initially)
            () => this.setMode(GameConfig.MODES.STANDARD)
        );

        this.updateModeUI();
    }

    setMode(mode) {
        this.currentMode = mode;
        this.updateModeUI();
    }

    updateModeUI() {
        // ボタンの色を更新して現在選択中のモードを示す
        const activeColor = 0xFF9800;
        const inactiveColor = 0x9E9E9E;

        // ボタンの背景（矩形）を取得して色を変更
        // createButtonの構造: Container[Rectangle, Text]
        const rpgBg = this.btnRPG.getAt(0);
        const stdBg = this.btnStandard.getAt(0);

        if (this.currentMode === GameConfig.MODES.RPG) {
            rpgBg.setFillStyle(activeColor);
            stdBg.setFillStyle(inactiveColor);
        } else {
            rpgBg.setFillStyle(inactiveColor);
            stdBg.setFillStyle(activeColor);
        }
    }

    // 難易度選択ボタンを作成
    createDifficultyButtons() {
        const buttonStyle = {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#fff'
        };

        const buttonY = 250;
        const buttonWidth = 180;
        const buttonHeight = 50;
        const spacing = 30;
        const totalWidth = buttonWidth * 3 + spacing * 2;
        const startX = (this.cameras.main.width - totalWidth) / 2;

        // 初級ボタン
        this.createButton(
            startX + buttonWidth / 2,
            buttonY,
            buttonWidth,
            buttonHeight,
            '初級 (9x9)',
            0x4CAF50,
            () => this.startGame('easy')
        );

        // 中級ボタン
        this.createButton(
            startX + buttonWidth + spacing + buttonWidth / 2,
            buttonY,
            buttonWidth,
            buttonHeight,
            '中級 (16x16)',
            0x2196F3,
            () => this.startGame('medium')
        );

        // 上級ボタン
        this.createButton(
            startX + (buttonWidth + spacing) * 2 + buttonWidth / 2,
            buttonY,
            buttonWidth,
            buttonHeight,
            '上級 (16x30)',
            0xF44336,
            () => this.startGame('hard')
        );
    }

    // カスタムボタンを作成
    createCustomButton() {
        this.createButton(
            this.cameras.main.width / 2,
            330,
            200,
            50,
            'カスタム設定',
            0x9C27B0,
            () => this.toggleCustomPanel()
        );
    }

    // カスタム設定パネルを作成
    createCustomPanel() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // パネル背景
        this.customPanel = this.add.container(width / 2, height / 2 + 50);
        this.customPanel.setVisible(false);

        const panelBg = this.add.rectangle(0, 0, 500, 300, 0xf8f8f8)
            .setStrokeStyle(2, 0xdddddd);
        this.customPanel.add(panelBg);

        // パネルタイトル
        const title = this.add.text(0, -130, 'カスタム設定', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#333'
        }).setOrigin(0.5);
        this.customPanel.add(title);

        // 設定フィールドを追加
        this.createCustomFields();

        // 適用ボタン
        const applyButton = this.createButton(
            -100,
            110,
            150,
            40,
            '適用',
            0x4CAF50,
            () => this.applyCustomSettings(),
            this.customPanel
        );

        // キャンセルボタン
        const cancelButton = this.createButton(
            100,
            110,
            150,
            40,
            'キャンセル',
            0xf44336,
            () => this.toggleCustomPanel(false),
            this.customPanel
        );
    }

    // カスタム設定のフィールドを作成
    createCustomFields() {
        const fieldData = [
            { label: '行数:', key: 'rows', min: 5, max: 30, default: 9 },
            { label: '列数:', key: 'cols', min: 5, max: 30, default: 9 },
            { label: '地雷数:', key: 'mines', min: 1, max: 200, default: 10 },
            { label: '壁クラスター数:', key: 'wallClusters', min: 0, max: 20, default: 3 },
            { label: '壁の総数:', key: 'totalWalls', min: 0, max: 100, default: 15 },
            { label: 'お宝の数:', key: 'treasures', min: 0, max: 20, default: 3 },
            { label: '階段の数:', key: 'stairs', min: 1, max: 5, default: 1 }
        ];

        this.customFields = {};

        fieldData.forEach((field, index) => {
            const y = -90 + index * 30;

            // ラベル
            const label = this.add.text(-220, y, field.label, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#333'
            }).setOrigin(0, 0.5);

            // 入力フィールド（Phaserには直接のテキスト入力はないため、視覚的な表現のみ）
            const inputBg = this.add.rectangle(-70, y, 100, 25, 0xffffff)
                .setStrokeStyle(1, 0xcccccc);

            // 値テキスト
            const valueText = this.add.text(-70, y, field.default.toString(), {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#333'
            }).setOrigin(0.5);

            // 減少ボタン
            const decreaseBtn = this.add.text(-125, y, '-', {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#333'
            }).setOrigin(0.5).setInteractive();

            // 増加ボタン
            const increaseBtn = this.add.text(-15, y, '+', {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#333'
            }).setOrigin(0.5).setInteractive();

            // 相互作用の設定
            decreaseBtn.on('pointerdown', () => {
                let currentValue = parseInt(valueText.text);
                if (currentValue > field.min) {
                    currentValue--;
                    valueText.setText(currentValue.toString());
                }
            });

            increaseBtn.on('pointerdown', () => {
                let currentValue = parseInt(valueText.text);
                if (currentValue < field.max) {
                    currentValue++;
                    valueText.setText(currentValue.toString());
                }
            });

            // 要素を追加
            this.customPanel.add([label, inputBg, valueText, decreaseBtn, increaseBtn]);

            // フィールド参照を保存
            this.customFields[field.key] = valueText;
        });

        // 追加オプション
        const toggleY = -90 + fieldData.length * 30;

        // 壁を数に含める
        this.createToggle(
            -220, toggleY,
            '壁を数えに含める',
            true,
            'wallsCountInCalculation',
            this.customPanel
        );

        // 壁クラスターの自動公開
        this.createToggle(
            -220, toggleY + 30,
            '壁クラスターを自動公開',
            false,
            'autoRevealWallCluster',
            this.customPanel
        );
    }

    // トグルスイッチを作成
    createToggle(x, y, label, initialState, key, parent = null) {
        const container = this.add.container(x, y);
        if (parent) parent.add(container);

        // ラベル
        const labelText = this.add.text(0, 0, label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#333'
        }).setOrigin(0, 0.5);
        container.add(labelText);

        // トグル背景
        const toggleBg = this.add.rectangle(labelText.width + 30, 0, 50, 24, 0xdddddd)
            .setStrokeStyle(1, 0xcccccc);
        container.add(toggleBg);

        // トグルスイッチ
        const toggleSwitch = this.add.rectangle(
            labelText.width + (initialState ? 42 : 18), 0,
            18, 18,
            initialState ? 0x4CAF50 : 0xcccccc
        );
        container.add(toggleSwitch);

        // 相互作用を追加
        toggleBg.setInteractive();
        toggleBg.on('pointerdown', () => {
            const isOn = toggleSwitch.x > labelText.width + 25;
            toggleSwitch.x = isOn ? labelText.width + 18 : labelText.width + 42;
            toggleSwitch.fillColor = isOn ? 0xcccccc : 0x4CAF50;
        });

        // トグル参照を保存
        if (!this.customToggles) this.customToggles = {};
        this.customToggles[key] = { bg: toggleBg, switch: toggleSwitch };

        return container;
    }

    // ボタンを作成する汎用関数
    createButton(x, y, width, height, text, color, callback, parent = null) {
        // ボタンコンテナ
        const button = this.add.container(x, y);
        if (parent) parent.add(button);

        // 背景
        const bg = this.add.rectangle(0, 0, width, height, color, 1)
            .setInteractive()
            .on('pointerdown', callback)
            .on('pointerover', () => bg.setFillColor(this.lightenColor(color, 20)))
            .on('pointerout', () => bg.setFillColor(color));

        // テキスト
        const buttonText = this.add.text(0, 0, text, GAME_CONFIG.TEXT_STYLES.BUTTON)
            .setOrigin(0.5);

        button.add([bg, buttonText]);
        return button;
    }

    // 色を明るくする関数
    lightenColor(color, percent) {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;

        const lightenValue = (value) => {
            return Math.min(255, value + Math.floor(value * (percent / 100)));
        };

        return (lightenValue(r) << 16) + (lightenValue(g) << 8) + lightenValue(b);
    }

    // カスタムパネルの表示/非表示を切り替え
    toggleCustomPanel(visible = null) {
        const newVisible = visible !== null ? visible : !this.customPanel.visible;
        this.customPanel.setVisible(newVisible);
    }

    // カスタム設定を適用してゲーム開始
    applyCustomSettings() {
        // カスタム設定を取得
        let customConfig = {
            rows: parseInt(this.customFields.rows.text),
            cols: parseInt(this.customFields.cols.text),
            mines: parseInt(this.customFields.mines.text),
            wallClusters: parseInt(this.customFields.wallClusters.text),
            totalWalls: parseInt(this.customFields.totalWalls.text),
            treasures: parseInt(this.customFields.treasures.text),
            stairs: parseInt(this.customFields.stairs.text),
            wallsCountInCalculation: this.customToggles.wallsCountInCalculation.switch.x > this.customToggles.wallsCountInCalculation.switch.parentContainer.getAt(0).width + 25,
            autoRevealWallCluster: this.customToggles.autoRevealWallCluster.switch.x > this.customToggles.autoRevealWallCluster.switch.parentContainer.getAt(0).width + 25,
            treasurePoints: 100
        };

        // モード適用 (通常モードならRPG要素を強制0)
        customConfig = GameConfig.applyMode(customConfig, this.currentMode);

        // バリデーション
        const totalCells = customConfig.rows * customConfig.cols;
        const totalSpecialCells = customConfig.mines + customConfig.totalWalls + customConfig.treasures + customConfig.stairs;

        if (totalSpecialCells >= totalCells - 9) {
            // エラーメッセージを表示
            const errorMsg = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height - 100,
                '地雷、壁、お宝、階段の合計がセル数-9より少なくする必要があります',
                {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    color: '#ff0000',
                    align: 'center'
                }
            ).setOrigin(0.5);

            // 数秒後に消去
            this.time.delayedCall(3000, () => {
                errorMsg.destroy();
            });

            return;
        }

        // セルサイズを設定
        const maxWidth = 700; // 画面の最大使用幅
        const maxHeight = 500; // 画面の最大使用高さ
        const cellWidth = Math.min(Math.floor(maxWidth / customConfig.cols), 40);
        const cellHeight = Math.min(Math.floor(maxHeight / customConfig.rows), 40);
        customConfig.cellSize = Math.min(cellWidth, cellHeight);

        // 設定を適用してゲーム開始
        this.game.gameData.gameConfig.updateConfig(customConfig);
        this.startGame('custom', customConfig);
    }

    // ゲームを開始
    startGame(difficulty, customConfig = null) {
        // 難易度設定を適用
        if (difficulty !== 'custom') {
            const config = this.game.gameData.gameConfig.getConfig(difficulty);
            // モード適用
            const modeConfig = GameConfig.applyMode(config, this.currentMode);
            this.game.gameData.gameConfig.updateConfig(modeConfig);
        } else {
            // customConfigは既にapplyMode済み
        }

        // 難易度を保存
        this.game.gameData.difficulty = difficulty;
        this.game.gameData.mode = this.currentMode; // モードも保存

        // スコアをリセット
        this.game.gameData.score = 0;
        this.game.gameData.totalScore = 0;
        this.game.gameData.level = 1;

        // ゲームシーンを起動
        this.scene.start('GameScene');
        this.scene.start('UIScene');
    }
}