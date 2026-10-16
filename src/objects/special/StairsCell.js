// StairsCell.js - 階段セル
class StairsCell extends Cell {
    constructor(scene, x, y, size, row, col) {
        super(scene, x, y, size, row, col);
        this.setType('stairs');

        // 階段がアクティブかどうか（レベルが完全にクリアされるまではアクティブではない）
        this.unlocked = false;
    }

    // 階段をアクティブにする
    activate() {
        this.setUnlocked(true);
    }

    setUnlocked(unlocked) {
        if (this.unlocked === unlocked) return;
        this.unlocked = unlocked;
        this.setStatusBadge(unlocked ? 'ui_check' : 'ui_lock');
        if (unlocked && this.revealed) {
            this.showActiveEffect();
        } else if (this.pulseEffect) {
            this.pulseEffect.stop();
            this.pulseEffect = null;
            this.icon.setAlpha(1);
        }
    }

    // 階段セル特有の開示動作
    reveal() {
        if (this.revealed || this.flagged) return;

        super.reveal();

        // 階段発見エフェクト
        this.showStairsEffect();
        if (this.unlocked) this.showActiveEffect();
    }

    renderReveal(value) {
        this.background.setFillStyle(GAME_CONFIG.CELL_COLORS.STAIRS);
        if (this.icon.setTexture) this.setIconTexture('stairs');
        this.icon.setVisible(true);
        this.setStatusBadge(this.unlocked ? 'ui_check' : 'ui_lock');
    }

    // 階段発見エフェクト
    showStairsEffect() {
        // 階段を見つけたときのエフェクト
        this.scene.tweens.add({
            targets: this.icon,
            scale: this.icon.scale * 1.3,
            duration: 300,
            yoyo: true,
            repeat: 1
        });
    }

    // アクティブ状態のエフェクト
    showActiveEffect() {
        // 階段がアクティブになったときのエフェクト（点滅など）
        if (!this.pulseEffect) {
            this.pulseEffect = this.scene.tweens.add({
                targets: this.icon,
                alpha: 0.5,
                duration: 800,
                yoyo: true,
                repeat: -1
            });
        }
    }

    // クリック時の特別な処理（アクティブな場合のみ次のレベルへ）
    // このメソッドはゲームシーンから呼び出される
    onClick() {
        if (this.revealed && this.unlocked) {
            // カスタムイベントを発火
            this.emit('nextLevel');
            return true;
        }
        return false;
    }
}
