class UIEventBus {
    constructor(scene) {
        this.gameEvents = scene.game.events;
        this.subscriptions = [];
    }

    listen(event, callback, context) {
        this.gameEvents.on(event, callback, context);
        this.subscriptions.push({ event, callback, context });
    }

    onUpdateUI(callback, context) { this.listen('updateUI', callback, context); }
    onUpdateScroll(callback, context) { this.listen('updateScroll', callback, context); }
    onShowMessage(callback, context) { this.listen('showMessage', callback, context); }
    onZoomChanged(callback, context) { this.listen('zoomChanged', callback, context); }
    emitScrollRequest(axis, value) { this.gameEvents.emit('scrollRequest', { axis, value }); }
    emitZoomUpdate(zoom) { this.gameEvents.emit('zoomUpdate', zoom); }
    emitRequestUIUpdate() { this.gameEvents.emit('requestUIUpdate'); }

    destroy() {
        for (const { event, callback, context } of this.subscriptions) {
            this.gameEvents.off(event, callback, context);
        }
        this.subscriptions = [];
    }
}
