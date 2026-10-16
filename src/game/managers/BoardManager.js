class BoardManager {
    constructor(scene, eventBus) {
        this.scene = scene;
        this.eventBus = eventBus;
        this.boardContainer = null;
        this.board = null;
    }

    createGameBoard(rows, cols, cellSize) {
        // Create Container
        this.boardContainer = this.scene.add.container(0, 0);

        // Calculate Position
        const boardWidth = cols * cellSize;
        const boardHeight = rows * cellSize;
        const boardX = (this.scene.cameras.main.width - boardWidth) / 2;
        const boardY = 130;

        // Background
        const boardBg = this.scene.add.rectangle(
            boardX + boardWidth / 2,
            boardY + boardHeight / 2,
            boardWidth + 10,
            boardHeight + 10,
            0xb39e79
        ).setStrokeStyle(3, 0x6f6551);
        this.boardContainer.add(boardBg);

        // Create Board Object
        this.board = new Board(
            this.scene,
            boardX,
            boardY,
            rows,
            cols,
            cellSize
        );

        return this.board;
    }

    updateBoardUI(config, boardModel, progression = null) {
        if (!this.board) return;
        for (let i = 0; i < config.rows; i++) {
            for (let j = 0; j < config.cols; j++) {
                this.board.updateCellUI(i, j, boardModel.getViewState(i, j));
                const view = this.board.cells[i][j];
                if (view.setUnlocked && progression) view.setUnlocked(progression.canAdvance);
            }
        }
    }

    revealAll(boardModel) {
        boardModel.revealAll();
        // Since boardModel is modified, we just trigger UI update for all
        // Or Board object might need specific method if optimized, but updateBoardUI is fine.
        // Actually GameScene implementation called session.boardModel.revealAll() then updateBoardUI().
        // BoardManager should receive the model to act upon? 
        // Or just assume the caller (GameScene) updated the model?
        // Let's passed the model to updateBoardUI.
        // For revealAll, the logic is in model.
    }

    reconstructBoard(boardData) {
        if (this.board) {
            this.board.updateCellTypes(boardData);
            this.board.drawEnemyDangerZones(boardData);
        }
    }

    destroy() {
        if (this.board && this.board.scene) this.board.destroy();
        if (this.boardContainer && this.boardContainer.scene) this.boardContainer.destroy();
        this.board = null;
        this.boardContainer = null;
    }

    // Helper for ScrollController to get bounds
    getBoardDimensions(rows, cols, cellSize) {
        // Need to replicate calculation or store it.
        // let's store basics
        const boardWidth = cols * cellSize;
        const boardHeight = rows * cellSize;
        // BoardX/Y logic is: (ScreenW - BoardW)/2, 130
        // We need ScreenW... which is camera width.
        const width = this.scene.cameras.main.width;

        const boardX = (width - boardWidth) / 2;
        const boardY = 130;

        return { x: boardX, y: boardY, width: boardWidth, height: boardHeight };
    }
}

