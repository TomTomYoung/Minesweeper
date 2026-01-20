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
        // Situated at top. Height approx 50.
        // Position: Center X, 25 Y.
        this.infoPanel = new InfoPanel(this, width / 2, 25, width);
        this.mainContainer.add(this.infoPanel);

        // --- 2. Control Panel ---
        // Situated at bottom. Height 60.
        // Position: Center X, Bottom - 30.
        const panelHeight = 60;
        const panelY = height - panelHeight / 2;
        this.controlPanel = new ControlPanel(this, width / 2, panelY, width);
        // Sync initial zoom state if exists, otherwise ControlPanel defaults to 1.0
        if (this.currentZoom) {
            this.controlPanel.updateZoom(this.currentZoom);
        }
        this.mainContainer.add(this.controlPanel);

        // --- 3. Message Panel ---
        // Above Control Panel.
        const messageY = height - 80;
        this.messagePanel = new MessagePanel(this, width / 2, messageY);
        this.mainContainer.add(this.messagePanel);

        // --- 4. Scroll Bars ---
        this.scrollBars = {};
        const barSize = 16;

        // V Bar
        // Right edge. Top 50 to Bottom 60.
        const topY = 50;
        const bottomY = height - 60;
        const vHeight = bottomY - topY;
        const vX = width - barSize / 2;
        const vY = topY + vHeight / 2; // Center of the V-track area

        this.scrollBars.v = new ScrollBar(this, vX, vY, barSize, vHeight, 'vertical');
        this.mainContainer.add(this.scrollBars.v);

        // H Bar
        // Bottom edge (above control panel). Left 0 to Right Width.
        const hY = height - 60 - barSize / 2;
        const hWidth = width;
        const hX = width / 2; // Center of H-track

        this.scrollBars.h = new ScrollBar(this, hX, hY, hWidth, barSize, 'horizontal');
        this.mainContainer.add(this.scrollBars.h);

        // Hide initially
        this.scrollBars.v.setVisible(false);
        this.scrollBars.h.setVisible(false);
    }

    updateScrollBars(data) {
        if (!this.scrollBars) return;
        this.scrollBars.v.updateState(data.v);
        this.scrollBars.h.updateState(data.h);
    }

    setupEventListeners() {
        this.game.events.on('updateUI', (data) => this.infoPanel.updateUI(data), this);
        this.game.events.on('showMessage', (data) => this.messagePanel.showMessage(data), this);
        this.game.events.on('updateScroll', this.updateScrollBars, this);

        // Zoom event from GameScene (external update)
        this.game.events.on('zoomUpdate', (value) => {
            this.currentZoom = value;
            if (this.controlPanel) {
                // Prevent cyclic loop if event came from ControlPanel?
                // ControlPanel calls this.setZoom -> emits zoomUpdate? No.
                // ControlPanel calls setZoom -> scene.setZoom -> game.events.emit('zoomUpdate').
                // So yes, loop possible if ControlPanel.updateZoom re-calls setZoom.
                // ControlPanel.updateZoom just updates visual. SAFE.
                this.controlPanel.updateZoom(value);
            }
        }, this);
    }

    // --- Actions Delegated from Components ---

    restartGame() {
        this.scene.get('GameScene').restartGame();
    }

    returnToMenu() {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
    }

    setZoom(value) {
        // Emit to GameScene
        this.game.events.emit('zoomUpdate', value);
        this.currentZoom = value;
    }
}