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

    // カメラ位置を計算し、UI（スクロールバー）に状態を同期する
    updateScrollInfo() {
        if (!this.session || !this.session.config) return;

        // スクロール可能な全領域を取得
        const bounds = this.getScrollBounds();
        const cam = this.scene.cameras.main;
        // --- Phaser Camera Info ---
        // cam.scrollX / scrollY : 現在のスクロール位置（ワールド座標）
        // cam.zoom              : ズーム倍率（1.0 = 等倍）
        // cam.width / height    : ビューポートのサイズ（画面サイズ）
        // cam.worldView         : 現在映っている範囲の矩形オブジェクト

        // ズームを考慮した「現在画面に見えている範囲（ビューポート）」のサイズ
        const viewportW = cam.width / cam.zoom;
        const viewportH = cam.height / cam.zoom;

        // --- Clamp Logic (制限処理) ---
        // カメラがスクロール可能範囲（bounds）をはみ出さないように補正
        if (bounds.height > viewportH) {
            const maxScrollY = bounds.top + bounds.height - viewportH;
            cam.scrollY = Phaser.Math.Clamp(cam.scrollY, bounds.top, maxScrollY);
        }

        if (bounds.width > viewportW) {
            const maxScrollX = bounds.left + bounds.width - viewportW;
            cam.scrollX = Phaser.Math.Clamp(cam.scrollX, bounds.left, maxScrollX);
        }

        // --- Calculate UI Ratios (UI用計算) ---
        let vRatio = 0, hRatio = 0;
        let vVisible = false, hVisible = false;

        // 縦スクロールの現在位置（0.0〜1.0）を計算
        const maxScrollY = bounds.top + bounds.height - viewportH;
        if (maxScrollY > bounds.top) {
            vRatio = (cam.scrollY - bounds.top) / (maxScrollY - bounds.top);
            vVisible = true; // 画面よりマップの方が縦に長い場合のみバーを表示
        }

        // 横スクロールの現在位置（0.0〜1.0）を計算
        const maxScrollX = bounds.left + bounds.width - viewportW;
        if (maxScrollX > bounds.left) {
            hRatio = (cam.scrollX - bounds.left) / (maxScrollX - bounds.left);
            hVisible = true;
        }

        // 念のため 0〜1 の範囲に収める
        vRatio = Phaser.Math.Clamp(vRatio, 0, 1);
        hRatio = Phaser.Math.Clamp(hRatio, 0, 1);

        // つまみのサイズ用：画面サイズ / 全体サイズ の比率
        // コンテンツが長いほど値は小さくなり、つまみも小さくなる
        const vSizeRatio = Phaser.Math.Clamp(viewportH / (bounds.height || 1), 0.1, 1);
        const hSizeRatio = Phaser.Math.Clamp(viewportW / (bounds.width || 1), 0.1, 1);

        const syncData = {
            v: { visible: vVisible, ratio: vRatio, sizeRatio: vSizeRatio },
            h: { visible: hVisible, ratio: hRatio, sizeRatio: hSizeRatio }
        };

        // UIコントローラーへ送信
        this.eventBus.emitUpdateScroll(syncData);

        return bounds; // デバッグ用
    }

    // スクロール可能な領域（境界）を計算
    getScrollBounds() {
        // BoardManagerから盤面の実際のサイズと位置を取得
        // （セルサイズ × 行数/列数）

        // パディング（余白）の設定：盤面の端ギリギリではなく、少し外側までスクロールできるようにする
        const padding = 50;
        const rows = this.session.config.rows;
        const cols = this.session.config.cols;
        const cellSize = this.session.config.cellSize;

        const dim = this.boardManager.getBoardDimensions(rows, cols, cellSize);

        return {
            left: dim.x - padding,
            top: dim.y - padding,
            width: dim.width + padding * 2,  // 左右のパディング分を足す
            height: dim.height + padding * 2 // 上下のパディング分を足す
        };
    }
}
