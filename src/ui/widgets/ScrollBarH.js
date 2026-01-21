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

    setThumbSize(ratio) {
        const barWidth = this.scrollBar.width;
        const thumbSize = Math.max(20, barWidth * ratio);

        const thumb = this.scrollBar.getElement('slider.thumb');
        if (thumb && thumb.width !== thumbSize) {
            thumb.width = thumbSize;
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

    get width() {
        return this.scrollBar.width;
    }
}
