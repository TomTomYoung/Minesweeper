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
        this.gameEvents.off('updateUI', undefined, undefined);
        this.gameEvents.off('updateScroll', undefined, undefined);
        this.gameEvents.off('showMessage', undefined, undefined);
    }
}
