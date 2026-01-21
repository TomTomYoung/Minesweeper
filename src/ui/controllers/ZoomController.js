class ZoomController {
    constructor(state, eventBus, zoomSlider) {
        this.state = state;
        this.eventBus = eventBus;
        this.zoomSlider = zoomSlider;

        this.setupBinding();
    }

    setupBinding() {
        this.zoomSlider.onValueChange((newValue) => {
            if (!this.state.isUpdatingFromGame) {
                // Calculate zoom: 0.5 ~ 2.0
                const zoom = 0.5 + newValue * 1.5;
                this.state.setZoom(zoom);
                this.eventBus.emitZoomUpdate(zoom);
            }
        });
    }

    // Can add method to sync from game if needed (though zoom usually flows UI -> Game)
}
