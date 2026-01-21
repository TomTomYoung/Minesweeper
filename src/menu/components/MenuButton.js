/**
 * MenuButton.js
 * 
 * A generic, interactive button component for Phaser 3.
 * 
 * @class MenuButton
 * @extends Phaser.GameObjects.Container
 * 
 * @specs Input (Constructor)
 *  - scene: Phaser.Scene - The scene to add this button to.
 *  - x: number - X position.
 *  - y: number - Y position.
 *  - width: number - Width in pixels.
 *  - height: number - Height in pixels.
 *  - text: string - The label text to display.
 *  - color: number - Hex color for background (e.g. 0x4CAF50).
 *  - callback: function - Callback to execute on 'pointerdown'.
 * 
 * @specs Output (Events/State)
 *  - Visual: Updates fill style on pointerover/out.
 *  - Interaction: Triggers callback on click.
 * 
 * @dependencies
 *  - Phaser 3 (GameObjects.Container, Rectangle, Text)
 */
class MenuButton extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, text, color, callback) {
        super(scene, x, y);
        scene.add.existing(this);

        this.baseColor = color;
        this.width = width;
        this.height = height;

        this.createVisuals(text, callback);
    }

    createVisuals(text, callback) {
        // Background
        const bg = this.scene.add.rectangle(0, 0, this.width, this.height, this.baseColor, 1)
            .setInteractive();

        // Hover Effects
        bg.on('pointerdown', callback);
        bg.on('pointerover', () => bg.setFillStyle(this.lightenColor(this.baseColor, 20)));
        bg.on('pointerout', () => bg.setFillStyle(this.baseColor));

        // Text
        const buttonText = this.scene.add.text(0, 0, text, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#fff'
        }).setOrigin(0.5);

        this.add([bg, buttonText]);
        this.bg = bg;
    }

    // Helper: Lighten color
    lightenColor(color, percent) {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;

        const lightenValue = (value) => {
            return Math.min(255, value + Math.floor(value * (percent / 100)));
        };

        return (lightenValue(r) << 16) + (lightenValue(g) << 8) + lightenValue(b);
    }
}
