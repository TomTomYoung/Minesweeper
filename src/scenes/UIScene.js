// UIScene.js - UI層を管理するシーン
// RexUI Pluginを使用してスクロールバーとズームスライダーを実装

class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });

        // ループ防止・ドラッグ状態フラグ
        this.isUpdatingFromGame = false;
        this.isDraggingV = false;
        this.isDraggingH = false;

        // UI参照
        this.mainContainer = null;
        this.infoPanel = null;
        this.messagePanel = null;
        this.controlPanel = null;

        this.zoomSlider = null;
        this.currentZoom = 1.0;

        this.scrollBarV = null;
        this.scrollBarH = null;
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
        this.infoPanel = new InfoPanel(this, width / 2, 25, width);
        this.mainContainer.add(this.infoPanel);

        // --- 2. Message Panel ---
        const messageY = 80;
        this.messagePanel = new MessagePanel(this, width / 2, messageY);
        this.mainContainer.add(this.messagePanel);

        // --- 3. Zoom Slider ---
        this.createZoomSlider(width);

        // --- 4. Control Panel ---
        const panelHeight = 60;
        const panelY = height - panelHeight / 2;
        this.controlPanel = new ControlPanel(this, width / 2, panelY, width);
        this.mainContainer.add(this.controlPanel);

        // --- 5. Scroll Bars ---
        this.createScrollBars(width, height);
    }

    createZoomSlider(width) {
        const sliderX = width - 120;
        const sliderY = 80;
        const sliderWidth = 150;

        this.add
            .text(sliderX - sliderWidth / 2 - 40, sliderY, 'Zoom', {
                fontSize: '16px',
                fill: '#ffffff',
            })
            .setOrigin(0.5);

        this.currentZoom = 1.0;

        this.zoomSlider = this.rexUI.add
            .slider({
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

        const vBarBg = this.rexUI.add.roundRectangle(0, 0, 0, 0, 0, 0x222222);
        const vSliderTrack = this.rexUI.add.roundRectangle(0, 0, 0, 0, 0, 0x222222);
        const vSliderThumb = this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x888888);

        this.scrollBarV = this.rexUI.add
            .scrollBar({
                x: vX,
                y: vY,
                width: 20,
                height: vHeight,
                orientation: 'vertical',
                background: vBarBg,
                slider: {
                    track: vSliderTrack,
                    thumb: vSliderThumb,
                    input: 'drag',
                },
                value: 0,
            })
            .layout();

        // --- Horizontal ScrollBar (Bottom, above ControlPanel) ---
        const hX = width / 2;
        const hY = height - 70;
        const hWidth = width - 40;

        const hBarBg = this.rexUI.add.roundRectangle(0, 0, 0, 0, 0, 0x222222);
        const hSliderTrack = this.rexUI.add.roundRectangle(0, 0, 0, 0, 0, 0x222222);
        const hSliderThumb = this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x888888);

        this.scrollBarH = this.rexUI.add
            .scrollBar({
                x: hX,
                y: hY,
                width: hWidth,
                height: 20,
                orientation: 'horizontal',
                background: hBarBg,
                slider: {
                    track: hSliderTrack,
                    thumb: hSliderThumb,
                    input: 'drag',
                },
                value: 0,
            })
            .layout();

        // ドラッグ中フラグ（RexUI ScrollBar 自体のイベントで管理）
        this.scrollBarV.on('inputstart', () => {
            this.isDraggingV = true;
        });
        this.scrollBarV.on('inputend', () => {
            this.isDraggingV = false;
        });

        this.scrollBarH.on('inputstart', () => {
            this.isDraggingH = true;
        });
        this.scrollBarH.on('inputend', () => {
            this.isDraggingH = false;
        });

        // 値変更 -> GameScene へ通知
        this.scrollBarV.on('valuechange', (newValue) => {
            if (!this.isUpdatingFromGame) {
                this.game.events.emit('scrollRequest', { axis: 'vertical', value: newValue });
            }
        });

        this.scrollBarH.on('valuechange', (newValue) => {
            if (!this.isUpdatingFromGame) {
                this.game.events.emit('scrollRequest', { axis: 'horizontal', value: newValue });
            }
        });

        // 初期は非表示
        this.scrollBarV.setVisible(false);
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
            this.messagePanel.showMessage(config);
        });
    }

    // ズーム変更要求
    setZoom(zoomValue) {
        this.game.events.emit('zoomUpdate', zoomValue);
    }

    // スクロールバーの更新
    updateScrollBars(data) {
        if (!this.scrollBarV || !this.scrollBarH) return;

        this.isUpdatingFromGame = true;

        try {
            // Vertical
            if (data.v.visible) {
                this.scrollBarV.setVisible(true);
                if (!this.isDraggingV) {
                    this.scrollBarV.setValue(data.v.ratio);
                }
            } else {
                this.scrollBarV.setVisible(false);
            }

            // Horizontal
            if (data.h.visible) {
                this.scrollBarH.setVisible(true);
                if (!this.isDraggingH) {
                    this.scrollBarH.setValue(data.h.ratio);
                }
            } else {
                this.scrollBarH.setVisible(false);
            }
        } finally {
            this.isUpdatingFromGame = false;
        }
    }
}
