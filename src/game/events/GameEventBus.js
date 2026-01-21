class GameEventBus {
    constructor(scene) {
        this.scene = scene;
        this.gameEvents = scene.game.events;
        this.sceneEvents = scene.events;
    }

    // --- Listen (From Global/UI) ---
    onZoomUpdate(callback, context) {
        this.gameEvents.on('zoomUpdate', callback, context);
    }

    onScrollRequest(callback, context) {
        this.gameEvents.on('scrollRequest', callback, context);
    }

    onBlockInput(callback, context) {
        this.gameEvents.on('blockInput', callback, context);
    }

    onUnblockInput(callback, context) {
        this.gameEvents.on('unblockInput', callback, context);
    }

    // --- Listen (Local Scene Events) ---
    onCameraMoved(callback, context) {
        this.sceneEvents.on('cameraMoved', callback, context);
    }

    // --- Emit (To Global/UI) ---
    emitShowMessage(config) {
        this.gameEvents.emit('showMessage', config);
    }

    emitUpdateUI(data) {
        this.gameEvents.emit('updateUI', data);
    }

    emitUpdateScroll(data) {
        this.gameEvents.emit('updateScroll', data);
    }

    // --- Emit (Local) ---
    emitCameraMoved() {
        this.sceneEvents.emit('cameraMoved');
    }
}
