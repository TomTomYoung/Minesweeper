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
        // Camera Viewport (Green)
        const viewX = camera.worldView.x;
        const viewY = camera.worldView.y;
        const viewW = camera.worldView.width;
        const viewH = camera.worldView.height;

        this.graphics.lineStyle(2, 0x00ff00);
        this.graphics.strokeRect(viewX, viewY, viewW, viewH);

        // Zoom Center (MidPoint) - Cyan
        this.graphics.fillStyle(0x00ffff, 1);
        this.graphics.fillCircle(camera.midPoint.x, camera.midPoint.y, 10);

        // Board Center - Magenta
        const boardCX = bounds.left + bounds.width / 2;
        const boardCY = bounds.top + bounds.height / 2;
        this.graphics.fillStyle(0xff00ff, 1);
        this.graphics.fillCircle(boardCX, boardCY, 10);
    }
}
