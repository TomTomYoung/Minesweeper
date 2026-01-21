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
        this.inputController = new InputController(this, this.eventBus);

        this.scrollController = new ScrollController(this, this.eventBus, this.boardManager, this.cameraController);
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
            this.scrollController.updateScrollInfo();
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
            globalGameData.totalScore
        );
        this.gameSession.start();
    }

    setupHelpers() {
        // Board Interaction
        const board = this.boardManager.board;
        board.on('cellClicked', (cell) => {
            const result = this.inputController.handleCellClick(cell, this.gameSession);
            if (result) {
                this.syncBoardData();
                this.handleResult(result);
            }
        });

        board.on('cellRightClicked', (cell) => {
            const result = this.inputController.handleCellRightClick(cell, this.gameSession);
            if (result) {
                // Update specific cell UI
                // Or BoardManager can handle? BoardManager.updateCellUI(row, col, cellModel)
                // Need mapped model
                const row = cell.boardRow;
                const col = cell.boardCol;
                // We can use BoardManager updateBoardUI or single cell update
                // Since BoardManager wraps Board, let's look at BoardManager again.
                // It has updateBoardUI. We can add updateCellUI there or just access board.
                // For directness:
                this.boardManager.board.updateCellUI(row, col, this.gameSession.boardModel.getCell(row, col));

                this.updateUI();
                this.handleResult(result); // Check Win
            }
        });

        // Global Events
        this.eventBus.onZoomUpdate((zoom) => {
            this.cameraController.setZoom(zoom);
        }, this);

        this.eventBus.onScrollRequest((data) => {
            this.scrollController.handleScrollRequest(data);
        }, this);

        this.eventBus.onCameraMoved(() => {
            this.scrollController.updateScrollInfo();
            // Debugger draw
            const bounds = this.scrollController.getScrollBounds();
            this.debugger.draw(bounds, this.cameras.main);
        }, this);

        this.eventBus.onBlockInput(() => this.cameraController.setLock(true));
        this.eventBus.onUnblockInput(() => this.cameraController.setLock(false));

        // Camera Input
        this.setupCameraInputZone();
        this.cameraController.setupZoomInput();
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

        this.cameraController.setupPanInput(this.backgroundZone);
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
                this.boardManager.revealAllMines(this.gameSession.boardModel);
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
}