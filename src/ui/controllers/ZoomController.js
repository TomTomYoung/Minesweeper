class ZoomController {

    /**
     * @param {Object} state - UIの状態管理オブジェクト
     * @param {Object} eventBus - イベント通知用バス
     * @param {Object} zoomSlider - ズームスライダーUIコンポーネント
     */
    constructor(state, eventBus, zoomSlider) {
        this.state = state;
        this.eventBus = eventBus;
        this.zoomSlider = zoomSlider;

        // イベントリスナーの設定を行います
        this.setupBinding();
        this.eventBus.onZoomChanged(zoom => {
            this.state.setUpdatingFromGame(true);
            try {
                this.state.setZoom(zoom);
                this.zoomSlider.setValue((zoom - 0.5) / 1.5);
            } finally {
                this.state.setUpdatingFromGame(false);
            }
        });
    }

    /**
     * スライダーの操作を監視し、ズーム変更をシステムに伝播させます
     */
    setupBinding() {
        this.zoomSlider.onValueChange((newValue) => {
            // ゲームロジック側からの更新による変更でない場合のみ処理を実行します
            // (UI -> Game の一方通行の操作時のみイベントを発火させて無限ループを防ぐ)
            if (!this.state.isUpdatingFromGame) {
                // ズーム倍率を計算します
                // スライダーの値 (0.0 ~ 1.0) を 0.5倍 ~ 2.0倍 の範囲に変換
                // 計算式: 最小値0.5 + (可変範囲1.5 * スライダー割合)
                const zoom = 0.5 + newValue * 1.5;

                // 内部状態を更新
                this.state.setZoom(zoom);

                // 変更をイベントバスを通じてゲーム全体に通知
                this.eventBus.emitZoomUpdate(zoom);
            }
        });
    }

    // Can add method to sync from game if needed (though zoom usually flows UI -> Game)
}

