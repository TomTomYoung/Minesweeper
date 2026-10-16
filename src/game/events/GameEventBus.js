class GameEventBus {
    constructor(scene) {
        this.gameEvents = scene.game.events;
        this.sceneEvents = scene.events;
        this.subscriptions = [];
    }

    listen(emitter, event, callback, context) {
        emitter.on(event, callback, context);
        this.subscriptions.push({ emitter, event, callback, context });
    }

    onZoomUpdate(callback, context) { this.listen(this.gameEvents, 'zoomUpdate', callback, context); }
    onScrollRequest(callback, context) { this.listen(this.gameEvents, 'scrollRequest', callback, context); }
    onBlockInput(callback, context) { this.listen(this.gameEvents, 'blockInput', callback, context); }
    onUnblockInput(callback, context) { this.listen(this.gameEvents, 'unblockInput', callback, context); }
    onRequestUIUpdate(callback, context) { this.listen(this.gameEvents, 'requestUIUpdate', callback, context); }
    onCameraMoved(callback, context) { this.listen(this.sceneEvents, 'cameraMoved', callback, context); }
    emitShowMessage(config) { this.gameEvents.emit('showMessage', config); }
    emitUpdateUI(data) { this.gameEvents.emit('updateUI', data); }
    emitUpdateScroll(data) { this.gameEvents.emit('updateScroll', data); }
    emitZoomChanged(zoom) { this.gameEvents.emit('zoomChanged', zoom); }
    emitCameraMoved() { this.sceneEvents.emit('cameraMoved'); }

    destroy() {
        for (const { emitter, event, callback, context } of this.subscriptions) {
            emitter.off(event, callback, context);
        }
        this.subscriptions = [];
    }
}
