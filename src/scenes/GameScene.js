class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.cameraZoom = 1;
        this.cameraPanX = 0;
        this.cameraPanY = 0;
        this.focusPoint = { x: this.cameras.main.width / 2, y: this.cameras.main.height / 2 };
        this.eventBus = new GameEventBus(this);
        this.events.once('shutdown', this.shutdown, this);
        this.debugger = new GameDebugger(this);
        this.initGameSession();
        this.cameraController = new CameraController(this, this.cameras.main);
        this.boardManager = new BoardManager(this, this.eventBus);
        const config = this.gameSession.config;
        this.boardManager.createGameBoard(config.rows, config.cols, config.cellSize);
        this.boardData = this.gameSession.boardData;
        this.inputController = new InputController(this, this.eventBus, this.boardManager, this.gameSession);
        this.scrollController = new GameScrollController(this, this.eventBus, this.boardManager, this.cameraController);
        this.scrollController.setSession(this.gameSession);
        this.gameFlowController = new GameFlowController(this, this.eventBus, this.gameSession);
        this.setupHelpers();
        this.updateUI();
        this.time.delayedCall(0, () => {
            this.eventBus.emitShowMessage({
                text: this.gameSession.mode === 'RPG_SIMPLE' ? `${this.gameSession.level}階 スタート！` : '',
                color: '#0000aa', duration: 1500
            });
        });
    }

    update(time, delta) {
        if (this.gameSession.updateTimer(delta)) this.updateUI();
    }

    initGameSession() {
        const data = this.game.gameData;
        const level = data.level || 1;
        const config = data.gameConfig.adjustForLevel(level);
        this.gameSession = new GameSession(config, level, data.score, data.totalScore, data.mode);
        this.gameSession.start();
    }

    setupHelpers() {
        this.createFocusMarker();
        this.eventBus.onZoomUpdate(zoom => {
            this.cameraZoom = zoom;
            this.updateCameraState();
        });
        this.eventBus.onScrollRequest(data => {
            const pan = (data.value - 0.5) * -2000;
            if (data.axis === 'vertical') this.cameraPanY = pan;
            if (data.axis === 'horizontal') this.cameraPanX = pan;
            this.updateCameraState();
        });
        this.eventBus.onCameraMoved(() => {
            const camera = this.cameras.main;
            this.cameraZoom = camera.zoom;
            this.cameraPanX = (this.focusPoint.x - camera.width * camera.originX) * (1 - 1 / camera.zoom) - camera.scrollX;
            this.cameraPanY = (this.focusPoint.y - camera.height * camera.originY) * (1 - 1 / camera.zoom) - camera.scrollY;
            this.updateFocusMarker();
            this.syncCameraUI();
        });
        this.eventBus.onRequestUIUpdate(() => {
            this.updateUI();
            this.syncCameraUI();
        });
        this.eventBus.onBlockInput(() => this.cameraController.setLock(true));
        this.eventBus.onUnblockInput(() => this.cameraController.setLock(false));
        this.setupCameraInputZone();
        this.cameraController.setupZoomInput();
        this.updateCameraState();
    }

    syncCameraUI() {
        this.scrollController.syncToState(this.cameraPanX, this.cameraPanY, 2000);
        this.eventBus.emitZoomChanged(this.cameraZoom);
    }

    updateCameraState() {
        this.cameraController.updateCameraTransform(
            this.cameraZoom, this.focusPoint, { x: this.cameraPanX, y: this.cameraPanY }
        );
    }

    createFocusMarker() {
        this.focusMarker = this.add.container(this.focusPoint.x, this.focusPoint.y);
        this.focusMarker.setScrollFactor(0).setDepth(2000);
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xff0000, 1);
        graphics.moveTo(-10, 0); graphics.lineTo(10, 0);
        graphics.moveTo(0, -10); graphics.lineTo(0, 10);
        graphics.strokePath();
        const hit = this.add.rectangle(0, 0, 40, 40, 0xff0000, 0.01).setInteractive({ draggable: true });
        this.focusMarker.add([graphics, hit]);
        hit.on('drag', pointer => {
            // Moving the pivot must not move the board at the current zoom.
            const scale = 1 - 1 / this.cameraZoom;
            this.cameraPanX += (pointer.x - this.focusPoint.x) * scale;
            this.cameraPanY += (pointer.y - this.focusPoint.y) * scale;
            this.focusPoint = { x: pointer.x, y: pointer.y };
            this.updateCameraState();
        });
    }

    updateFocusMarker() {
        const camera = this.cameras.main;
        const originX = camera.width * camera.originX;
        const originY = camera.height * camera.originY;
        // scrollFactor(0) removes scroll, but not zoom: compensate both position and size.
        this.focusMarker.setPosition(
            originX + (this.focusPoint.x - originX) / camera.zoom,
            originY + (this.focusPoint.y - originY) / camera.zoom
        );
        this.focusMarker.setScale(1 / camera.zoom);
    }

    setupCameraInputZone() {
        this.backgroundZone = this.add.zone(0, 0, this.cameras.main.width, this.cameras.main.height)
            .setOrigin(0).setScrollFactor(0).setInteractive().setDepth(-9999);
        this.cameraController.setupPanInput();
    }

    syncBoardData() {
        if (this.boardData !== this.gameSession.boardData) {
            this.boardData = this.gameSession.boardData;
            this.boardManager.reconstructBoard(this.boardData);
        }
    }

    handleResult(result) {
        this.gameFlowController.processResult(result);
        this.boardManager.updateBoardUI(
            this.gameSession.config, this.gameSession.boardModel,
            this.gameSession.ruleSet.evaluateStairs(this.gameSession)
        );
        this.updateUI();
    }

    updateUI() {
        const session = this.gameSession;
        this.game.gameData.score = session.score;
        this.game.gameData.totalScore = session.totalScore;
        this.game.gameData.level = session.level;
        this.eventBus.emitUpdateUI({
            flagsLeft: session.flagsLeft, timer: session.timer,
            score: session.score, totalScore: session.totalScore,
            mode: session.mode, level: session.level,
            hasKey: session.hasKey, hasSword: session.hasSword,
            enemiesDefeated: session.enemiesDefeated, totalEnemies: session.totalEnemies
        });
    }

    restartGame() {
        const data = this.game.gameData;
        data.level = 1;
        data.score = 0;
        data.totalScore = 0;
        this.gameFlowController.destroy();
        this.inputController.destroy();
        this.scene.restart();
    }

    shutdown() {
        if (this.inputController) this.inputController.destroy();
        if (this.gameFlowController) this.gameFlowController.destroy();
        if (this.eventBus) this.eventBus.destroy();
        if (this.boardManager) this.boardManager.destroy();
    }
}
