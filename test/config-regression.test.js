const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, config } = require('./helpers/game-context');

function menu(game, mode) {
    const gameConfig = new (game.get('GameConfig'))();
    const data = { gameConfig, mode };
    const scene = { game: { gameData: data }, scene: { isActive() { return false; }, start() {} } };
    return { data, controller: new (game.get('MenuController'))(scene) };
}

test('CLASSIC custom validation ignores unused RPG fields and accepts a 5x5 one-mine board', () => {
    const game = loadGame(), { data, controller } = menu(game, 'STANDARD');
    const result = controller.startGame('custom', config({ rows: 5, cols: 5, mines: 1, totalWalls: 15 }));
    assert.equal(result.success, true);
    assert.equal(data.gameConfig.currentConfig.totalWalls, 0);
    assert.equal(data.gameConfig.currentConfig.enemies, 0);
});

test('RPG custom validation requires this-floor key supply and consistent walls, and counts enemies', () => {
    const game = loadGame(), { controller } = menu(game, 'RPG');
    for (const overrides of [{ treasures: 0 }, { stairs: 0 }, { wallClusters: 0 }, { wallClusters: 11, totalWalls: 10 },
        { rows: 5, cols: 5, mines: 5, totalWalls: 0, wallClusters: 0, treasures: 1, stairs: 1, enemies: 10 }]) {
        assert.ok(controller.startGame('custom', config(overrides)).error, JSON.stringify(overrides));
    }
});

test('custom enemy count comes from its own configuration rather than the previous difficulty', () => {
    const game = loadGame(), { data, controller } = menu(game, 'RPG');
    controller.startGame('hard');
    const custom = config({ enemies: 1 });
    controller.startGame('custom', custom);
    assert.equal(data.gameConfig.currentConfig.enemies, 1);
    delete custom.enemies;
    controller.startGame('custom', custom);
    assert.equal(data.gameConfig.currentConfig.enemies, 2);
});

test('endless RPG rejects custom counts that fit floor one but exceed later-floor capacity', () => {
    const game = loadGame(), { controller } = menu(game, 'RPG');
    const custom = config({ rows: 5, cols: 5, mines: 1, totalWalls: 0, wallClusters: 0,
        treasures: 1, stairs: 1, enemies: 10 });
    assert.match(controller.startGame('custom', custom).error, /地雷増加/);
    assert.equal(controller.startGame('custom', { ...custom, enemies: 7 }).success, true);
});

test('generation retries transient placement failures but still fails explicitly after a finite budget', () => {
    const game = loadGame(), Generator = game.get('BoardGenerator');
    const attempt = Generator.generateAttempt;
    const cfg = config({ mines: 1, treasures: 0, stairs: 0, enemies: 0, totalWalls: 0, wallClusters: 0 });
    let calls = 0;
    game.context.failures = 2;
    const fail = game.get('(function() { throw new RangeError("No space for items"); })');
    Generator.generateAttempt = function(...args) {
        calls++;
        if (calls <= 2) return fail();
        return attempt.apply(this, args);
    };
    assert.equal(Generator.generate(cfg, { row: 4, col: 4 }).placementCounts.mines, 1);
    assert.equal(calls, 3);
    calls = 0;
    Generator.generateAttempt = () => { calls++; return fail(); };
    assert.throws(() => Generator.generate(cfg, { row: 4, col: 4 }), /No space/);
    assert.equal(calls, 32);
});
