class UIScrollController {
    constructor(state, eventBus, scrollBarV, scrollBarH) {
        this.state = state;
        this.eventBus = eventBus;
        this.scrollBarV = scrollBarV;
        this.scrollBarH = scrollBarH;

        this.setupBindings();
    }

    setupBindings() {
        // Vertical
        this.scrollBarV.onInputStart(() => this.state.setDraggingV(true));
        this.scrollBarV.onInputEnd(() => this.state.setDraggingV(false));
        this.scrollBarV.onValueChange((newValue) => {
            if (!this.state.isUpdatingFromGame) {
                this.eventBus.emitScrollRequest('vertical', newValue);
            }
        });

        // Horizontal
        this.scrollBarH.onInputStart(() => this.state.setDraggingH(true));
        this.scrollBarH.onInputEnd(() => this.state.setDraggingH(false));
        this.scrollBarH.onValueChange((newValue) => {
            if (!this.state.isUpdatingFromGame) {
                this.eventBus.emitScrollRequest('horizontal', newValue);
            }
        });
    }

    // ゲームロジック等の外部要因によるスクロールバーの更新
    updateScrollBars(data) {
        // フラグを立てて、この変更が「ユーザー操作」と誤検知されてループするのを防ぐ
        this.state.setUpdatingFromGame(true);
        try {
            // --- 縦スクロールバー ---
            if (data.v.visible) {
                this.scrollBarV.setVisible(true);
                // コンテンツ量に対する表示割合（つまみのサイズ）を更新
                this.scrollBarV.setThumbSize(data.v.sizeRatio);

                // 【重要】ユーザーがドラッグ操作中でない場合のみ、位置を更新する
                // （操作中に強制的に位置を戻すと、ガクガクしたり操作不能になるため）
                if (!this.state.isDraggingV) {
                    this.scrollBarV.setValue(data.v.ratio);
                }
            } else {
                this.scrollBarV.setVisible(false);
            }

            // --- 横スクロールバー ---
            if (data.h.visible) {
                this.scrollBarH.setVisible(true);
                this.scrollBarH.setThumbSize(data.h.sizeRatio);

                // 同様にドラッグ中でない場合のみ更新
                if (!this.state.isDraggingH) {
                    this.scrollBarH.setValue(data.h.ratio);
                }
            } else {
                this.scrollBarH.setVisible(false);
            }
        } finally {
            // 処理完了後は必ずフラグを下ろす
            this.state.setUpdatingFromGame(false);
        }
    }
}
