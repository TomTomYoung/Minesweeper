/**
 * ZoomSlider.js
 * 
 * A wrapper class for RexUI Slider to handle Zoom functionality.
 * 
 * @class ZoomSlider
 * 
 * @specs Input (Constructor)
 *  - scene: Phaser.Scene - The scene instance.
 *  - config: object
 *      - x, y: number - Position.
 *      - width, height: number - Size.
 * 
 * @specs Output (Events)
 *  - onValueChange(callback): Fired when slider value changes.
 *      - callback(newValue): newValue is number (0.0 to 1.0).
 * 
 * @dependencies
 *  - Phaser 3
 *  - RexUI Plugin (scene.rexUI.add.slider, roundRectangle)
 */
class ZoomSlider {
    constructor(scene, config) {
        this.scene = scene;
        this.slider = this.createSlider(config);
    }

    createSlider(config) {
        const { x, y, width, height } = config;

        // Label
        this.scene.add
            .text(x - width / 2 - 40, y, 'Zoom', {
                fontSize: '16px',
                fill: '#ffffff',
            })
            .setOrigin(0.5);

        // RexUI Slider
        return this.scene.rexUI.add
            .slider({
                x: x,
                y: y,
                width: width,
                height: height,
                orientation: 'horizontal',
                track: this.scene.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x444444),
                thumb: this.scene.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x888888),
                value: 0.33, // Default
                input: 'drag',
            })
            .layout();
    }

    // Callback for valuc change
    onValueChange(callback) {
        this.slider.on('valuechange', callback);
    }

    setValue(value) {
        this.slider.setValue(value);
    }
}
