/**
 * ScrollBarH.js
 * 
 * A wrapper class for RexUI Horizontal ScrollBar.
 * 
 * @class ScrollBarH
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
class ScrollBarH {
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
                orientation: 'horizontal',
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

    /**
     * Set thumb size and position with explicit pixel calculation
     * @param {number} positionRatio - 0.0 ~ 1.0 (Position relative to track)
     * @param {number} sizeRatio - 0.0 ~ 1.0 (Size relative to track)
     */
    updateThumb(positionRatio, sizeRatio) {
        // 1. Calculate Thumb Size (Width) in Pixels
        const barWidth = this.scrollBar.width;
        const thumbWidth = Math.max(20, barWidth * sizeRatio);

        // 2. Apply Size
        const thumb = this.scrollBar.getElement('slider.thumb');
        if (thumb && thumb.width !== thumbWidth) {
            thumb.width = thumbWidth;
            this.scrollBar.layout();
        }

        // 3. Calculate Thumb Position (X) in Pixels
        const trackWidth = barWidth;
        const scrollableRange = trackWidth - thumbWidth;
        const pixelX = scrollableRange * positionRatio;

        // Debug/Explain logic if needed
        // console.log(`[ScrollBarH] Width: ${thumbWidth.toFixed(1)}px, Pos: ${pixelX.toFixed(1)}px`);

        // 4. Update RexUI Value
        this.scrollBar.setValue(positionRatio);
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

    get width() {
        return this.scrollBar.width;
    }
}
