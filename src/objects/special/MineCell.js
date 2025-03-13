// MineCell.js - 地雷セル
class MineCell extends Cell {
    constructor(scene, x, y, size, row, col) {
        super(scene, x, y, size, row, col);
        this.setType('mine');
    }
    
    // 地雷セル特有の開示動作
    reveal() {
        if (this.revealed || this.flagged) return;
        
        super.reveal();
        
        // 爆発エフェクトを追加
        this.explode();
    }
    
    // 爆発エフェクト
    explode() {
        // 爆発エフェクトの作成（パーティクル）
        if (this.scene.particles) {
            const particles = this.scene.add.particles(this.x + this.size / 2, this.y + this.size / 2, 'mine', {
                speed: { min: 50, max: 100 },
                scale: { start: 0.2, end: 0 },
                lifespan: 500,
                blendMode: 'ADD',
                quantity: 10
            });
            
            // 少し経ったら消す
            this.scene.time.delayedCall(500, () => {
                particles.destroy();
            });
        }
    }
}