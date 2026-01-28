class CameraController {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

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
            // Ctrlキーが押されていない場合はパンしない (スクロールバー優先)
            if (!pointer.event.ctrlKey) return;

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

    /**
     * ズーム操作のセットアップ (Ctrl+Wheel)
     */
    setupZoomInput() {
        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (this.isLocked) return;
            // Ctrlキー必須
            if (!pointer.event.ctrlKey) return;

            // ズーム変更
            const zoomDelta = deltaY > 0 ? -0.1 : 0.1;
            // Clamp (0.5 ~ 2.0 based on UIScene)
            const newZoom = Phaser.Math.Clamp(this.camera.zoom + zoomDelta, 0.5, 2.0);

            this.setZoom(newZoom);
            // GameSceneからUISceneへ通知されるようにする
            this.scene.game.events.emit('zoomUpdate', newZoom);
        });
    }

    setLock(locked) {
        this.isLocked = locked;
        if (this.debug && locked) console.log('[CameraController] Input Locked');
        if (this.debug && !locked) console.log('[CameraController] Input Unlocked');
    }

    setZoom(value) {
        // 1. 現在の中心点（ワールド座標）を計算
        const cam = this.camera;
        const centerX = cam.scrollX + (cam.width / cam.zoom) / 2;
        const centerY = cam.scrollY + (cam.height / cam.zoom) / 2;

        // 2. ズーム適用
        cam.setZoom(value);

        // 3. 中心点を維持するように scrollX/Y を再計算
        // 新しいビューポートサイズ
        const newViewportW = cam.width / value;
        const newViewportH = cam.height / value;

        cam.scrollX = centerX - newViewportW / 2;
        cam.scrollY = centerY - newViewportH / 2;

        this.scene.events.emit('cameraMoved');
    }
}
