class BaseLogicCell {
    constructor() {
        this.isMine = false;
        this.isEnemy = false;
        this.isWall = false;
        this.isTreasure = false;
        this.isStairs = false;
        this.isRevealed = false;
        this.isFlagged = false;
        this.state = 0; // 0: hidden, 1: revealed, 2: interacted
        this.neighborMines = 0;
    }

    /**
     * Called when the user clicks to reveal this cell.
     * @param {BoardModel} board - Reference to the board model.
     * @param {number} row 
     * @param {number} col 
     * @returns {Object} { events: [], scoreEvents: [] }
     */
    reveal(board, row, col) {
        if (this.isRevealed || this.isFlagged) return { events: [], scoreEvents: [] };

        this.isRevealed = true;
        this.state = 1;

        return { events: [], scoreEvents: [] };
    }

    /**
     * Called when the user clicks an already revealed cell (state >= 1).
     * @param {BoardModel} board - Reference to the board model.
     * @param {number} row 
     * @param {number} col 
     * @returns {Object} { events: [], scoreEvents: [] }
     */
    interact(board, row, col) {
        return { events: [], scoreEvents: [] };
    }
}
