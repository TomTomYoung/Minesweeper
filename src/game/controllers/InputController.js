class InputController {
    constructor(scene, eventBus, boardManager, session) {
        this.scene = scene;
        this.session = session;
        this.boardManager = boardManager;
        this.board = boardManager.board;
        this.pending = new Set();
        this.disposed = false;
        this.onClick = cell => this.defer(cell, false);
        this.onRightClick = cell => this.defer(cell, true);
        this.board.on('cellClicked', this.onClick);
        this.board.on('cellRightClicked', this.onRightClick);
    }

    defer(cell, rightClick) {
        const pointer = this.scene.input.activePointer;
        if (this.disposed || (pointer.event && pointer.event.ctrlKey)) return;
        // Capture coordinates before a first-click rebuild destroys the view cell.
        const row = cell.boardRow;
        const col = cell.boardCol;
        const timer = setTimeout(() => {
            this.pending.delete(timer);
            if (this.disposed) return;
            const before = this.session.boardModel.getCell(row, col);
            const feedback = { row, col, rightClick, wasRevealed:before.isRevealed,
                blocked:this.session.isGameOver || this.session.isTransitioning || before.isFlagged && !rightClick };
            const result = rightClick
                ? this.session.handleCellRightClick(row, col)
                : this.session.handleCellClick(row, col);
            this.scene.syncBoardData();
            this.scene.handleResult(result);
            if (this.scene.playCellFeedback) this.scene.playCellFeedback(result, feedback);
        }, 0);
        this.pending.add(timer);
    }

    destroy() {
        this.disposed = true;
        this.board.off('cellClicked', this.onClick);
        this.board.off('cellRightClicked', this.onRightClick);
        for (const timer of this.pending) clearTimeout(timer);
        this.pending.clear();
    }
}
