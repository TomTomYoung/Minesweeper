const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, config } = require('./helpers/game-context');

function fixture(rows=3, cols=3) {
    const game = loadGame();
    const board = game.get('LayeredBoardGenerator').initBoardData(rows, cols);
    const session = new (game.get('GameSession'))(config({ rows, cols }), 1, 0, 0, 'RPG_LAYERED');
    session.boardData = board;
    session.boardModel = new (game.get('LayeredBoardModel'))(board);
    session.isFirstClick = false;
    return { game, board, session, model: session.boardModel };
}
function cell(base, cover, game) { return new (game.get('LayeredCell'))(base, cover); }

test('a wall blocks manual access to a mine; removing it spends one pickaxe and leaves the mine hidden', () => {
    const {game, board, session} = fixture();
    board[1][1] = cell({type:'mine'}, new (game.get('LayeredWallCover'))(1), game);
    assert.ok(session.handleCellClick(1,1).events.includes('PICKAXE_REQUIRED'));
    assert.equal(session.isGameOver, false);
    assert.equal(board[1][1].isRevealed, true);
    session.inventory.pickaxes = 1;
    assert.ok(session.handleCellClick(1,1).events.includes('WALL_REMOVED'));
    assert.equal(session.inventory.pickaxes, 0);
    assert.equal(board[1][1].cover, null);
    assert.equal(board[1][1].isRevealed, false);
    assert.equal(board[1][1].base.type, 'mine');
    assert.ok(session.handleCellClick(1,1).events.includes('GAME_OVER'));
});

test('wall removal preserves every base kind and never collects or activates it', () => {
    for (const type of ['mine','number','empty','treasure','stairs']) {
        const {game, board, session} = fixture();
        const base = {type, neighborMines: type==='number'?2:0, content:'key'};
        board[1][1] = cell(base, new (game.get('LayeredWallCover'))(1), game);
        session.inventory.pickaxes=2;
        const result=session.handleCellClick(1,1);
        assert.deepEqual([...result.events], ['WALL_REMOVED']);
        assert.equal(board[1][1].base, base);
        assert.equal(board[1][1].isRevealed,false);
        assert.equal(session.hasKey,undefined);
        assert.equal(session.inventory.pickaxes,1);
    }
});

test('enemy removal consumes a sword, scores once, and does not explode its covered mine', () => {
    const {game, board, session}=fixture();
    board[1][1]=cell({type:'mine'},new (game.get('LayeredEnemyCover'))(),game);
    session.inventory.swords=1;
    assert.ok(session.handleCellClick(1,1).events.includes('ENEMY_DEFEATED'));
    assert.equal(session.inventory.swords,0);
    assert.equal(session.hasSword,false);
    assert.equal(session.score,50);
    assert.equal(session.enemiesDefeated,1);
    assert.equal(session.isGameOver,false);
    assert.equal(board[1][1].isRevealed,false);
    session.handleCellClick(1,1);
    assert.equal(session.isGameOver,true);
    assert.equal(session.score,50);
});

test('manual enemy click without a sword is fatal both before and after automatic reveal', () => {
    for(const visible of [false,true]) {
        const {game,board,session}=fixture();
        board[1][1].cover=new (game.get('LayeredEnemyCover'))();
        board[1][1].isRevealed=visible;
        const result=session.handleCellClick(1,1);
        assert.ok(result.events.includes('SWORD_REQUIRED'));
        assert.equal(session.isGameOver,true);
        assert.equal(session.enemiesDefeated,0);
        assert.ok(board[1][1].cover);
    }
});

test('base-only zero flood crosses safe walls/enemies/items without using tools or collecting, and skips covered mines/flags', () => {
    const {game,board,session,model}=fixture(3,6);
    board[0][1].cover=new (game.get('LayeredWallCover'))(1);
    board[1][2].cover=new (game.get('LayeredEnemyCover'))();
    board[1][3].base={type:'treasure',content:'key',neighborMines:0};
    board[1][4].base={type:'stairs',neighborMines:0};
    board[0][5]=cell({type:'mine'},new (game.get('LayeredWallCover'))(2),game);
    board[2][5].isFlagged=true;
    // Fixture's zero terrain deliberately exercises propagation without random generation.
    session.inventory={swords:2,pickaxes:3};
    session.handleCellClick(0,0);
    for(const [r,c] of [[0,1],[1,2],[1,3],[1,4],[2,4]]) assert.equal(board[r][c].isRevealed,true);
    assert.equal(board[0][5].isRevealed,false);
    assert.equal(board[2][5].isRevealed,false);
    assert.deepEqual(session.inventory,{swords:2,pickaxes:3});
    assert.equal(session.enemiesDefeated,0);
    assert.equal(session.isTransitioning,false);
    assert.equal(session.hasKey,undefined);
    const view=model.getViewState(0,1);
    assert.equal(view.coverType,'wall'); assert.equal(view.baseType,null);
});

test('chord only exposes covers, never spends tools, and an incorrectly flagged exposed mine is fatal', () => {
    const {game,board,session}=fixture();
    board[1][1].base={type:'number',neighborMines:1};board[1][1].isRevealed=true;
    board[0][0].isFlagged=true;
    board[0][1]=cell({type:'mine'},new (game.get('LayeredEnemyCover'))(),game);
    board[0][2].base={type:'mine'};
    session.inventory.swords=1;
    session.handleCellClick(1,1);
    assert.equal(session.inventory.swords,1);
    assert.ok(board[0][1].cover);
    assert.equal(session.enemiesDefeated,0);
    assert.equal(session.isGameOver,true);
});

test('equipment chests reveal first, award their stack once, and do not add SIMPLE sword bonus', () => {
    for(const [content,key] of [['sword','swords'],['pickaxe','pickaxes']]) {
        const {board,session}=fixture();
        board[1][1].base={type:'treasure',content,amount:7,neighborMines:0};
        session.handleCellClick(1,1);
        assert.equal(session.inventory[key],0);
        session.handleCellClick(1,1);
        assert.equal(session.inventory[key],7);
        session.handleCellClick(1,1);
        assert.equal(session.inventory[key],7);
        assert.equal(session.score,0);
    }
});

test('layered stairs require only this-floor key, transition once, and reset all equipment and floor score', () => {
    const {game,board,session}=fixture();
    board[1][1].base={type:'stairs',neighborMines:0};
    const blocked=session.handleCellClick(1,1);
    assert.equal(blocked.progression.reason,'KEY_REQUIRED');
    assert.equal(board[1][1].isRevealed,true);
    session.hasKey=true;session.inventory={swords:3,pickaxes:4};session.scoreManager.addPoints(70);
    assert.ok(session.handleCellClick(1,1).events.includes('NEXT_LEVEL'));
    assert.equal(session.totalEnemies>session.enemiesDefeated,true);
    assert.equal(session.handleCellRightClick(0,0).success,false);
    assert.equal(session.advanceLevel(),true);
    assert.equal(session.advanceLevel(),false);
    assert.equal(session.level,2);assert.equal(session.score,0);assert.equal(session.totalScore,70);
    assert.equal(session.inventory.swords,0);assert.equal(session.inventory.pickaxes,0);assert.equal(session.hasKey,false);
});

test('flags protect unopened covers and bases; revealed surfaces cannot be flagged', () => {
    const {game,board,session}=fixture();
    board[1][1].cover=new (game.get('LayeredEnemyCover'))();
    const original=session.flagsLeft;
    assert.equal(session.handleCellRightClick(1,1).success,true);
    session.handleCellClick(1,1);
    assert.equal(session.isGameOver,false);assert.equal(board[1][1].isRevealed,false);
    assert.equal(session.handleCellRightClick(1,1).success,true);
    assert.equal(session.flagsLeft,original);
    board[1][1].isRevealed=true;
    assert.equal(session.handleCellRightClick(1,1).success,false);
});

test('final reveal preserves both layers and exposes covered mines in the view model', () => {
    const {game,board,model}=fixture();
    board[1][1]=cell({type:'mine'},new (game.get('LayeredWallCover'))(1),game);
    board[1][1].isFlagged=true;
    model.revealAll();
    const state=model.getViewState(1,1);
    assert.equal(state.isFlagged,false);assert.equal(state.coverType,'wall');
    assert.equal(state.baseType,'mine');assert.equal(state.showUnderCover,true);
    assert.ok(board[1][1].cover);
});

function seeded(seed) { return () => ((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296); }

test('preset floors preserve exact two-layer counts and have enough initially reachable tools to remove all covers and descend', () => {
    const game=loadGame({Math:Object.assign(Object.create(Math),{random:seeded(9876)})});
    const Config=game.get('GameConfig'),Session=game.get('GameSession');
    let mineCovers=0, itemCovers=0;
    for(const difficulty of ['easy','medium','hard']) for(const level of [1,15,50]) for(let sample=0;sample<10;sample++) {
        const settings=new Config(); const cfg=settings.getConfig(difficulty);cfg.treasures=Math.max(4,cfg.treasures);
        settings.updateConfig(cfg);const adjusted=settings.adjustForLevel(level);
        const session=new Session(adjusted,level,0,0,'RPG_LAYERED');session.start();
        const first=sample%2?{row:0,col:0}:{row:Math.floor(cfg.rows/2),col:Math.floor(cfg.cols/2)};
        const opened=session.handleCellClick(first.row,first.col);
        assert.equal(opened.events.includes('GENERATION_FAILED'),false,`${difficulty}/${level}/${sample}`);
        const b=session.boardData;const counts={mines:0,treasures:0,stairs:0,enemies:0,walls:0};
        for(let r=0;r<cfg.rows;r++) for(let c=0;c<cfg.cols;c++) {
            const cell=b[r][c];
            if(cell.isMine)counts.mines++;
            if(cell.isTreasure)counts.treasures++;
            if(cell.isStairs)counts.stairs++;
            if(cell.isEnemy)counts.enemies++;
            if(cell.isWall)counts.walls++;
            if(cell.isMine&&cell.cover)mineCovers++;
            if((cell.isTreasure||cell.isStairs)&&cell.cover)itemCovers++;
            let mines=0;
            for(let rr=Math.max(0,r-1);rr<=Math.min(cfg.rows-1,r+1);rr++)for(let cc=Math.max(0,c-1);cc<=Math.min(cfg.cols-1,c+1);cc++) {
                if((rr!==r||cc!==c)&&b[rr][cc].isMine)mines++;
            }
            assert.equal(cell.neighborMines,mines);
            if(cell.isTreasure||cell.isStairs)assert.equal(cell.neighborMines,0);
            if(['sword','pickaxe'].includes(cell.base.content)) {
                assert.equal(cell.cover,null);assert.equal(cell.isRevealed,true,'equipment must be visible after first flood');
                session.handleCellClick(r,c);
            }
        }
        assert.deepEqual(counts,{mines:adjusted.mines,treasures:adjusted.treasures,stairs:adjusted.stairs,enemies:adjusted.enemies,walls:adjusted.totalWalls});
        assert.equal(session.inventory.swords,cfg.enemies);assert.equal(session.inventory.pickaxes,cfg.totalWalls);
        for(let r=0;r<cfg.rows;r++)for(let c=0;c<cfg.cols;c++)if(b[r][c].cover) {
            session.handleCellClick(r,c);assert.equal(b[r][c].isRevealed,false);assert.equal(session.isGameOver,false);
        }
        assert.equal(session.inventory.swords,0);assert.equal(session.inventory.pickaxes,0);
        let stairs;
        for(let r=0;r<cfg.rows;r++)for(let c=0;c<cfg.cols;c++) {
            if(b[r][c].isTreasure) {session.handleCellClick(r,c);session.handleCellClick(r,c);}
            if(b[r][c].isStairs)stairs=[r,c];
        }
        assert.equal(session.hasKey,true);assert.ok(session.handleCellClick(...stairs).events.includes('NEXT_LEVEL'));
    }
    assert.ok(mineCovers>0);assert.ok(itemCovers>0);
});

test('layered validation counts base/cover capacity separately and requires key and equipment chest slots', () => {
    const game=loadGame(),Config=game.get('GameConfig');
    assert.ok(Config.validate(config({treasures:2}),'RPG_LAYERED'));
    assert.equal(Config.validate(config({treasures:4,mines:24,totalWalls:45,wallClusters:3,enemies:15}),'RPG_LAYERED'),null);
    assert.ok(Config.validate(config({treasures:4,totalWalls:70,wallClusters:3,enemies:2}),'RPG_LAYERED'));
});

test('unplaceable layered settings return a retryable generation error without partial state', () => {
    const game=loadGame(),Session=game.get('GameSession');
    const session=new Session(config({rows:5,cols:5,mines:7,treasures:4,stairs:1,totalWalls:1,wallClusters:1,enemies:1}),1,0,0,'RPG_LAYERED');
    session.start();const initial=session.boardData;
    const result=session.handleCellClick(2,2);
    assert.ok(result.events.includes('GENERATION_FAILED'));
    assert.equal(session.isFirstClick,true);assert.equal(session.boardData,initial);
});
