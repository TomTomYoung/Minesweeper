// WallCell.js - 壁セル
class WallCell extends Cell {
    constructor(scene, x, y, size, row, col) {
        super(scene, x, y, size, row, col);
        this.setType('wall');

        // 壁クラスター情報
        this.clusterId = null;
    }

    // 壁クラスターIDを設定
    setClusterId(id) {
        this.clusterId = id;
    }

    // 壁セル特有の開示動作
    reveal() {
        if (this.revealed) return;

        super.reveal();

        // 壁の開示エフェクト
        this.showWallEffect();
    }

    renderReveal(value) {
        this.background.setFillStyle(GAME_CONFIG.CELL_COLORS.WALL);
        if (this.icon.setTexture) this.icon.setTexture('wall');
        this.icon.setVisible(true);
    }

    // 壁開示エフェクト
    showWallEffect() {
        // 壁が開示されたときのエフェクト
        this.scene.tweens.add({
            targets: this.background,
            alpha: 0.6,
            duration: 200,
            yoyo: true,
            repeat: 0
        });
    }

}
