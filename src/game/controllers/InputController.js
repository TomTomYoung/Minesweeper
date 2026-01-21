class InputController {
    constructor(scene, eventBus, boardManager, session) {
        this.scene = scene;
        this.eventBus = eventBus;
        this.session = session;
        this.boardManager = boardManager;

        this.setupListeners();
    }

    setupListeners() {
        // Listen to Board events directly
        const board = this.boardManager.board;

        board.on('cellClicked', (cell) => {
            const result = this.handleCellClick(cell);
            if (result) {
                this.scene.syncBoardData();
                this.scene.handleResult(result);
            }
        });

        board.on('cellRightClicked', (cell) => {
            const result = this.handleCellRightClick(cell);
            if (result) {
                // Update UI for the specific cell (efficient update)
                const row = cell.boardRow;
                const col = cell.boardCol;
                this.boardManager.board.updateCellUI(row, col, this.session.boardModel.getCell(row, col));

                this.scene.updateUI();
                this.scene.handleResult(result);
            }
        });
    }

    handleCellClick(cell) {
        // Ignore if Ctrl key pressed (Camera Pan)
        if (this.scene.input.activePointer.event.ctrlKey) return null;

        const row = cell.boardRow;
        const col = cell.boardCol;

        const result = this.session.handleCellClick(row, col);
        return result;
    }

    handleCellRightClick(cell) {
        if (this.scene.input.activePointer.event.ctrlKey) return null;

        const row = cell.boardRow;
        const col = cell.boardCol;

        const result = this.session.handleCellRightClick(row, col);
        return result;
    }
}
