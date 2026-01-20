// UIScene.js - ゲームUIを管理するシーン（GameSceneの上に重ねて表示）
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // UIの初期化
        this.initializeUI();

        // リサイズイベントの登録
        this.scale.on('resize', this.handleResize, this);

        // イベントリスナーの設定
        this.setupEventListeners();
    }

    handleResize(gameSize, baseSize, displaySize, resolution) {
        // カメラのサイズ更新
        this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);

        // UIの再構築
        if (this.uiContainer) {
            this.uiContainer.removeAll(true); // Destroys children
        }
        // Components will be re-created in initializeUI
        // Note: New components add themselves to scene, not uiContainer automatically unless I add them.
        // My new classes use `scene.add.existing(this)`. They are added to Scene Display List.
        // So I should clear the SCENE display list or track them?
        // `uiContainer` was a container handling everything.
        // My new components extends Container.
        // I should probably add them to a parent `uiContainer` to manage destruction easily?
        // Or just destroy the instances references.

        // Let's create a main container again for easy cleanup.
        if (this.mainContainer) {
            this.mainContainer.destroy(); // Destroys children too
        }

        this.initializeUI();

        // Restore Zoom (Slider needs to know)
        if (this.currentZoom !== undefined) {
            this.controlPanel.updateZoom(this.currentZoom);
        }
    }

    initializeUI() {
        this.mainContainer = this.add.container(0, 0);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // --- 1. Top Panel (Info) ---
        this.infoPanel = new InfoPanel(this, width / 2, 25, width);
        this.mainContainer.add(this.infoPanel);

        // --- 2. Control Panel ---
        const panelHeight = 60;
        const panelY = height - panelHeight / 2;
        this.controlPanel = new ControlPanel(this, width / 2, panelY, width);
        this.mainContainer.add(this.controlPanel);

        // --- 2.5 RexUI Zoom Slider ---
        // Above Control Panel
        this.createZoomSlider(width, height);


        // --- 3. Message Panel ---
        const messageY = height - 80;
        this.messagePanel = new MessagePanel(this, width / 2, messageY);
        this.mainContainer.add(this.messagePanel);

        // --- 4. RexUI Scroll Bars ---
        this.createScrollBars(width, height);
    }

    createScrollBars(width, height) {
        // Vertical ScrollBar
        const vX = width - 10;
        const vY = height / 2;
        const vHeight = height - 120; // Margin for top/bottom panels

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
                this.game.events.emit('scrollRequest', { axis: 'vertical', value: newValue });
            });

        // This component is added to scene automatically by RexUI.
        // We track it to hide/show or destroy.
        this.scrollBarV.setVisible(false);

        // Horizontal ScrollBar
        const hX = width / 2;
        const hY = height - 70; // Above control panel
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
                this.game.events.emit('scrollRequest', { axis: 'horizontal', value: newValue });
            });

        this.scrollBarH.setVisible(false);
    }

    createZoomSlider(width, height) {
        const sliderX = width / 2;
        const sliderY = height - 90; // Above message panel
        const sliderWidth = 200;

        this.zoomSlider = this.rexUI.add.slider({
            x: sliderX,
            y: sliderY,
            width: sliderWidth,
            height: 20,
            orientation: 'horizontal',
            track: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x444444),
            thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x888888),
            value: this.currentZoom ? (this.currentZoom - 0.5) / 1.5 : 0.33, // Map 1.0 to slider
            input: 'drag',
        })
            .layout()
            .on('valuechange', (newValue) => {
                // Map 0-1 to 0.5-2.0
                const zoom = 0.5 + newValue * 1.5;
                this.setZoom(zoom);
            });

        // Add label
        this.add.text(sliderX - sliderWidth / 2 - 40, sliderY, 'Zoom', { fontSize: '16px' }).setOrigin(0.5);
    }

    updateScrollBars(data) {
        if (!this.scrollBarV || !this.scrollBarH) return;

        // data: { v: { visible, ratio, sizeRatio }, h: { visible, ratio, sizeRatio } }

        // Vertical
        this.scrollBarV.setVisible(data.v.visible);
        if (data.v.visible) {
            this.scrollBarV.setValue(data.v.ratio);
            // RexUI ScrollBar doesn't have explicit thumb size ratio setter easily accessible in config style?
            // Actually it calculates thumb size based on 'displayValue' logic if configured, but here we treat it as 0-1 slider.
            // For simple scrollbar, just value mapping is enough.
        }

        // Horizontal
        this.scrollBarH.setVisible(data.h.visible);
        if (data.h.visible) {
            this.scrollBarH.setValue(data.h.ratio);
        }
    }

    setupEventListeners() {
        this.game.events.on('updateUI', (data) => this.infoPanel.updateUI(data), this);
        this.game.events.on('showMessage', (data) => this.messagePanel.showMessage(data), this);
        this.game.events.on('updateScroll', this.updateScrollBars, this);

        this.game.events.on('zoomUpdate', (value) => {
            this.currentZoom = value;
            if (this.controlPanel) {
                this.controlPanel.updateZoom(value);
            }
        }, this);
    }

    restartGame() {
        this.scene.get('GameScene').restartGame();
    }

    returnToMenu() {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
    }

    setZoom(value) {
        this.game.events.emit('zoomUpdate', value);
        this.currentZoom = value;
    }
}