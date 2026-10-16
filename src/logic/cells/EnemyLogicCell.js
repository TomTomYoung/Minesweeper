class EnemyLogicCell extends BaseLogicCell {
    constructor() {
        super();
        this.isEnemy = true;
    }

    get viewType() {
        return 'enemy';
    }

    reveal(board, row, col, options = {}) {
        if (this.isFlagged || this.state === 2) return { events: [], scoreEvents: [] };
        super.reveal(board, row, col);
        // Automatic opening only exposes the enemy. A deliberate click defeats it.
        return options.automatic ? { events: [], scoreEvents: [] } : this.interact(board, row, col);
    }

    interact() {
        if (!this.isRevealed || this.isFlagged || this.state === 2) {
            return { events: [], scoreEvents: [] };
        }
        this.state = 2;
        return { events: ['ENEMY_DEFEATED'], scoreEvents: [] };
    }
}
