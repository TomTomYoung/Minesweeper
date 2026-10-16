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
        this.scene.add.text(this.x - 170, this.y, 'モード:', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#333'
        }).setOrigin(1, 0.5);

        // Buttons relative to Container x/y? 
        // Note: Logic in MenuScene was absolute. Here we are a container.
        // Let's assume (0,0) is the center of the selector area provided by X,Y.

        // Actually, let's keep it simple: Add buttons to coordinates relative to this container (0,0)

        // RPG Mode Button
        this.btnRPG = this.createModeButton(-100, 0, 'RPG シンプル', GameConfig.MODES.RPG);

        // Standard Mode Button
        this.btnStandard = this.createModeButton(180, 0, '通常モード', GameConfig.MODES.STANDARD);

        this.btnLayered = this.createModeButton(40, 0, 'RPG 多層', GameConfig.MODES.RPG_LAYERED);
        this.add([this.btnRPG, this.btnLayered, this.btnStandard]);

        this.updateUI();
    }

    createModeButton(x, y, text, mode) {
        const width = 120;
        const height = 30;

        // Create a dedicated container for the button
        const btnContainer = this.scene.add.container(x, y);
        btnContainer.mode = mode; // Store mode on the container

        // Background (Relative to button container 0,0)
        const bg = this.scene.add.rectangle(0, 0, width, height, 0x9E9E9E, 1)
            .setInteractive();

        // Text (Relative to button container 0,0)
        // Correctly center text
        const buttonText = this.scene.add.text(0, 0, text, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#fff'
        }).setOrigin(0.5);

        // Add to button container
        btnContainer.add([bg, buttonText]);
        btnContainer.bg = bg; // Store ref for coloring

        // Interaction
        bg.on('pointerdown', () => this.setMode(mode));

        return btnContainer;
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

        [this.btnRPG, this.btnLayered, this.btnStandard].forEach(btn => {
            if (btn.mode === this.currentMode) {
                btn.bg.setFillStyle(activeColor);
            } else {
                btn.bg.setFillStyle(inactiveColor);
            }
        });
    }
}

