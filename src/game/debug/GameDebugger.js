class GameDebugger {
    constructor(scene) {
        this.scene = scene;
        this.debugMode = true; // Default
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(9999);

        this.setupInput();
    }

    setupInput() {
        this.scene.input.keyboard.on('keydown-D', () => {
            this.toggleDebug();
        });
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        this.graphics.clear();
        console.log('Debug Mode:', this.debugMode);
        // Request update
        this.scene.events.emit('cameraMoved'); // Trigger scroll info update which draws debug
    }

    draw(bounds, camera) {
        if (!this.debugMode) return;

        this.graphics.clear();

        // Content Bounds (Red)
        this.graphics.lineStyle(2, 0xff0000);
        this.graphics.strokeRect(bounds.left, bounds.top, bounds.width, bounds.height);

        // Camera Viewport (Green)
        const viewX = camera.scrollX;
        const viewY = camera.scrollY;
        const viewW = camera.width / camera.zoom;
        const viewH = camera.height / camera.zoom;

        this.graphics.lineStyle(2, 0x00ff00);
        this.graphics.strokeRect(viewX, viewY, viewW, viewH);
    }
}
