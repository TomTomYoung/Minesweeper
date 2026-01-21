class UIEventBus {
    constructor(scene) {
        this.scene = scene;
        this.gameEvents = scene.game.events;
    }

    // --- Listen (From Game) ---
    onUpdateUI(callback, context) {
        this.gameEvents.on('updateUI', callback, context);
    }

    onUpdateScroll(callback, context) {
        this.gameEvents.on('updateScroll', callback, context);
    }

    onShowMessage(callback, context) {
        this.gameEvents.on('showMessage', callback, context);
    }

    // --- Emit (To Game) ---
    emitScrollRequest(axis, value) {
        this.gameEvents.emit('scrollRequest', { axis, value });
    }

    emitZoomUpdate(zoomValue) {
        this.gameEvents.emit('zoomUpdate', zoomValue);
    }

    emitRequestUIUpdate() {
        this.gameEvents.emit('requestUIUpdate');
    }

    // Cleanup
    destroy() {
        // Remove listeners if necessary, though simpler to let Scene handle cleanup if it destroys game.events listeners?
        // Usually safe to leave global listeners if scene persists, but good practice to clear if unique.
        // For now, minimal.
    }
}
