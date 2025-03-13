// StairsCell.js - 階段セル
class StairsCell extends Cell {
    constructor(scene, x, y, size, row, col) {
        super(scene, x, y, size, row, col);
        this.setType('stairs');
        
        // 階段がアクティブかどうか（レベルが完全にクリアされるまではアクティブではない）
        this.active = false;
    }
    
    // 階段をアクティブにする
    activate() {
        this.active = true;
        
        // アクティブ状態の視覚効果
        this.showActiveEffect();
    }
    
    // 階段セル特有の開示動作
    reveal() {
        if (this.revealed || this.flagged) return;
        
        super.reveal();
        
        // 階段発見エフェクト
        this.showStairsEffect();
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
        if (this.revealed && this.active) {
            // カスタムイベントを発火
            this.emit('nextLevel');
            return true;
        }
        return false;
    }
}