class InputController {
    constructor(scene, eventBus) {
        this.scene = scene;
        this.eventBus = eventBus;
    }

    handleCellClick(cell, session) {
        // Ignore if Ctrl key pressed (Camera Pan)
        if (this.scene.input.activePointer.event.ctrlKey) return null;

        const row = cell.boardRow;
        const col = cell.boardCol;

        const result = session.handleCellClick(row, col);
        return result;
    }

    handleCellRightClick(cell, session) {
        if (this.scene.input.activePointer.event.ctrlKey) return null;

        const row = cell.boardRow;
        const col = cell.boardCol;

        const result = session.handleCellRightClick(row, col);
        return result;
    }
}
