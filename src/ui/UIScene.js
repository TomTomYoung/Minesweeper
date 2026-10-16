class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });

        // Modules
        this.eventBus = null;
        this.state = null;
        this.layout = UILayout; // Static object

        // Components
        this.infoPanel = null;
        this.messagePanel = null;
        this.controlPanel = null;

        // Widgets
        this.zoomSlider = null;
        this.scrollBarV = null;
        this.scrollBarH = null;

        // Controllers
        this.zoomController = null;
        this.scrollController = null;
    }

    create() {
        // 1. Initialize Core Modules
        this.eventBus = new UIEventBus(this);
        this.state = new UIState();

        // 2. Setup UI
        this.initializeUI();

        // 3. Setup Controllers (Logic & Binding)
        this.initializeControllers();

        // 4. Setup Global Listeners (UI -> EventBus -> Components)
        this.setupEventListeners();

        // 5. Initial Update Request
        this.eventBus.emitRequestUIUpdate();

        // 6. Register Shutdown Handler
        this.events.once('shutdown', this.shutdown, this);
    }

    initializeUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Container (Optional if direct add) - Original used mainContainer.
        // We can add directly to scene or keep container.
        // Original code: this.mainContainer = this.add.container(0, 0);
        // Components added to mainContainer.
        // For simplicity and adherence to original visual hierarchy, let's keep it simple or direct.
        // Components (InfoPanel etc) add themselves to scene using `scene.add.existing`.
        // So we just instantiate them.

        // --- Components ---
        const infoRect = this.layout.getInfoPanelRect(width, height);
        this.infoPanel = new InfoPanel(this, infoRect.x, infoRect.y, infoRect.width);

        const msgPos = this.layout.getMessagePanelPosition(width, height);
        this.messagePanel = new MessagePanel(this, msgPos.x, msgPos.y);

        const controlRect = this.layout.getControlPanelRect(width, height);
        this.controlPanel = new ControlPanel(this, controlRect.x, controlRect.y, controlRect.width);

        // --- Widgets ---
        this.zoomSlider = new ZoomSlider(this, this.layout.getZoomSliderConfig(width, height));

        this.scrollBarV = new ScrollBarV(this, this.layout.getScrollBarVConfig(width, height));
        this.scrollBarH = new ScrollBarH(this, this.layout.getScrollBarHConfig(width, height));

        // Initial Visibility
        this.scrollBarV.setVisible(false);
        this.scrollBarH.setVisible(false);
    }

    initializeControllers() {
        this.zoomController = new ZoomController(this.state, this.eventBus, this.zoomSlider);
        this.scrollController = new UIScrollController(this.state, this.eventBus, this.scrollBarV, this.scrollBarH);
    }

    setupEventListeners() {
        // UI Updates (Score, Timer, Flags)
        this.eventBus.onUpdateUI((data) => {
            this.infoPanel.updateData(data.flagsLeft, data.timer);
            // InfoPanel's updateUI is deprecated/alias in new design, using updateData. 
            // Original code used updateData for infoPanel and updateScore for controlPanel.
            // Check InfoPanel implementation: it has updateData and updateUI (alias).

            // Note: Data passed to updateUI event contains { flagsLeft, timer, score, totalScore }.
            // We should update all.
            this.infoPanel.updateUI(data); // This handles all fields based on the file content I saw.

            // ControlPanel - Original called updateScore.
            this.controlPanel.updateScore(data.score, data.totalScore);
        }, this);

        // Scroll Integration
        this.eventBus.onUpdateScroll((data) => {
            this.scrollController.updateScrollBars(data);
        }, this);

        // Message
        this.eventBus.onShowMessage((config) => {
            this.messagePanel.showMessage(config);
        }, this);
    }

    // --- Public Methods called by Components (Text Buttons) ---
    restartGame() {
        const gameScene = this.scene.get('GameScene');
        if (gameScene) gameScene.restartGame();
    }

    returnToMenu() {
        this.scene.start('MenuScene');
        if (this.scene.get('GameScene')) {
            this.scene.stop('GameScene');
        }
    }

    shutdown() {
        if (this.eventBus) {
            this.eventBus.destroy();
        }
    }
}

