// GameScene.js - Integrated Version
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        // Core Modules
        this.eventBus = null;
        this.boardManager = null;
        this.debugger = null;
        this.cameraController = null;

        // Controllers
        this.inputController = null;
        this.scrollController = null;
        this.gameFlowController = null;

        // Data
        this.gameSession = null;
        this.boardData = null; // Sync with Session

        // State for Guitest-style Camera Logic
        this.cameraZoom = 1.0;
        this.cameraPanX = 0;
        this.cameraPanY = 0;
    }

    create() {
        // 1. Initialize Core
        this.eventBus = new GameEventBus(this);
        this.debugger = new GameDebugger(this);

        // 2. Initialize Logic (Session)
        this.initGameSession();

        // 3. Initialize Visuals (Camera & Board)
        this.cameraController = new CameraController(this, this.cameras.main);
        this.boardManager = new BoardManager(this, this.eventBus);

        // 4. Create Board
        this.boardManager.createGameBoard(
            this.gameSession.config.rows,
            this.gameSession.config.cols,
            this.gameSession.config.cellSize
        );
        this.boardData = this.gameSession.boardData;

        // 5. Initialize Controllers
        // Pass BoardManager and Session to InputController so it can wire itself up
        this.inputController = new InputController(this, this.eventBus, this.boardManager, this.gameSession);

        this.scrollController = new GameScrollController(this, this.eventBus, this.boardManager, this.cameraController);
        this.scrollController.setSession(this.gameSession);

        this.gameFlowController = new GameFlowController(this, this.eventBus, this.gameSession);

        // 6. Setup Inputs & Events
        this.setupHelpers();
        this.updateUI(); // Initial Update

        // Message
        if (this.gameSession.level > 1) {
            this.eventBus.emitShowMessage({
                text: `レベル ${this.gameSession.level} スタート！`,
                color: '#0000ff',
                duration: 3000
            });
        }

        // Initial Scroll Send
        this.time.delayedCall(100, () => {
            // Force initial sync with defaults (Pan=0, Range=2000)
            this.scrollController.syncToState(0, 0, 2000);

            // Clear any lingering messages (e.g. Game Over from previous session)
            this.eventBus.emitShowMessage({ text: '', duration: 0 });
        });
    }

    update(time, delta) {
        if (this.gameSession.updateTimer(delta)) {
            this.updateUI();
        }
    }

    initGameSession() {
        const globalGameData = this.game.gameData;
        const config = globalGameData.gameConfig.getCurrentConfig();
        const level = globalGameData.level || 1;
        const adjustedConfig = globalGameData.gameConfig.adjustForLevel(level);

        if (!adjustedConfig.cellSize) adjustedConfig.cellSize = 40;

        this.gameSession = new GameSession(
            adjustedConfig,
            level,
            globalGameData.score,
            globalGameData.totalScore,
            globalGameData.mode
        );
        this.gameSession.start();
    }

    setupHelpers() {
        // Board Interaction
        // Board Interaction is now handled by InputController internally

        // Global Events
        // Global Events
        this.eventBus.onZoomUpdate((zoom) => {
            this.cameraZoom = zoom;
            this.updateCameraState();
        }, this);

        this.eventBus.onScrollRequest((data) => {
            // data: { axis: 'vertical', value: 0..1 }
            // Map 0..1 to Pan Range
            const range = 2000; // Large enough range as per guitest idea (or board based)

            if (data.axis === 'vertical') {
                // val=0.5 -> pan=0. val=0 -> pan=500? matches guitest: (0 - 0.5)*-1 = 0.5
                // Guitest: (ratio - 0.5) * range * -1
                // Ratio 0 (Top) -> +500 (Scroll Down/Content Down) -> PanY=+500
                // Ratio 1 (Bottom) -> -500 (Content Up) -> PanY=-500
                this.cameraPanY = (data.value - 0.5) * range * -1;
            } else if (data.axis === 'horizontal') {
                // Same logic for H
                this.cameraPanX = (data.value - 0.5) * range * -1;
            }

            this.updateCameraState();

            // Notify UI to update Thumb position (Sync)
            // Use specific method to avoiding reading back from Camera (which is derived)
            this.scrollController.syncToState(this.cameraPanX, this.cameraPanY, range);
        }, this);

        // We no longer rely on 'cameraMoved' to drive the scrollbar because it's derived.
        // Scrollbar drives Pan. Pan drives Camera.
        // But if Camera moves by other means (e.g. initial setup?), we might need sync?
        // For 'Guitest' spec, inputs are master.

        // this.eventBus.onCameraMoved(...) -> Removed or reduced to Debugger only

        // Sync Scrollbar with Camera Movement (Reverse Calculation)
        this.events.on('cameraMoved', () => {
            const pivot = { x: this.focusMarker.x, y: this.focusMarker.y };
            const zoom = this.cameras.main.zoom;
            const scrollX = this.cameras.main.scrollX;
            const scrollY = this.cameras.main.scrollY;

            // Formula: Pan = Pivot * (1 - 1/S) - Scroll
            this.cameraPanX = pivot.x * (1 - 1 / zoom) - scrollX;
            this.cameraPanY = pivot.y * (1 - 1 / zoom) - scrollY;

            // Sync with ScrollController
            // const range = 2000; // Same range as used in ScrollRequest
            // We should use a consistent range value or derive it. For now, hardcoded 2000.
            this.scrollController.syncToState(this.cameraPanX, this.cameraPanY, 2000); // 2000 is default range
        });

        this.eventBus.onBlockInput(() => this.cameraController.setLock(true));
        this.eventBus.onUnblockInput(() => this.cameraController.setLock(false));

        // Camera Input
        this.setupCameraInputZone();
        this.cameraController.setupZoomInput();

        // Setup Focus Marker
        this.createFocusMarker();
    }

    updateCameraState() {
        if (!this.focusMarker) return;

        const pivot = { x: this.focusMarker.x, y: this.focusMarker.y };
        const pan = { x: this.cameraPanX, y: this.cameraPanY };

        this.cameraController.updateCameraTransform(this.cameraZoom, pivot, pan);
    }

    createFocusMarker() {
        // Default Position (Center)
        const x = this.cameras.main.width / 2;
        const y = this.cameras.main.height / 2;

        this.focusMarker = this.add.container(x, y);
        this.focusMarker.setScrollFactor(0); // Screen Space
        this.focusMarker.setDepth(2000);     // Top Layer

        const gfx = this.add.graphics();
        gfx.lineStyle(2, 0xff0000, 1);
        gfx.moveTo(-10, 0); gfx.lineTo(10, 0);
        gfx.moveTo(0, -10); gfx.lineTo(0, 10);
        gfx.strokePath();

        const hit = this.add.rectangle(0, 0, 40, 40, 0xff0000, 0.01).setInteractive({ draggable: true });

        this.focusMarker.add([gfx, hit]);

        hit.on('drag', (pointer, dragX, dragY) => {
            this.focusMarker.x = pointer.x;
            this.focusMarker.y = pointer.y;
            // Immediate update
            this.updateCameraState();
        });
    }

    setupCameraInputZone() {
        // Background Zone for Panning
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.backgroundZone = this.add.zone(0, 0, width, height)
            .setOrigin(0)
            .setScrollFactor(0)
            .setInteractive()
            .setDepth(-9999);

        // DISABLE PANNING as per spec -> RE-ENABLED
        // Global pan input (handles middle-click drag anywhere)
        this.cameraController.setupPanInput();
    }

    syncBoardData() {
        if (this.boardData !== this.gameSession.boardData) {
            this.boardData = this.gameSession.boardData;
            this.boardManager.reconstructBoard(this.boardData);
        }
    }

    handleResult(result) {
        // Flow Controller logic
        const flowStatus = this.gameFlowController.processResult(result);
        if (flowStatus && flowStatus.isGameOver) {
            if (!flowStatus.isWin) {
                this.boardManager.revealAll(this.gameSession.boardModel);
                this.boardManager.updateBoardUI(this.gameSession.config, this.gameSession.boardModel);
            }
        }

        this.boardManager.updateBoardUI(this.gameSession.config, this.gameSession.boardModel);
        this.updateUI();
    }

    updateUI() {
        this.game.gameData.score = this.gameSession.score;
        this.game.gameData.totalScore = this.gameSession.totalScore;
        this.game.gameData.level = this.gameSession.level;

        this.eventBus.emitUpdateUI({
            flagsLeft: this.gameSession.flagsLeft,
            timer: this.gameSession.timer,
            score: this.gameSession.score,
            totalScore: this.gameSession.totalScore
        });
    }

    restartGame() {
        this.scene.restart();
    }

    shutdown() {
        if (this.boardManager) {
            this.boardManager.destroy(); // Ensure board manager cleans up
        }
        // Additional cleanup if needed
    }
}
