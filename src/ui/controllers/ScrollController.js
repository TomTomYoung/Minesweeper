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

                // 【重要】ユーザーがドラッグ操作中でない場合のみ更新
                // updateThumb内でサイズ計算と位置計算（ピクセル）を行い、RexUIに適用する
                if (!this.state.isDraggingV) {
                    this.scrollBarV.updateThumb(data.v.ratio, data.v.sizeRatio);
                } else {
                    // ドラッグ中はサイズだけ更新したい場合（操作感維持のため位置は更新しない）
                    // 本当はupdateThumb(currentValue, newSizeRatio)などを呼ぶべきだが、
                    // ドラッグ中にサイズが急変することは稀なので、一旦スルーまたはサイズのみ更新への分離も検討
                    // ここではシンプルに、ドラッグ中は干渉しない（サイズ更新もしない）か、
                    // またはサイズだけ更新するメソッドを別途残す手もあるが、今回は整合性優先でスキップ
                }
            } else {
                this.scrollBarV.setVisible(false);
            }

            // --- 横スクロールバー ---
            if (data.h.visible) {
                this.scrollBarH.setVisible(true);

                if (!this.state.isDraggingH) {
                    this.scrollBarH.updateThumb(data.h.ratio, data.h.sizeRatio);
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
