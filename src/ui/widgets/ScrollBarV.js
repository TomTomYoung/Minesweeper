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

    /**
     * Set thumb size and position with explicit pixel calculation
     * @param {number} positionRatio - 0.0 ~ 1.0 (Position relative to track)
     * @param {number} sizeRatio - 0.0 ~ 1.0 (Size relative to track)
     */
    updateThumb(positionRatio, sizeRatio) {
        // 1. Calculate Thumb Size (Height) in Pixels
        const barHeight = this.scrollBar.height;
        const thumbHeight = Math.max(20, barHeight * sizeRatio);

        // 2. Apply Size
        const thumb = this.scrollBar.getElement('slider.thumb');
        if (thumb && thumb.height !== thumbHeight) {
            thumb.height = thumbHeight;
            this.scrollBar.layout(); // Refresh layout to apply size change
        }

        // 3. Calculate Thumb Position (Y) in Pixels (for visualization/debug)
        // Note: RexUI ScrollBar handles positioning via 'value' (0~1), 
        // but the pixel logic is: Y = (TrackHeight - ThumbHeight) * value
        const trackHeight = barHeight; // Assuming track fills bar
        const scrollableRange = trackHeight - thumbHeight;
        const pixelY = scrollableRange * positionRatio;

        // Debug/Explain logic if needed (or just use it to understand what's happening)
        // console.log(`[ScrollBarV] Height: ${thumbHeight.toFixed(1)}px, Pos: ${pixelY.toFixed(1)}px`);

        // 4. Update RexUI Value
        // We still use setValue to keep internal state consistent with drag behavior
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

    get height() {
        return this.scrollBar.height;
    }
}
