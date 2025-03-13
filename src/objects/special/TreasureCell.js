// TreasureCell.js - お宝セル
class TreasureCell extends Cell {
    constructor(scene, x, y, size, row, col, points = 100) {
        super(scene, x, y, size, row, col);
        this.setType('treasure');
        this.points = points;
    }
    
    // ポイント値を設定
    setPoints(points) {
        this.points = points;
    }
    
    // お宝セル特有の開示動作
    reveal() {
        if (this.revealed || this.flagged) return;
        
        super.reveal();
        
        // 宝箱を開けるエフェクト
        this.showTreasureEffect();
    }
    
    // 宝箱を開けるエフェクト
    showTreasureEffect() {
        // キラキラエフェクト
        if (this.scene.particles) {
            const particles = this.scene.add.particles(this.x + this.size / 2, this.y + this.size / 2, 'treasure', {
                speed: { min: 30, max: 60 },
                scale: { start: 0.3, end: 0 },
                lifespan: 800,
                blendMode: 'ADD',
                tint: 0xffff00,
                quantity: 8
            });
            
            // 少し経ったら消す
            this.scene.time.delayedCall(800, () => {
                particles.destroy();
            });
        }
        
        // ポイント表示
        const pointText = this.scene.add.text(
            this.x + this.size / 2,
            this.y + this.size / 2 - 20,
            `+${this.points}`,
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                fontWeight: 'bold',
                color: '#ffd700'
            }
        ).setOrigin(0.5);
        
        // ポイントテキストをアニメーション
        this.scene.tweens.add({
            targets: pointText,
            y: pointText.y - 40,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                pointText.destroy();
            }
        });
    }
}