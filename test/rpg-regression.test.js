const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, config, installBoard } = require('./helpers/game-context');

test('automatic enemy opening waits for a click, then defeats and scores exactly once without a sword', () => {
    const game = loadGame();
    const Session = game.get('GameSession');
    const Enemy = game.get('EnemyLogicCell');
    const enemy = new Enemy();
    const session = new Session(config({ rows: 1, cols: 2, enemies: 1 }), 1, 0, 0, 'RPG');
    session.start();
    installBoard(game, session, [[new (game.get('EmptyLogicCell'))(), enemy]]);
    session.handleCellClick(0, 0);
    assert.equal(enemy.isRevealed, true);
    assert.equal(enemy.state, 1);
    assert.equal(session.enemiesDefeated, 0);
    assert.equal(session.score, 0);
    session.handleCellClick(0, 1);
    session.handleCellClick(0, 1);
    assert.equal(enemy.state, 2);
    assert.equal(session.enemiesDefeated, 1);
    assert.equal(session.score, 50);
    assert.equal(session.hasSword, false);
});

test('direct enemy click keeps SIMPLE sword-free combat and never consumes an owned sword', () => {
    const game = loadGame();
    const session = new (game.get('GameSession'))(config({ rows: 1, cols: 1, enemies: 1 }), 1, 0, 0, 'RPG');
    session.start(); session.hasSword = true;
    installBoard(game, session, [[new (game.get('EnemyLogicCell'))()]]);
    session.handleCellClick(0, 0);
    assert.equal(session.enemiesDefeated, 1);
    assert.equal(session.hasSword, true);
});

test('number chord exposes both enemies; subsequent clicks count both and unblock stairs', () => {
    const game = loadGame();
    const session = new (game.get('GameSession'))(config({ rows: 2, cols: 2, mines: 1, enemies: 2 }), 1, 0, 0, 'RPG');
    session.start(); session.hasKey = true;
    const number = new (game.get('NumberLogicCell'))();
    number.neighborMines = 1; number.isRevealed = true; number.state = 1;
    const mine = new (game.get('MineLogicCell'))(); mine.isFlagged = true;
    const first = new (game.get('EnemyLogicCell'))(), second = new (game.get('EnemyLogicCell'))();
    installBoard(game, session, [[number, first], [second, mine]]);
    session.handleCellClick(0, 0);
    assert.equal(first.state, 1); assert.equal(second.state, 1);
    assert.equal(session.enemiesDefeated, 0);
    session.handleCellClick(0, 1); session.handleCellClick(1, 0);
    assert.equal(session.enemiesDefeated, 2);
    assert.equal(session.score, 100);
    assert.equal(session.ruleSet.evaluateStairs(session).canAdvance, true);
});

test('batched defeat events are counted individually', () => {
    const game = loadGame();
    const session = new (game.get('GameSession'))(config(), 1, 0, 0, 'RPG');
    session.start();
    session._processResult({ events: ['ENEMY_DEFEATED', 'ENEMY_DEFEATED'], scoreEvents: [] });
    assert.equal(session.enemiesDefeated, 2);
    assert.equal(session.score, 100);
});

for (const automatic of [false, true]) test(`wall cluster preserves removable flags (automatic=${automatic})`, () => {
    const game = loadGame();
    const Wall = game.get('WallLogicCell');
    const a = new Wall(), b = new Wall(); a.wallClusterId = b.wallClusterId = 1;
    const session = new (game.get('GameSession'))(config({ rows: 1, cols: 2, autoRevealWallCluster: automatic }), 1, 0, 0, 'RPG');
    session.start(); installBoard(game, session, [[a, b]]);
    session.handleCellRightClick(0, 1);
    session.handleCellClick(0, 0); session.handleCellClick(0, 0);
    assert.equal(b.isRevealed, false);
    assert.equal(b.isFlagged, true);
    assert.equal(session.handleCellRightClick(0, 1).success, true);
    assert.equal(session.flagsLeft, session.config.mines);
});

test('next floor commits once after UI updates; only cumulative points carry, and exploration remains endless', () => {
    const game = loadGame();
    const Session = game.get('GameSession'), Flow = game.get('GameFlowController'), Scene = game.get('GameScene');
    let session = new Session(config({ rows: 1, cols: 2, enemies: 0 }), 1, 125, 300, 'RPG');
    const totals = [];
    for (let floor = 1; floor <= 3; floor++) {
        session.start(); session.hasKey = true; session.hasSword = true;
        const stairs = new (game.get('StairsLogicCell'))(); stairs.isRevealed = true; stairs.state = 1;
        installBoard(game, session, [[stairs, new (game.get('MineLogicCell'))()]]);
        const timers = [], data = {}, scene = { game: { gameData: data }, gameSession: session,
            eventBus: { emitUpdateUI() {} }, time: { delayedCall(delay, callback) {
                const timer = { callback, remove() { this.removed = true; } }; timers.push(timer); return timer;
            } }, scene: { restart() { scene.restarts++; } }, restarts: 0,
            updateUI() { Scene.prototype.updateUI.call(this); }
        };
        const flow = new Flow(scene, { emitShowMessage() {} }, session);
        flow.processResult(session.handleCellClick(0, 0)); scene.updateUI();
        flow.processResult(session.handleCellClick(0, 0));
        session.handleCellClick(0, 1);
        assert.equal(session.isGameOver, false);
        assert.equal(session.handleCellRightClick(0, 1).success, false);
        assert.equal(session.updateTimer(1000), false);
        assert.equal(data.level, floor);
        assert.equal(timers.length, 1);
        timers[0].callback(); timers[0].callback();
        assert.equal(scene.restarts, 1);
        assert.equal(data.level, floor + 1);
        assert.equal(data.score, 0);
        assert.equal(data.totalScore, 300);
        session = new Session(config({ rows: 1, cols: 2, enemies: 0 }), data.level, data.score, data.totalScore, 'RPG');
        session.start();
        assert.equal(session.hasKey, false); assert.equal(session.hasSword, false);
        assert.equal(session.enemiesDefeated, 0); assert.equal(session.timer, 0);
        assert.equal(session.getWinState().isWin, false);
        totals.push(session.totalScore);
    }
    assert.deepEqual(totals, [300, 300, 300]);
});

test('failed generation leaves first-click state intact and can be retried', () => {
    const game = loadGame();
    const session = new (game.get('GameSession'))(config({ rows: 3, cols: 3, mines: 1, enemies: 0, treasures: 0, stairs: 0, wallClusters: 0, totalWalls: 0 }), 1, 0, 0, 'STANDARD');
    session.start(); const before = session.boardData;
    const result = session.handleCellClick(1, 1);
    assert.equal(result.events[0], 'GENERATION_FAILED');
    assert.equal(session.boardData, before);
    assert.equal(session.isFirstClick, true);
    session.handleCellClick(0, 0);
    assert.equal(session.isFirstClick, false);
});

test('seeded preset floors can obtain their own key, defeat all enemies, and enter stairs without carryover', () => {
    let seed = 1;
    const seededMath = Object.create(Math);
    seededMath.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const game = loadGame({ Math: seededMath }), GameConfig = game.get('GameConfig'), Session = game.get('GameSession');
    for (const difficulty of ['easy', 'medium', 'hard']) {
        const gc = new GameConfig(); gc.updateConfig(gc.getConfig(difficulty));
        for (const level of [1, 15, 50]) {
            for (let sample = 0; sample < 10; sample++) {
                const cfg = gc.adjustForLevel(level), session = new Session(cfg, level, 0, 0, 'RPG');
                session.start();
                const result = session.handleCellClick(Math.floor(cfg.rows / 2), Math.floor(cfg.cols / 2));
                assert.equal(result.events.includes('GENERATION_FAILED'), false, `${difficulty}/${level}/${sample}`);
                let stairs;
                // This checks reachability with known safe cells, not a no-guess solving guarantee.
                for (let row = 0; row < cfg.rows; row++) for (let col = 0; col < cfg.cols; col++) {
                    const cell = session.boardModel.getCell(row, col);
                    if (cell.isStairs) { stairs = [row, col]; continue; }
                    if (cell.isMine) continue;
                    session.handleCellClick(row, col);
                    if (cell.isTreasure || cell.isEnemy) session.handleCellClick(row, col);
                }
                assert.equal(session.hasKey, true);
                assert.equal(session.enemiesDefeated, cfg.enemies);
                assert.equal(session.isGameOver, false);
                session.handleCellClick(...stairs);
                if (!session.isTransitioning) session.handleCellClick(...stairs);
                assert.equal(session.isTransitioning, true);
            }
        }
    }
});
