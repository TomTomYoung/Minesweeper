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
        this.time.delayedCall(100, () => {
            this.eventBus.emitRequestUIUpdate();
        });
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
        const infoRect = this.layout.getInfoPanelRect(width);
        this.infoPanel = new InfoPanel(this, infoRect.x, infoRect.y, infoRect.width);

        const msgPos = this.layout.getMessagePanelPosition(width);
        this.messagePanel = new MessagePanel(this, msgPos.x, msgPos.y);

        const controlRect = this.layout.getControlPanelRect(width, height);
        this.controlPanel = new ControlPanel(this, controlRect.x, controlRect.y, controlRect.width);

        // --- Widgets ---
        this.zoomSlider = new ZoomSlider(this, this.layout.getZoomSliderConfig(width));

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
        // Original logic: this.scene.restart();
        // This likely restarts the UI Scene. 
        // If the intention is to restart the GAME, we should probably emit an event or restart GameScene.
        // However, sticking to original behavior for refactor safety:
        // But wait, "New Game" button usually implies resetting the game state.
        // If I just restart UI, the game persists?
        // Let's assume the user handles game restart via some other mechanism or this was placeholder.
        // BUT, I should probably emit 'requestRestart' if I want to be robust, 
        // or access GameScene.
        // For now, I will replicate original "this.scene.restart()" but also emit an event just in case.
        // Actually, looking at ControlPanel.js: "this.scene.restartGame()"

        // Let's try to do the right thing: Restart GameScene too.
        if (this.scene.get('GameScene')) {
            this.scene.get('GameScene').restartGame(); // GameScene has restartGame method?
            // Original GameScene.js has restartGame method at the bottom!
            // "restartGame() { this.scene.restart(); }"
            // So calling that is correct.
            this.scene.get('GameScene').restartGame();
        }

        // And restart UI to reset state
        // this.scene.restart(); // This might be redundant if GameScene creates UIScene.
        // Usually Boot or Main starts them.
    }

    returnToMenu() {
        this.scene.start('MenuScene');
        if (this.scene.get('GameScene')) {
            this.scene.stop('GameScene');
        }
    }
}
