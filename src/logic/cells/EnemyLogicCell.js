class EnemyLogicCell extends BaseLogicCell {
    constructor() {
        super();
        this.isEnemy = true;
    }

    get viewType() {
        return 'enemy';
    }

    reveal(board, row, col) {
        const result = super.reveal(board, row, col);
        result.events.push('ENEMY_DEFEATED');
        return result;
    }
}
