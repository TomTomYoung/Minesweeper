// UIScene.js - UI層を管理するシーン
// RexUI Pluginを使用してスクロールバーとズームスライダーを実装

class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        this.initializeUI();
        this.setupEventListeners();

        // 初期表示のために更新を要求
        this.time.delayedCall(100, () => {
            this.game.events.emit('requestUIUpdate');
        });
    }

    initializeUI() {
        // 解像度やカメラ設定に関係なく、画面全体を使う
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.mainContainer = this.add.container(0, 0);

        // --- 1. Top Panel (Info) ---
        // 中央上部
        this.infoPanel = new InfoPanel(this, width / 2, 25, width);
        this.mainContainer.add(this.infoPanel);

        // --- 2. Message Panel ---
        // Top Center (InfoPanelの下)
        const messageY = 80;
        this.messagePanel = new MessagePanel(this, width / 2, messageY);
        this.mainContainer.add(this.messagePanel);

        // --- 3. Zoom Slider ---
        // Top Right (操作しやすい位置)
        this.createZoomSlider(width);

        // --- 4. Control Panel ---
        // 画面下部
        const panelHeight = 60;
        const panelY = height - panelHeight / 2;
        this.controlPanel = new ControlPanel(this, width / 2, panelY, width);
        this.mainContainer.add(this.controlPanel);

        // --- 5. Scroll Bars ---
        // 右端と下端 (ControlPanelの上)
        this.createScrollBars(width, height);
    }

    createZoomSlider(width) {
        // 右上に配置
        const sliderX = width - 120;
        const sliderY = 80;
        const sliderWidth = 150;

        // ラベル
        this.add.text(sliderX - sliderWidth / 2 - 40, sliderY, 'Zoom', { fontSize: '16px', fill: '#ffffff' }).setOrigin(0.5);

        // RexUI Slider (現在のズームレベルを反映するには GameScene からの値が必要だが、初期値は適当に設定)
        this.currentZoom = 1.0;

        this.zoomSlider = this.rexUI.add.slider({
            x: sliderX,
            y: sliderY,
            width: sliderWidth,
            height: 20,
            orientation: 'horizontal',
            track: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x444444),
            thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x888888),
            value: 0.33, // (1.0 - 0.5) / 1.5 = 0.33 approx
            input: 'drag',
        })
            .layout()
            .on('valuechange', (newValue) => {
                // UI操作 -> ゲームへの反映
                // フラグをチェックして、ゲーム側からの更新中にイベントループしないようにする
                if (!this.isUpdatingFromGame) {
                    const zoom = 0.5 + newValue * 1.5; // Range: 0.5 ~ 2.0
                    this.setZoom(zoom);
                }
            });
    }

    createScrollBars(width, height) {
        // --- Vertical ScrollBar (Right Edge) ---
        const vX = width - 10;
        const vY = height / 2;
        const vHeight = height - 120;

        this.scrollBarV = this.rexUI.add.scrollBar({
            x: vX,
            y: vY,
            width: 20,
            height: vHeight,
            orientation: 'vertical',
            background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 0, 0x222222),
            track: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x444444),
            thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x888888),
            value: 0,
        })
            .layout()
            .on('valuechange', (newValue) => {
                if (!this.isUpdatingFromGame) {
                    this.game.events.emit('scrollRequest', { axis: 'vertical', value: newValue });
                }
            });

        this.scrollBarV.setVisible(false);

        // --- Horizontal ScrollBar (Bottom, above ControlPanel) ---
        const hX = width / 2;
        const hY = height - 70;
        const hWidth = width - 40;

        this.scrollBarH = this.rexUI.add.scrollBar({
            x: hX,
            y: hY,
            width: hWidth,
            height: 20,
            orientation: 'horizontal',
            background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 0, 0x222222),
            track: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x444444),
            thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x888888),
            value: 0,
        })
            .layout()
            .on('valuechange', (newValue) => {
                if (!this.isUpdatingFromGame) {
                    this.game.events.emit('scrollRequest', { axis: 'horizontal', value: newValue });
                }
            });

        this.scrollBarH.setVisible(false);
    }

    setupEventListeners() {
        // UI更新 (テキスト周り)
        this.game.events.on('updateUI', (data) => {
            this.infoPanel.updateData(data.flagsLeft, data.timer);
            this.controlPanel.updateScore(data.score, data.totalScore);
        });

        // スクロール位置の同期 (GameScene -> UI)
        this.game.events.on('updateScroll', (data) => {
            this.updateScrollBars(data);
        });

        // メッセージ表示
        this.game.events.on('showMessage', (config) => {
            this.messagePanel.showMessage(config.text, config.color, config.duration);
        });
    }

    // ズーム変更要求
    setZoom(zoomValue) {
        this.game.events.emit('zoomUpdate', zoomValue);
    }

    // スクロールバーの更新
    updateScrollBars(data) {
        if (!this.scrollBarV || !this.scrollBarH) return;

        // ゲーム側からの更新中であることをフラグで示す
        this.isUpdatingFromGame = true;

        try {
            // Vertical
            if (data.v.visible) {
                this.scrollBarV.setVisible(true);
                this.scrollBarV.setValue(data.v.ratio);
                // setValueは 'valuechange' イベントを発火するため、リスナー内で !isUpdatingFromGame チェックが必須
            } else {
                this.scrollBarV.setVisible(false);
            }

            // Horizontal
            if (data.h.visible) {
                this.scrollBarH.setVisible(true);
                this.scrollBarH.setValue(data.h.ratio);
            } else {
                this.scrollBarH.setVisible(false);
            }

        } finally {
            // 必ずフラグを戻す
            this.isUpdatingFromGame = false;
        }
    }
}