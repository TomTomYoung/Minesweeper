class MineLogicCell extends BaseLogicCell {
    constructor() {
        super();
        this.isMine = true;
    }

    reveal(board, row, col) {
        const result = super.reveal(board, row, col);
        result.events.push('GAME_OVER');
        return result;
    }
}
