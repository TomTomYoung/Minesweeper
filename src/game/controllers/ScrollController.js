class GameScrollController {
    constructor(scene, eventBus, boardManager, cameraController) {
        this.scene = scene;
        this.eventBus = eventBus;
        this.boardManager = boardManager;
        this.cameraController = cameraController;
        this.session = null; // Needs reference for config

        // Listen for camera moves to update UI
        this.eventBus.onCameraMoved(() => this.updateScrollInfo(), this);
    }

    setSession(session) {
        this.session = session;
    }

    // Called when ScrollBar changes
    handleScrollRequest(data) {
        const bounds = this.getScrollBounds();
        const cam = this.scene.cameras.main;
        const viewportW = cam.width / cam.zoom;
        const viewportH = cam.height / cam.zoom;

        if (data.axis === 'vertical') {
            const maxScrollY = bounds.top + bounds.height - viewportH;
            const minScrollY = bounds.top;

            if (maxScrollY > minScrollY) {
                cam.scrollY = minScrollY + data.value * (maxScrollY - minScrollY);
            }
        } else if (data.axis === 'horizontal') {
            const maxScrollX = bounds.left + bounds.width - viewportW;
            const minScrollX = bounds.left;

            if (maxScrollX > minScrollX) {
                cam.scrollX = minScrollX + data.value * (maxScrollX - minScrollX);
            }
        }

        // Notify change (for Debugger etc)
        // this.eventBus.emitCameraMoved(); // Might cause loop if not careful? 
        // CameraController emits cameraMoved when it changes zoom/pan.
        // Here we changed manually, so we should likely emit or just update info.
        // Update info directly to avoid circular event if InputController uses it?
        // But UI needs update.
        this.updateScrollInfo();
    }

    updateScrollInfo() {
        if (!this.session || !this.session.config) return;

        const bounds = this.getScrollBounds();
        const cam = this.scene.cameras.main;
        const viewportW = cam.width / cam.zoom;
        const viewportH = cam.height / cam.zoom;

        // Clamp Logic
        if (bounds.height > viewportH) {
            const maxScrollY = bounds.top + bounds.height - viewportH;
            cam.scrollY = Phaser.Math.Clamp(cam.scrollY, bounds.top, maxScrollY);
        }

        if (bounds.width > viewportW) {
            const maxScrollX = bounds.left + bounds.width - viewportW;
            cam.scrollX = Phaser.Math.Clamp(cam.scrollX, bounds.left, maxScrollX);
        }

        // Calculate UI Ratios
        let vRatio = 0, hRatio = 0;
        let vVisible = false, hVisible = false;

        const maxScrollY = bounds.top + bounds.height - viewportH;
        if (maxScrollY > bounds.top) {
            vRatio = (cam.scrollY - bounds.top) / (maxScrollY - bounds.top);
            vVisible = true;
        }

        const maxScrollX = bounds.left + bounds.width - viewportW;
        if (maxScrollX > bounds.left) {
            hRatio = (cam.scrollX - bounds.left) / (maxScrollX - bounds.left);
            hVisible = true;
        }

        vRatio = Phaser.Math.Clamp(vRatio, 0, 1);
        hRatio = Phaser.Math.Clamp(hRatio, 0, 1);

        const vSizeRatio = Phaser.Math.Clamp(viewportH / (bounds.height || 1), 0.1, 1);
        const hSizeRatio = Phaser.Math.Clamp(viewportW / (bounds.width || 1), 0.1, 1);

        const syncData = {
            v: { visible: vVisible, ratio: vRatio, sizeRatio: vSizeRatio },
            h: { visible: hVisible, ratio: hRatio, sizeRatio: hSizeRatio }
        };

        this.eventBus.emitUpdateScroll(syncData);

        return bounds; // Return for debugger if needed
    }

    getScrollBounds() {
        // Delegate to BoardManager to get board dimensions/position
        // But padding is logic of ScrollController
        const padding = 50;
        const rows = this.session.config.rows;
        const cols = this.session.config.cols;
        const cellSize = this.session.config.cellSize;

        const dim = this.boardManager.getBoardDimensions(rows, cols, cellSize);

        return {
            left: dim.x - padding,
            top: dim.y - padding,
            width: dim.width + padding * 2,
            height: dim.height + padding * 2
        };
    }
}
