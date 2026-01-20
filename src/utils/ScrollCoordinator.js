class ScrollCoordinator {
    constructor() {
        this.debug = false; // 必要に応じてtrueに
    }

    /**
     * 現在の状態からUI表示用の正規化されたデータを計算する
     * @param {Phaser.Cameras.Scene2D.Camera} camera 
     * @param {Object} contentBounds { left, top, width, height }
     * @returns {Object} UI用データ { h: { visible, ratio, sizeRatio }, v: { visible, ratio, sizeRatio } }
     */
    calculateUISyncData(camera, contentBounds) {
        // ビューポート（ワールド単位）
        // width/zoom がワールド上での見える幅
        const worldViewW = camera.width / camera.zoom;
        const worldViewH = camera.height / camera.zoom;

        const result = {
            h: { visible: false, ratio: 0, sizeRatio: 1 },
            v: { visible: false, ratio: 0, sizeRatio: 1 }
        };

        // --- 垂直 (Vertical) ---
        if (contentBounds.height > worldViewH) {
            result.v.visible = true;
            result.v.sizeRatio = worldViewH / contentBounds.height;

            // スクロール可能量
            const maxScroll = contentBounds.height - worldViewH;

            // 現在のスクロール位置 (Bounds相対)
            // camera.scrollY は通常「画面の中心」ではなく「左上」基準で動いていると仮定するが、
            // Phaserの camera.scrollY は「カメラの左上が指すワールドY座標」
            const currentScroll = camera.scrollY - contentBounds.top;

            // 0.0 - 1.0 に正規化
            // clampしておくことで、バウンス時などの異常値を防ぐ
            result.v.ratio = Phaser.Math.Clamp(currentScroll / maxScroll, 0, 1);

            if (this.debug) console.log(`[Scroll V] scroll:${currentScroll.toFixed(1)} max:${maxScroll.toFixed(1)} ratio:${result.v.ratio.toFixed(3)}`);
        }

        // --- 水平 (Horizontal) ---
        if (contentBounds.width > worldViewW) {
            result.h.visible = true;
            result.h.sizeRatio = worldViewW / contentBounds.width;

            const maxScroll = contentBounds.width - worldViewW;
            const currentScroll = camera.scrollX - contentBounds.left;

            result.h.ratio = Phaser.Math.Clamp(currentScroll / maxScroll, 0, 1);

            if (this.debug) console.log(`[Scroll H] scroll:${currentScroll.toFixed(1)} max:${maxScroll.toFixed(1)} ratio:${result.h.ratio.toFixed(3)}`);
        }

        return result;
    }

    /**
     * UIからの入力比率(0.0-1.0)をカメラのワールド座標に変換する
     * @param {number} ratio 0.0 - 1.0
     * @param {string} axis 'vertical' | 'horizontal'
     * @param {Phaser.Cameras.Scene2D.Camera} camera 
     * @param {Object} contentBounds 
     * @returns {number} 目標とする camera.scrollX または scrollY
     */
    calculateCameraPosition(ratio, axis, camera, contentBounds) {
        const worldViewW = camera.width / camera.zoom;
        const worldViewH = camera.height / camera.zoom;

        if (axis === 'vertical') {
            const maxScroll = contentBounds.height - worldViewH;
            if (maxScroll <= 0) return contentBounds.top; // スクロール不要ならTopに合わせる（または現在地維持）

            // ratio から 相対スクロール量を復元
            const targetRelScroll = maxScroll * Phaser.Math.Clamp(ratio, 0, 1);

            // 絶対座標に変換
            return contentBounds.top + targetRelScroll;

        } else if (axis === 'horizontal') {
            const maxScroll = contentBounds.width - worldViewW;
            if (maxScroll <= 0) return contentBounds.left;

            const targetRelScroll = maxScroll * Phaser.Math.Clamp(ratio, 0, 1);
            return contentBounds.left + targetRelScroll;
        }

        return 0;
    }
}
