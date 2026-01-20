class ControlPanel extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width) {
        super(scene, x, y);
        scene.add.existing(this);

        this.width = width;
        this.height = 60;

        // Zoom State
        this.currentZoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 2.0;

        this.createElements();
    }

    createElements() {
        // Background
        const bg = this.scene.add.rectangle(0, 0, this.width, this.height, 0xf0f0f0)
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

        // Zoom Controls (Right side)
        // Original: width - 200.
        // Relative X = (width - 200) - Width/2 = Width/2 - 200.
        const rightBase = this.width / 2;
        this.createZoomControls(rightBase - 200, 0);
    }

    createNewGameButton(x, y) {
        const button = this.scene.add.container(x, y);

        const bg = this.scene.add.rectangle(0, 0, 120, 35, 0x4CAF50, 1)
            .setInteractive()
            .on('pointerdown', () => this.scene.restartGame())
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
            .on('pointerdown', () => this.scene.returnToMenu())
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

    createZoomControls(x, y) {
        const wrapper = this.scene.add.container(x, y);

        // Label
        const label = this.scene.add.text(-100, 0, 'Zoom:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#333'
        }).setOrigin(1, 0.5);

        // [-] Button
        const minusBtn = this.scene.add.rectangle(-80, 0, 30, 30, 0xdddddd)
            .setStrokeStyle(1, 0x999999)
            .setInteractive()
            .on('pointerdown', () => this.updateZoomDelta(-0.25))
            .on('pointerover', () => minusBtn.setFillStyle(0xe0e0e0))
            .on('pointerout', () => minusBtn.setFillStyle(0xdddddd));

        const minusText = this.scene.add.text(-80, 0, '-', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#333',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // [+] Button
        const plusBtn = this.scene.add.rectangle(80, 0, 30, 30, 0xdddddd)
            .setStrokeStyle(1, 0x999999)
            .setInteractive()
            .on('pointerdown', () => this.updateZoomDelta(0.25))
            .on('pointerover', () => plusBtn.setFillStyle(0xe0e0e0))
            .on('pointerout', () => plusBtn.setFillStyle(0xdddddd));

        const plusText = this.scene.add.text(80, 0, '+', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#333',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Slider Bg
        const sliderBg = this.scene.add.rectangle(0, 0, 100, 4, 0xcccccc);

        // Slider Knob
        this.sliderKnob = this.scene.add.circle(0, 0, 8, 0x2196F3)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ draggable: true });

        // Knob Drag
        this.sliderKnob.on('drag', (pointer, dragX, dragY) => {
            // Local dragX is relative to wrapper?
            // Yes, wrapper is container.

            const minX = -50;
            const maxX = 50;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);

            this.sliderKnob.x = clampedX;

            const progress = (clampedX - minX) / 100;
            const newZoom = this.minZoom + (this.maxZoom - this.minZoom) * progress;

            this.setZoom(newZoom);
        });

        wrapper.add([label, minusBtn, minusText, plusBtn, plusText, sliderBg, this.sliderKnob]);
        this.add(wrapper);
    }

    updateZoomDelta(delta) {
        const newZoom = Phaser.Math.Clamp(this.currentZoom + delta, this.minZoom, this.maxZoom);
        this.updateZoom(newZoom);
    }

    updateZoom(value) { // Set absolute value
        this.currentZoom = value;
        this.setZoom(value);

        // Update Knob position
        const progress = (value - this.minZoom) / (this.maxZoom - this.minZoom);
        if (this.sliderKnob) {
            this.sliderKnob.x = -50 + (progress * 100);
        }
    }

    setZoom(value) {
        // Emit logic to UIScene/Game
        this.scene.setZoom(value); // Delegate back to scene method
    }
}
