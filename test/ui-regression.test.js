const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, config, Emitter } = require('./helpers/game-context');

function icon() {
    return { visible: false, texture: null, alpha: 1, width:256, height:256,
        setScale(value) { this.scale = value; return this; },
        setVisible(value) { this.visible = value; return this; },
        setTexture(value) { this.texture = value; return this; },
        setAlpha(value) { this.alpha = value; return this; }
    };
}
function view(game, type = 'Cell') {
    const cell = Object.create(game.get(type).prototype);
    Object.assign(cell, { revealed: false, flagged: false, cellState: 0, size:40, icon: icon(), add() {},
        background: { setFillStyle() { return this; }, setStrokeStyle() { return this; } },
        text: { setText() { return this; }, setColor() { return this; }, setVisible() { return this; } },
        scene: { textures: { exists() { return true; } }, add: { image:icon } }, showWallEffect() {}
    });
    return cell;
}

test('board synchronization updates collected treasure contents and defeated enemy appearance', () => {
    const game = loadGame(), Board = game.get('Board');
    const cell = view(game, 'TreasureCell'), state = new (game.get('TreasureLogicCell'))('key');
    state.isRevealed = true; state.state = 1;
    const board = { cells: [[cell]], shouldReplaceCell: Board.prototype.shouldReplaceCell };
    Board.prototype.updateCellUI.call(board, 0, 0, state);
    assert.equal(cell.icon.texture, 'treasure');
    state.state = 2;
    Board.prototype.updateCellUI.call(board, 0, 0, state);
    assert.equal(cell.icon.texture, 'treasure_open');
    assert.equal(cell.statusBadge.texture, 'key');
    assert.equal(cell.statusBadge.visible, true);
    assert.equal(cell.icon.alpha, 0.75);
    assert.equal(cell.cellState, 2);
    const enemy = view(game, 'EnemyCell');
    enemy.updateState({ isRevealed: true, state: 2, viewType: 'enemy' });
    assert.equal(enemy.icon.alpha, 0.8);
    assert.equal(enemy.icon.texture, 'enemy_defeated');
    assert.equal(enemy.statusBadge.texture, 'ui_check');
});

test('walls display flags and final reveal replaces a flag with the underlying cell', () => {
    const game = loadGame();
    const wall = view(game, 'WallCell');
    wall.updateState({ isFlagged: true, isRevealed: false, state: 0 });
    assert.equal(wall.flagged, true);
    assert.equal(wall.icon.texture, 'flag');
    const cell = view(game, 'EnemyCell');
    cell.updateState({ isFlagged: true, isRevealed: false, state: 0 });
    cell.updateState({ isFlagged: false, isRevealed: true, state: 1 });
    assert.equal(cell.revealed, true);
    assert.equal(cell.flagged, false);
    assert.equal(cell.icon.texture, 'enemy');
});

test('global subscriptions remain single after repeated shutdown and preserve other listeners', () => {
    const game = loadGame(), Bus = game.get('GameEventBus'), UIBus = game.get('UIEventBus');
    const events = new Emitter(), sceneEvents = new Emitter(), scene = { game: { events }, events: sceneEvents };
    let calls = 0, foreign = 0;
    events.on('updateUI', () => foreign++);
    for (let i = 0; i < 5; i++) {
        const bus = new Bus(scene), uiBus = new UIBus(scene);
        bus.onZoomUpdate(() => calls++);
        bus.onCameraMoved(() => {});
        uiBus.onUpdateUI(() => {});
        events.emit('zoomUpdate', 1.5);
        assert.equal(events.listenerCount('zoomUpdate'), 1);
        bus.destroy(); uiBus.destroy();
        assert.equal(events.listenerCount('zoomUpdate'), 0);
        assert.equal(sceneEvents.listenerCount('cameraMoved'), 0);
        assert.equal(events.listenerCount('updateUI'), 1);
    }
    events.emit('updateUI');
    assert.equal(calls, 5); assert.equal(foreign, 1);
});

test('UI can request initial statistics after missing the first emission', () => {
    const game = loadGame(), events = new Emitter();
    const scene = { game: { gameData: {}, events }, gameSession: { flagsLeft: 40, timer: 0, score: 0, totalScore: 0, level: 1, mode: 'CLASSIC', inventory: {swords:0,pickaxes:0} } };
    scene.eventBus = new (game.get('GameEventBus'))({ ...scene, events: new Emitter() });
    scene.eventBus.onRequestUIUpdate(() => game.get('GameScene').prototype.updateUI.call(scene));
    game.get('GameScene').prototype.updateUI.call(scene);
    const uiBus = new (game.get('UIEventBus'))(scene); let flags = 10;
    uiBus.onUpdateUI(data => flags = data.flagsLeft);
    uiBus.emitRequestUIUpdate();
    assert.equal(flags, 40);
});

test('new game resets run state and requests only one restart', () => {
    const game = loadGame(); let restarts = 0, cancelled = 0;
    const scene = { game: { gameData: { level: 8, score: 500, totalScore: 2000 } },
        gameFlowController: { destroy() { cancelled++; } }, inputController: { destroy() {} }, scene: { restart() { restarts++; } } };
    scene.restartGame = () => game.get('GameScene').prototype.restartGame.call(scene);
    game.get('UIScene').prototype.restartGame.call({ scene: { get() { return scene; } } });
    assert.deepEqual(scene.game.gameData, { level: 1, score: 0, totalScore: 0 });
    assert.equal(restarts, 1); assert.equal(cancelled, 1);
});

test('disposed deferred input cannot mutate an old session', async () => {
    const game = loadGame(), board = new Emitter(); let clicks = 0;
    const controller = new (game.get('InputController'))(
        { input: { activePointer: {} } }, {}, { board }, { handleCellClick() { clicks++; } }
    );
    board.emit('cellClicked', { boardRow: 0, boardCol: 0 });
    controller.destroy();
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(clicks, 0);
    assert.equal(board.listenerCount('cellClicked'), 0);
});

test('treasure score events and blocked stairs produce accurate messages', () => {
    const game = loadGame(), messages = [];
    const session = new (game.get('GameSession'))(config(), 1, 0, 0, 'RPG'); session.start();
    const flow = new (game.get('GameFlowController'))({}, { emitShowMessage(message) { messages.push(message.text); } }, session);
    flow.processResult({ events: [], scoreEvents: [{ type: 'TREASURE_GOLD' }] });
    flow.processResult({ events: ['STAIRS_INTERACTED'], progression: { canAdvance: false, reason: 'KEY_REQUIRED' } });
    assert.match(messages[0], /100/); assert.match(messages[1], /鍵/);
});

test('camera transforms preserve the chosen pivot with Phaser default center origin', () => {
    const game = loadGame();
    const camera = { width: 800, height: 600, originX: 0.5, originY: 0.5, zoom: 1, setZoom(value) { this.zoom = value; } };
    const controller = new (game.get('CameraController'))({ events: new Emitter() }, camera);
    for (const pivot of [{ x: 400, y: 300 }, { x: 173, y: 234 }]) {
        for (const zoom of [0.5, 1, 2]) {
            controller.updateCameraTransform(zoom, pivot, { x: 0, y: 0 });
            // Phaser's default-origin projection: O + (world - scroll - O) * zoom.
            const screenX = 400 + (pivot.x - camera.scrollX - 400) * zoom;
            const screenY = 300 + (pivot.y - camera.scrollY - 300) * zoom;
            assert.ok(Math.abs(screenX - pivot.x) < 1e-9);
            assert.ok(Math.abs(screenY - pivot.y) < 1e-9);
        }
    }
});

test('wheel zoom and slider stay synchronized without feeding updates back', () => {
    const game = loadGame(), events = new Emitter(); let requested = 0, value;
    const state = new (game.get('UIState'))(), bus = new (game.get('UIEventBus'))({ game: { events } });
    const slider = { onValueChange(callback) { this.callback = callback; }, setValue(v) { value = v; this.callback(v); } };
    new (game.get('ZoomController'))(state, bus, slider);
    events.on('zoomUpdate', () => requested++);
    events.emit('zoomChanged', 2);
    assert.equal(value, 1); assert.equal(state.currentZoom, 2); assert.equal(requested, 0);
    slider.callback(0);
    assert.equal(state.currentZoom, 0.5); assert.equal(requested, 1);
});
