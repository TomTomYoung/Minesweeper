class ScrollBar extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, orientation) {
        super(scene, x, y);
        scene.add.existing(this);

        this.orientation = orientation; // 'vertical' or 'horizontal'
        this.size = (orientation === 'vertical') ? height : width;
        this.trackThickness = 16;
        this.thumbColor = 0x666666;
        this.trackColor = 0xaaaaaa;
        this.isDragging = false;

        // Hit Area configuration
        this.hitThickness = 40; // Widened hit area size

        this.createElements(width, height);
        this.setupInteractions();
    }

    createElements(w, h) {
        // Track
        this.track = this.scene.add.rectangle(0, 0, w, h, this.trackColor, 0.3)
            .setInteractive();

        // Thumb
        // Initial size, will be updated
        const thumbW = (this.orientation === 'vertical') ? this.trackThickness : 40;
        const thumbH = (this.orientation === 'vertical') ? 40 : this.trackThickness;

        this.thumb = this.scene.add.rectangle(0, 0, thumbW, thumbH, this.thumbColor, 0.8);

        if (this.orientation === 'vertical') {
            // Vertical: Origin Top-Center
            // Container is at center of track? No, let's say Container X,Y is Top-Left of the scroll area?
            // UIScene passed (width - 8, topY + vHeight/2). That's center of track.
            // If Container is at center of track:
            // Track is at (0,0).
            // Thumb should be positioned relative to Top of track.
            // Track Height = h. Top is -h/2.
            this.topOffset = -h / 2;
            this.thumb.setOrigin(0.5, 0);
            this.thumb.y = this.topOffset;
        } else {
            // Horizontal: Origin Left-Center
            // Track Width = w. Left is -w/2.
            this.leftOffset = -w / 2;
            this.thumb.setOrigin(0, 0.5);
            this.thumb.x = this.leftOffset;
        }

        this.thumb.setInteractive({ draggable: true });

        // --- APPLY HIT AREA FIX ---
        this.applyHitAreaFix();

        this.add([this.track, this.thumb]);
    }

    applyHitAreaFix() {
        const input = this.thumb.input;
        if (!input) return;

        if (this.orientation === 'vertical') {
            // Thumb is 16px wide. We want 40px hit area.
            // Origin is (0.5, 0).
            // Local coords: 0 is center X.
            // -20 to +20.
            input.hitArea = new Phaser.Geom.Rectangle(
                -this.hitThickness / 2, // x
                0,                      // y
                this.hitThickness,      // width
                this.thumb.height       // height (will be updated)
            );
        } else {
            // Thumb is 16px high. We want 40px hit area.
            // Origin is (0, 0.5).
            // Local coords: 0 is left X.
            // Y is center (0). -20 to +20.
            input.hitArea = new Phaser.Geom.Rectangle(
                0,                      // x
                -this.hitThickness / 2, // y
                this.thumb.width,       // width (will be updated)
                this.hitThickness       // height
            );
        }
        // Important: Update the hit area callback to use the new shape geometry
        // Phaser uses `hitArea` property if set.
    }

    setupInteractions() {
        const blockInput = () => this.scene.game.events.emit('blockInput');
        const unblockInput = () => this.scene.game.events.emit('unblockInput');

        // Track Click (Page Jump)
        this.track.on('pointerdown', (pointer) => {
            const localPoint = this.pointToContainer(pointer);

            if (this.orientation === 'vertical') {
                const localY = localPoint.y;
                // Range: this.topOffset to this.topOffset + this.size
                const start = this.topOffset;
                const ratio = (localY - start) / this.size;
                if (ratio >= 0 && ratio <= 1) {
                    this.scene.game.events.emit('scrollRequest', { axis: 'vertical', value: ratio });
                }
            } else {
                const localX = localPoint.x;
                const start = this.leftOffset;
                const ratio = (localX - start) / this.size;
                if (ratio >= 0 && ratio <= 1) {
                    this.scene.game.events.emit('scrollRequest', { axis: 'horizontal', value: ratio });
                }
            }
            blockInput();
        });

        this.track.on('pointerup', unblockInput);
        this.track.on('pointerupoutside', unblockInput);

        // Thumb Drag
        this.thumb.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            blockInput();
            this.thumb.setFillStyle(0x444444, 0.8);
        });

        this.thumb.on('pointerup', () => {
            unblockInput();
            this.thumb.setFillStyle(this.thumbColor, 0.8);
        });

        this.thumb.on('pointerupoutside', () => {
            unblockInput();
            this.thumb.setFillStyle(this.thumbColor, 0.8);
        });

        this.thumb.on('dragstart', () => {
            this.isDragging = true;
        });

        this.thumb.on('dragend', () => {
            this.isDragging = false;
        });

        this.thumb.on('drag', (pointer, dragX, dragY) => {
            if (this.orientation === 'vertical') {
                // dragY is local to container? No, Phaser default is local to the object's parent (this container)
                // BUT we need to clamp it.

                const thumbH = this.thumb.height;
                const minY = this.topOffset;
                const maxY = this.topOffset + this.size - thumbH;

                dragY = Phaser.Math.Clamp(dragY, minY, maxY);
                this.thumb.y = dragY;

                const available = maxY - minY;
                const ratio = (available > 0) ? (dragY - minY) / available : 0;

                this.scene.game.events.emit('scrollRequest', { axis: 'vertical', value: ratio });

            } else {
                const thumbW = this.thumb.width;
                const minX = this.leftOffset;
                const maxX = this.leftOffset + this.size - thumbW;

                dragX = Phaser.Math.Clamp(dragX, minX, maxX);
                this.thumb.x = dragX;

                const available = maxX - minX;
                const ratio = (available > 0) ? (dragX - minX) / available : 0;

                this.scene.game.events.emit('scrollRequest', { axis: 'horizontal', value: ratio });
            }
        });
    }

    updateState(data) {
        // data: { visible, ratio, sizeRatio }
        if (!data.visible) {
            this.setVisible(false);
            return;
        }
        this.setVisible(true);

        if (this.orientation === 'vertical') {
            // Update Thumb Size
            let thumbH = data.sizeRatio * this.size;
            thumbH = Phaser.Math.Clamp(thumbH, 20, this.size);

            if (this.thumb.height !== thumbH) {
                this.thumb.setSize(this.thumb.width, thumbH); // This resets hitArea usually? No, strictly setSize changes display size.
                // But we must update hitArea manually if we are using custom one.
                this.thumb.height = thumbH;

                // Re-apply Hit Area with new height
                if (this.thumb.input) {
                    this.thumb.input.hitArea.height = thumbH;
                }
            }

            // Update Position (only if not dragging)
            if (!this.isDragging) {
                const minY = this.topOffset;
                const maxY = this.topOffset + this.size - thumbH;
                this.thumb.y = minY + (maxY - minY) * data.ratio;
            }

        } else {
            // Horizontal
            let thumbW = data.sizeRatio * this.size;
            thumbW = Phaser.Math.Clamp(thumbW, 20, this.size);

            if (this.thumb.width !== thumbW) {
                this.thumb.setSize(thumbW, this.thumb.height);
                this.thumb.width = thumbW;

                // Re-apply Hit Area with new width
                if (this.thumb.input) {
                    this.thumb.input.hitArea.width = thumbW;
                }
            }

            if (!this.isDragging) {
                const minX = this.leftOffset;
                const maxX = this.leftOffset + this.size - thumbW;
                this.thumb.x = minX + (maxX - minX) * data.ratio;
            }
        }
    }
}
