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

        // --- Use WorldView (Correct usage for Zoom) ---
        // Note: camera.worldView はレンダリングサイクルで更新されるため、
        // イベント発火直後(setZoom直後)だとまだ値が古い可能性がある。
        // そのため、midPointとzoomから直接「あるべきworldView」を計算する。

        const viewportW = cam.width / cam.zoom;
        const viewportH = cam.height / cam.zoom;

        // midPointはズームで変わらない（はず）なので、ここから左上を逆算
        const currentScrollX = cam.midPoint.x - viewportW / 2;
        const currentScrollY = cam.midPoint.y - viewportH / 2;

        // --- Clamp Logic (制限処理) ---
        // Viewportが見えている範囲がBoundsを超えている場合、補正する
        // Note: worldViewはReadOnlyなので、補正が必要ならscrollX/Yを操作する必要があるが、
        // ここでは「表示の正しさ」を優先し、既存のClampは一旦scrollXベースのままにするか、
        // あるいはRatio計算側でClampするか。
        // 今回は「ノブの位置がおかしい」修正なので、Ratio計算に集中する。
        // ※ 既存のClampロジックは scrollX 基準だったので、厳密にはズレる可能性があるが、
        //   PhaserのsetBoundsを使っているなら自動Clampされるはず。
        //   ここでは手動Clampしているが、一旦コメントアウトしてPhaser任せにするか、
        //   またはロジックをworldViewベースに書き換える。

        // 簡易実装: UI表示のためのRatio計算に注力する

        // --- Calculate UI Ratios (UI用計算) ---
        let vRatio = 0, hRatio = 0;
        let vVisible = false, hVisible = false;

        // 縦スクロール
        // 可動域 = Boundsの高さ - 画面の高さ（Viewport）
        const maxScrollY = bounds.top + bounds.height - viewportH;

        if (maxScrollY > bounds.top) { // コンテンツが画面より大きい場合
            // 現在位置(worldView.y)が可動域のどこにいるか
            vRatio = (currentScrollY - bounds.top) / (maxScrollY - bounds.top);
            vVisible = true;
        }

        // 横スクロール
        const maxScrollX = bounds.left + bounds.width - viewportW;
        if (maxScrollX > bounds.left) {
            hRatio = (currentScrollX - bounds.left) / (maxScrollX - bounds.left);
            hVisible = true;
        }

        // 念のため 0〜1 の範囲に収める
        vRatio = Phaser.Math.Clamp(vRatio, 0, 1);
        hRatio = Phaser.Math.Clamp(hRatio, 0, 1);

        // つまみのサイズ用：画面サイズ / 全体サイズ の比率
        // コンテンツが長いほど値は小さくなり、つまみも小さくなる
        const vSizeRatio = Phaser.Math.Clamp(viewportH / (bounds.height || 1), 0.1, 1);
        const hSizeRatio = Phaser.Math.Clamp(viewportW / (bounds.width || 1), 0.1, 1);

        // Debug: Check calculation
        console.log(`[ScrollCalc] WorldView: y=${currentScrollY.toFixed(1)}, h=${viewportH.toFixed(1)} | Bounds: y=${bounds.top}, h=${bounds.height} | Ratio: ${vRatio.toFixed(3)} | MaxScrollY: ${maxScrollY.toFixed(1)}`);


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
