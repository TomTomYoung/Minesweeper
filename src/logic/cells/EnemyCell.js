class EnemyCell extends BaseCell {
    constructor() {
        super();
        this.isEnemy = true;
    }

    reveal(board, row, col) {
        const result = super.reveal(board, row, col);
        result.events.push('ENEMY_DEFEATED');
        return result;
    }
}
