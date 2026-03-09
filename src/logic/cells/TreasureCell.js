class TreasureCell extends NumberCell {
    constructor(content) {
        super();
        this.isTreasure = true;
        this.treasureContent = content; // 'gold', 'key', 'sword'
    }

    interact(board, row, col) {
        // Treasure specific interaction applies first
        if (this.state === 1) {
            this.state = 2; // marked as collected

            const result = { events: ['CELL_UPDATED'], scoreEvents: [] };

            if (this.treasureContent === 'gold') {
                result.scoreEvents.push({ type: 'TREASURE_GOLD' });
            } else if (this.treasureContent === 'key') {
                result.events.push('ITEM_KEY');
            } else if (this.treasureContent === 'sword') {
                result.events.push('ITEM_SWORD');
            }

            return result;
        } else if (this.state === 2) {
            // Already collected, acts like a regular number cell
            return super.interact(board, row, col);
        }

        return super.interact(board, row, col);
    }
}
