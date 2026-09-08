const test = require('node:test');
const assert = require('node:assert/strict');

const { createContext, evaluate, loadScripts } = require('./helpers/load-scripts');

const scripts = [
    'src/logic/cells/BaseLogicCell.js',
    'src/logic/cells/EmptyLogicCell.js',
    'src/logic/cells/NumberLogicCell.js',
    'src/logic/cells/MineLogicCell.js',
    'src/logic/cells/EnemyLogicCell.js',
    'src/logic/cells/TreasureLogicCell.js',
    'src/logic/cells/StairsLogicCell.js',
    'src/logic/cells/WallLogicCell.js',
    'src/logic/generator/strategies/MinePlacementStrategy.js',
    'src/logic/generator/strategies/EnemyPlacementStrategy.js',
    'src/logic/generator/strategies/ItemPlacementStrategy.js',
    'src/logic/generator/strategies/WallPlacementStrategy.js',
    'src/logic/BoardGenerator.js',
    'src/logic/BoardModel.js',
    'src/logic/modes/GameModeRegistry.js',
    'src/game/managers/ScoreManager.js',
    'src/logic/GameSession.js'
];

function createSession(mode, overrides = {}) {
    const context = createContext({
        console: { log() {}, warn() {}, error: console.error }
    });
    loadScripts(context, scripts);
    const GameSession = evaluate(context, 'GameSession');
    const config = {
        rows: 2,
        cols: 2,
        mines: 1,
        enemies: 0,
        treasures: 0,
        stairs: 0,
        wallClusters: 0,
        totalWalls: 0,
        treasurePoints: 100,
        ...overrides
    };
    return { context, session: new GameSession(config, 1, 0, 0, mode) };
}

function installNearlyCompleteBoard(context, session) {
    const BoardModel = evaluate(context, 'BoardModel');
    const board = evaluate(context, `[
        [new MineLogicCell(), new EmptyLogicCell()],
        [new EmptyLogicCell(), new EmptyLogicCell()]
    ]`);
    for (const cell of [board[0][1], board[1][0], board[1][1]]) {
        cell.isRevealed = true;
        cell.state = 1;
    }
    session.boardData = board;
    session.boardModel = new BoardModel(board);
    session.isFirstClick = false;
}

test('STANDARD wins after every non-mine cell is revealed and awards bonus once', () => {
    const { context, session } = createSession('STANDARD');
    installNearlyCompleteBoard(context, session);

    const result = session._checkWinCondition();
    const awardedScore = session.score;

    assert.equal(result.event, 'WIN');
    assert.equal(session.getWinState().isWin, true);
    assert.equal(session._checkWinCondition(), null);
    assert.equal(session.score, awardedScore);
});

test('RPG does not use the classic all-safe-cells victory condition', () => {
    const { context, session } = createSession('RPG');
    installNearlyCompleteBoard(context, session);

    assert.equal(session._checkWinCondition(), null);
    assert.equal(session.isGameOver, false);
    assert.equal(session.getWinState().isWin, false);
});

test('RPG emits NEXT_LEVEL only when stairs requirements are satisfied', () => {
    const { context, session } = createSession('RPG', { enemies: 1, stairs: 1 });
    const BoardModel = evaluate(context, 'BoardModel');
    const stairs = evaluate(context, 'new StairsLogicCell()');
    stairs.isRevealed = true;
    stairs.state = 1;
    session.boardData = [[stairs]];
    session.boardModel = new BoardModel(session.boardData);
    session.isFirstClick = false;
    session.totalEnemies = 1;

    const missingKey = session.handleCellClick(0, 0);
    assert.equal(missingKey.events.includes('NEXT_LEVEL'), false);
    assert.equal(missingKey.progression.reason, 'KEY_REQUIRED');
    session.hasKey = true;
    const enemiesRemain = session.handleCellClick(0, 0);
    assert.equal(enemiesRemain.events.includes('NEXT_LEVEL'), false);
    assert.equal(enemiesRemain.progression.reason, 'ENEMIES_REMAIN');
    session.enemiesDefeated = 1;
    const nextLevel = session.handleCellClick(0, 0);
    assert.equal(nextLevel.events.includes('NEXT_LEVEL'), true);
    assert.equal(nextLevel.progression.canAdvance, true);
    assert.equal(session.isGameOver, false);
});

test('legacy mode names resolve to explicit mode definitions', () => {
    const classic = createSession('STANDARD').session;
    const rpg = createSession('RPG').session;

    assert.equal(classic.mode, 'CLASSIC');
    assert.equal(classic.ruleSet.constructor.name, 'ClassicRuleSet');
    assert.equal(rpg.mode, 'RPG_SIMPLE');
    assert.equal(rpg.ruleSet.constructor.name, 'RpgSimpleRuleSet');
});

test('unimplemented and unknown modes fail explicitly', () => {
    assert.throws(() => createSession('RPG_LAYERED'), /not implemented/);
    assert.throws(() => createSession('UNKNOWN'), /Unknown game mode/);
});
