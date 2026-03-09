// EnemyCell.js - エネミー（敵）セル
class EnemyCell extends Cell {
    constructor(scene, x, y, size, row, col) {
        super(scene, x, y, size, row, col);
        this.setType('enemy');
    }

    reveal(value = null) {
        if (this.revealed || this.flagged) return;

        super.reveal(value);

        // 爆発などはせず、敵としての特別なアニメーションなどが必要な場合はここに追加
    }

    renderReveal(value) {
        this.background.setFillStyle(GAME_CONFIG.CELL_COLORS.MINE);
        if (this.icon.setTexture) this.icon.setTexture(this.scene.textures.exists('enemy') ? 'enemy' : 'mine');
        this.icon.setVisible(true);
    }
}
