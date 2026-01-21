/**
 * ScrollBarV.js
 * 
 * A wrapper class for RexUI Vertical ScrollBar.
 * 
 * @class ScrollBarV
 * 
 * @specs Input (Constructor)
 *  - scene: Phaser.Scene - The scene instance.
 *  - config: object
 *      - x, y: number - Position.
 *      - width, height: number - Size.
 * 
 * @specs Output (Methods)
 *  - setVisible(bool)
 *  - setValue(0.0 ~ 1.0)
 *  - setThumbSize(ratio: 0.0 ~ 1.0)
 * 
 * @specs Events
 *  - onValueChange(cb)
 *  - onInputStart(cb)
 *  - onInputEnd(cb)
 * 
 * @dependencies
 *  - Phaser 3
 *  - RexUI Plugin
 */
class ScrollBarV {
    constructor(scene, config) {
        this.scene = scene;
        this.scrollBar = this.createScrollBar(config);
    }

    createScrollBar(config) {
        const { x, y, width, height } = config;

        const bg = this.scene.rexUI.add.roundRectangle(0, 0, 0, 0, 0, 0x222222);
        const tracker = this.scene.rexUI.add.roundRectangle(0, 0, 0, 0, 0, 0x222222);
        const thumb = this.scene.rexUI.add.roundRectangle(0, 0, 20, 20, 0, 0x888888);

        return this.scene.rexUI.add
            .scrollBar({
                x: x,
                y: y,
                width: width,
                height: height,
                orientation: 'vertical',
                background: bg,
                slider: {
                    track: tracker,
                    thumb: thumb,
                    input: 'drag',
                },
                value: 0,
            })
            .layout();
    }

    setVisible(visible) {
        this.scrollBar.setVisible(visible);
    }

    setValue(value) {
        this.scrollBar.setValue(value);
    }

    setThumbSize(ratio) {
        // Calculate thumb size based on bar height and ratio
        const barHeight = this.scrollBar.height;
        const thumbSize = Math.max(20, barHeight * ratio);

        const thumb = this.scrollBar.getElement('slider.thumb');
        if (thumb && thumb.height !== thumbSize) {
            thumb.height = thumbSize;
            this.scrollBar.layout();
        }
    }

    onInputStart(callback) {
        this.scrollBar.on('inputstart', callback);
    }

    onInputEnd(callback) {
        this.scrollBar.on('inputend', callback);
    }

    onValueChange(callback) {
        this.scrollBar.on('valuechange', callback);
    }

    get height() {
        return this.scrollBar.height;
    }
}
