class UIState {
    constructor() {
        this.isUpdatingFromGame = false;
        this.isDraggingV = false;
        this.isDraggingH = false;
        this.currentZoom = 1.0;
    }

    setUpdatingFromGame(isUpdating) {
        this.isUpdatingFromGame = isUpdating;
    }

    setDraggingV(isDragging) {
        this.isDraggingV = isDragging;
    }

    setDraggingH(isDragging) {
        this.isDraggingH = isDragging;
    }

    setZoom(zoom) {
        this.currentZoom = zoom;
    }
}
