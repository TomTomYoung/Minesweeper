class ScrollController {
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

    updateScrollBars(data) {
        this.state.setUpdatingFromGame(true);
        try {
            // Vertical
            if (data.v.visible) {
                this.scrollBarV.setVisible(true);
                this.scrollBarV.setThumbSize(data.v.sizeRatio);
                if (!this.state.isDraggingV) {
                    this.scrollBarV.setValue(data.v.ratio);
                }
            } else {
                this.scrollBarV.setVisible(false);
            }

            // Horizontal
            if (data.h.visible) {
                this.scrollBarH.setVisible(true);
                this.scrollBarH.setThumbSize(data.h.sizeRatio);
                if (!this.state.isDraggingH) {
                    this.scrollBarH.setValue(data.h.ratio);
                }
            } else {
                this.scrollBarH.setVisible(false);
            }
        } finally {
            this.state.setUpdatingFromGame(false);
        }
    }
}
