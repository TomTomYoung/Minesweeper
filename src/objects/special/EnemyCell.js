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

    renderStateUpdate(state) {
        if (state.state === 2) {
            this.setIconTexture('enemy_defeated');
            this.icon.setAlpha(0.8);
            this.setStatusBadge('ui_check');
            this.background.setFillStyle(0xbad5ba);
        }
    }

    renderReveal(value) {
        this.background.setFillStyle(0xc5dbd0);
        if (this.icon.setTexture) this.setIconTexture(this.scene.textures.exists('enemy') ? 'enemy' : 'mine');
        this.icon.setVisible(true);
    }
}

