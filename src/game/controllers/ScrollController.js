class GameScrollController {
    constructor(scene, eventBus, boardManager, cameraController) {
        this.scene = scene;
        this.eventBus = eventBus;
        this.boardManager = boardManager;
        this.cameraController = cameraController;
        this.session = null; // Needs reference for config

        // Listen for camera moves to update UI

    }

    setSession(session) {
        this.session = session;
    }

    // Called from GameScene to update UI based on State (PanX/Y)
    syncToState(panX, panY, range) {
        // Convert Pan to Ratio (Inverse of handleScrollRequest)
        // PanY = (value - 0.5) * range * -1
        // value = 0.5 - PanY / range

        const vRatio = 0.5 - panY / range;
        const hRatio = 0.5 - panX / range;

        // Clamp for UI
        const clampedVRatio = Phaser.Math.Clamp(vRatio, 0, 1);
        const clampedHRatio = Phaser.Math.Clamp(hRatio, 0, 1);

        // Fixed Size Ratio (Always 0.2, independent of zoom/content)
        const vSizeRatio = 0.2;
        const hSizeRatio = 0.2;

        // Always Visible
        const syncData = {
            v: { visible: true, ratio: clampedVRatio, sizeRatio: vSizeRatio },
            h: { visible: true, ratio: clampedHRatio, sizeRatio: hSizeRatio }
        };

        this.eventBus.emitUpdateScroll(syncData);
    }
}


