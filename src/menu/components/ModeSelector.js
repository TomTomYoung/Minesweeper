class ModeSelector extends Phaser.GameObjects.Container {
    constructor(scene, x, y, initialMode, onModeChange) {
        super(scene, x, y);
        scene.add.existing(this);

        this.onModeChange = onModeChange;
        this.currentMode = initialMode;

        this.createVisuals();
    }

    createVisuals() {
        // Label
        this.scene.add.text(this.x - 100, this.y, 'モード:', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#333'
        }).setOrigin(1, 0.5);

        // Buttons relative to Container x/y? 
        // Note: Logic in MenuScene was absolute. Here we are a container.
        // Let's assume (0,0) is the center of the selector area provided by X,Y.

        // Actually, let's keep it simple: Add buttons to coordinates relative to this container (0,0)

        // RPG Mode Button
        this.btnRPG = this.createModeButton(0, 0, 'RPGモード', GameConfig.MODES.RPG);

        // Standard Mode Button
        this.btnStandard = this.createModeButton(140, 0, '通常モード', GameConfig.MODES.STANDARD);

        this.add([this.btnRPG, this.btnStandard]);

        this.updateUI();
    }

    createModeButton(x, y, text, mode) {
        const width = 120;
        const height = 30;

        // Background
        const bg = this.scene.add.rectangle(x, y, width, height, 0x9E9E9E, 1)
            .setInteractive();

        // Text
        const buttonText = this.scene.add.text(x, y, text, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#fff'
        }).setOrigin(0.5);

        // Interaction
        bg.on('pointerdown', () => this.setMode(mode));

        // Store ref on bg for color updates (hacky but acts as container for state)
        // Since we are adding bg to `this` (container), we can just store references to bg objects in class.
        return { bg, text, mode };
    }

    setMode(mode) {
        this.currentMode = mode;
        this.updateUI();
        if (this.onModeChange) {
            this.onModeChange(mode);
        }
    }

    updateUI() {
        const activeColor = 0xFF9800;
        const inactiveColor = 0x9E9E9E;

        [this.btnRPG, this.btnStandard].forEach(btn => {
            if (btn.mode === this.currentMode) {
                btn.bg.setFillStyle(activeColor);
            } else {
                btn.bg.setFillStyle(inactiveColor);
            }
        });
    }
}
