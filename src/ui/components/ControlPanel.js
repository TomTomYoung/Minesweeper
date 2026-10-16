class ControlPanel extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width) {
        super(scene, x, y);
        scene.add.existing(this);

        this.width = width;
        this.height = 60;

        this.createElements();
    }

    createElements() {
        // Background
        const bg = this.scene.add.rectangle(0, 0, this.width, this.height, 0xeee7d9)
            .setStrokeStyle(1, 0xdddddd);
        this.add(bg);

        // Buttons (Left side)
        // Adjust positions relative to center (0,0)
        // Original: createNewGameButton(80, panelY) <- 80 was absolute X.
        // Container X is Width/2. So 80 is Left+80.
        // Relative X = 80 - Width/2.
        const leftBase = -this.width / 2;

        this.createNewGameButton(leftBase + 80, 0);
        this.createMenuButton(leftBase + 210, 0);
        this.add(AssetPresentation.audioControls(this.scene, leftBase + 430, 0));


    }

    createNewGameButton(x, y) {
        const button = this.scene.add.container(x, y);

        const bg = this.scene.add.rectangle(0, 0, 120, 35, 0x4CAF50, 1)
            .setInteractive()
            .on('pointerdown', () => { this.scene.game.audio?.playSfx('ui_click'); this.scene.restartGame(); })
            .on('pointerover', () => bg.setFillStyle(0x45a049))
            .on('pointerout', () => bg.setFillStyle(0x4CAF50));

        const text = this.scene.add.text(0, 0, '新しいゲーム', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#fff'
        }).setOrigin(0.5);

        button.add([bg, text]);
        this.add(button);
    }

    createMenuButton(x, y) {
        const button = this.scene.add.container(x, y);

        const bg = this.scene.add.rectangle(0, 0, 120, 35, 0x2196F3, 1)
            .setInteractive()
            .on('pointerdown', () => { this.scene.game.audio?.playSfx('ui_click'); this.scene.returnToMenu(); })
            .on('pointerover', () => bg.setFillStyle(0x1976D2))
            .on('pointerout', () => bg.setFillStyle(0x2196F3));

        const text = this.scene.add.text(0, 0, 'メニューへ', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#fff'
        }).setOrigin(0.5);

        button.add([bg, text]);
        this.add(button);
    }

    updateScore(score, totalScore) {
        // Placeholder for score updates in ControlPanel if needed
        // But InfoPanel handles it mostly.
        // If ControlPanel has no score display, this method is unused or needs implementation.
        // Based on previous code, it seems ControlPanel doesn't show score.
    }
}

