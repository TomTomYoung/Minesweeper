class CameraController {
    constructor(scene, camera, scrollCoordinator) {
        this.scene = scene;
        this.camera = camera;
        this.coordinator = scrollCoordinator;

        this.isLocked = false;
        this.debug = true; // デバッグ用
    }

    /**
     * パン操作のセットアップ
     * @param {Phaser.GameObjects.GameObject} hitArea 
     */
    setupPanInput(hitArea) {
        // 背景ゾーンに対する操作のみを受け付ける
        hitArea.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            if (this.isLocked) return;

            // カメラ移動量 (ズーム考慮)
            const deltaX = (pointer.x - pointer.prevPosition.x) / this.camera.zoom;
            const deltaY = (pointer.y - pointer.prevPosition.y) / this.camera.zoom;

            if (deltaX === 0 && deltaY === 0) return;

            this.camera.scrollX -= deltaX;
            this.camera.scrollY -= deltaY;

            // 変更を通知（GameScene側でCoordinatorを使って同期してもらうため）
            this.scene.events.emit('cameraMoved');
        });
    }

    setLock(locked) {
        this.isLocked = locked;
        if (this.debug && locked) console.log('[CameraController] Input Locked');
        if (this.debug && !locked) console.log('[CameraController] Input Unlocked');
    }

    setZoom(value) {
        this.camera.setZoom(value);
        this.scene.events.emit('cameraMoved');
    }
}
