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
    'src/logic/BoardGenerator.js'
];

function loadLogic() {
    const context = createContext();
    loadScripts(context, scripts);
    return { context, BoardGenerator: evaluate(context, 'BoardGenerator') };
}

test('safe zone is clipped at board edges', () => {
    const { BoardGenerator } = loadLogic();
    const safeZone = BoardGenerator.getSafeZone(4, 5, 0, 0);

    assert.deepEqual([...safeZone].sort(), ['0,0', '0,1', '1,0', '1,1']);
});

test('generated classic board keeps the first-click area free of mines', () => {
    const { BoardGenerator } = loadLogic();
    const config = {
        rows: 9,
        cols: 9,
        mines: 10,
        enemies: 0,
        treasures: 0,
        stairs: 0,
        wallClusters: 0,
        totalWalls: 0
    };
    const firstClick = { row: 4, col: 4 };
    const board = BoardGenerator.generate(config, firstClick);
    const safeZone = BoardGenerator.getSafeZone(config.rows, config.cols, firstClick.row, firstClick.col);

    assert.equal(board.flat().filter((cell) => cell.isMine).length, config.mines);
    for (const coordinate of safeZone) {
        const [row, col] = coordinate.split(',').map(Number);
        assert.equal(board[row][col].isMine, false, `${coordinate} must be safe`);
    }
});

test('neighbor numbers equal adjacent mine counts', () => {
    const { context, BoardGenerator } = loadLogic();
    const board = BoardGenerator.initBoardData(3, 3);
    board[0][0] = evaluate(context, 'new MineLogicCell()');
    board[2][2] = evaluate(context, 'new MineLogicCell()');

    BoardGenerator.calculateNeighborMines(board, 3, 3);

    assert.equal(board[0][1].neighborMines, 1);
    assert.equal(board[1][1].neighborMines, 2);
    assert.equal(board[2][1].neighborMines, 1);
});

test('RPG generation places every requested type without overwriting occupied cells', () => {
    const { BoardGenerator } = loadLogic();
    const config = {
        rows: 16,
        cols: 16,
        mines: 20,
        enemies: 3,
        treasures: 4,
        stairs: 1,
        wallClusters: 3,
        totalWalls: 12
    };
    const firstClick = { row: 8, col: 8 };
    const board = BoardGenerator.generate(config, firstClick);

    assert.deepEqual(
        { ...board.placementCounts },
        { mines: 20, treasures: 4, stairs: 1, enemies: 3, walls: 12 }
    );
    assert.equal(board.flat().filter((cell) => cell.isMine).length, config.mines);
    assert.equal(board.flat().filter((cell) => cell.isTreasure).length, config.treasures);
    assert.equal(board.flat().filter((cell) => cell.isStairs).length, config.stairs);
    assert.equal(board.flat().filter((cell) => cell.isEnemy).length, config.enemies);
    assert.equal(board.flat().filter((cell) => cell.isWall).length, config.totalWalls);

    const safeZone = BoardGenerator.getSafeZone(config.rows, config.cols, firstClick.row, firstClick.col);
    for (const coordinate of safeZone) {
        const [row, col] = coordinate.split(',').map(Number);
        const cell = board[row][col];
        assert.equal(
            cell.isMine || cell.isTreasure || cell.isStairs || cell.isEnemy || cell.isWall,
            false,
            `${coordinate} must not contain a special cell`
        );
    }
});

test('wall placement preserves mines, treasures, stairs, and enemies', () => {
    const { context, BoardGenerator } = loadLogic();
    const board = BoardGenerator.initBoardData(5, 5);
    board[0][0] = evaluate(context, 'new MineLogicCell()');
    board[0][1] = evaluate(context, "new TreasureLogicCell('key')");
    board[0][2] = evaluate(context, 'new StairsLogicCell()');
    board[0][3] = evaluate(context, 'new EnemyLogicCell()');
    const WallPlacementStrategy = evaluate(context, 'WallPlacementStrategy');

    const placed = WallPlacementStrategy.place(
        board,
        { rows: 5, cols: 5, wallClusters: 2, totalWalls: 6 },
        new Set(['4,4'])
    );

    assert.equal(placed, 6);
    assert.equal(board[0][0].isMine, true);
    assert.equal(board[0][1].isTreasure, true);
    assert.equal(board[0][2].isStairs, true);
    assert.equal(board[0][3].isEnemy, true);
    assert.equal(board[4][4].isWall, false);
});

test('impossible placement fails explicitly instead of returning a partial board', () => {
    const { BoardGenerator } = loadLogic();
    const config = {
        rows: 3,
        cols: 3,
        mines: 1,
        enemies: 0,
        treasures: 0,
        stairs: 0,
        wallClusters: 0,
        totalWalls: 0
    };

    assert.throws(
        () => BoardGenerator.generate(config, { row: 1, col: 1 }),
        /Cannot place 1 mines/
    );
});
