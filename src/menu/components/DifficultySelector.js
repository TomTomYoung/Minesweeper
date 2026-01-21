class DifficultySelector extends Phaser.GameObjects.Container {
    constructor(scene, x, y, onSelect) {
        super(scene, x, y);
        scene.add.existing(this);

        this.onSelect = onSelect;
        this.createButtons();
    }

    createButtons() {
        const buttonWidth = 180;
        const buttonHeight = 50;
        const spacing = 30;

        // Position: Centered around (0,0). 
        // Total width = 3 buttons + 2 spaces.
        // Left button X = - (Width + Spacing)

        // Easy
        this.createDifficultyButton(
            -(buttonWidth + spacing),
            0,
            buttonWidth,
            buttonHeight,
            '初級 (9x9)',
            0x4CAF50,
            'easy'
        );

        // Medium
        this.createDifficultyButton(
            0,
            0,
            buttonWidth,
            buttonHeight,
            '中級 (16x16)',
            0x2196F3,
            'medium'
        );

        // Hard
        this.createDifficultyButton(
            buttonWidth + spacing,
            0,
            buttonWidth,
            buttonHeight,
            '上級 (16x30)',
            0xF44336,
            'hard'
        );
    }

    createDifficultyButton(x, y, w, h, text, color, key) {
        const btn = new MenuButton(this.scene, x, y, w, h, text, color, () => {
            if (this.onSelect) this.onSelect(key);
        });
        this.add(btn);
    }
}
