class StairsCell extends NumberCell {
    constructor() {
        super();
        this.isStairs = true;
    }

    interact(board, row, col) {
        if (this.state === 1) {
            return { events: ['STAIRS_INTERACTED'], scoreEvents: [] };
        } else if (this.state === 2) {
            // Usually won't be reached as NEXT_LEVEL triggers, but map allows
            // 2 for interacted stairs. Acts like a number cell if anything else.
            return super.interact(board, row, col);
        }

        return super.interact(board, row, col);
    }
}
