class MineLogicCell extends BaseLogicCell {
    constructor() {
        super();
        this.isMine = true;
    }

    get viewType() {
        return 'mine';
    }

    reveal(board, row, col) {
        if (this.isRevealed || this.isFlagged) return { events: [], scoreEvents: [] };
        const result = super.reveal(board, row, col);
        result.events.push('GAME_OVER');
        return result;
    }
}

