/** Uses the cluster traversal, but places covers without replacing their bases. */
class LayeredWallPlacement extends WallPlacementStrategy {
    static isAvailable(board, row, col, protectedCells) {
        return !protectedCells.has(`${row},${col}`) && !board[row][col].cover;
    }

    static placeCluster(board, rows, cols, clusterId, requested, protectedCells) {
        const candidates = this.getAvailableCells(board, rows, cols, protectedCells);
        this.shuffleArray(candidates);
        for (const start of candidates) {
            const cells = this.collectConnectedCells(board, rows, cols, start, requested, protectedCells);
            if (cells.length < requested) continue;
            for (const [r, c] of cells) board[r][c].cover = new LayeredWallCover(clusterId);
            return cells.length;
        }
        return 0;
    }
}

class LayeredBoardGenerator {
    static initBoardData(rows, cols) {
        return Array.from({ length: rows }, () => Array.from({ length: cols }, () => new LayeredCell()));
    }

    static generate(config, firstClick) {
        const error = GameConfig.validate(config, 'RPG_LAYERED');
        if (error) throw new RangeError(error);
        let lastError;
        for (let attempt = 0; attempt < 32; attempt++) {
            try { return this.generateAttempt(config, firstClick); }
            catch (error) {
                if (!(error instanceof RangeError)) throw error;
                lastError = error;
            }
        }
        throw lastError;
    }

    static generateAttempt(config, firstClick) {
        const { rows, cols } = config;
        const board = this.initBoardData(rows, cols);
        const safeZone = BoardGenerator.getSafeZone(rows, cols, firstClick.row, firstClick.col);
        const positions = [];
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            if (!safeZone.has(`${r},${c}`)) positions.push([r, c]);
        }
        // Reserve a compact zero-mine region for items. Tools are reachable from
        // the opening flood, so a sword cannot be locked behind the enemy it needs.
        ItemPlacementStrategy.shuffleArray(positions);
        positions.sort(([r1, c1], [r2, c2]) =>
            Math.abs(r1 - firstClick.row) + Math.abs(c1 - firstClick.col) -
            Math.abs(r2 - firstClick.row) - Math.abs(c2 - firstClick.col));
        const itemPositions = positions.slice(0, config.treasures + config.stairs);
        const mineExclusions = new Set(safeZone);
        for (const [r, c] of itemPositions) {
            for (const key of BoardGenerator.getSafeZone(rows, cols, r, c)) mineExclusions.add(key);
        }
        const minePositions = positions.filter(([r, c]) => !mineExclusions.has(`${r},${c}`));
        if (minePositions.length < config.mines) throw new RangeError('Not enough room for mines outside the item region');
        ItemPlacementStrategy.shuffleArray(minePositions);
        for (const [r, c] of minePositions.slice(0, config.mines)) board[r][c].base.type = 'mine';
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const cell = board[r][c];
            cell.base.neighborMines = BoardGenerator.countNeighborMines(board, rows, cols, r, c);
            if (!cell.isMine) cell.base.type = cell.neighborMines ? 'number' : 'empty';
        }

        const contents = [];
        if (config.enemies) contents.push({ content: 'sword', amount: config.enemies });
        if (config.totalWalls) contents.push({ content: 'pickaxe', amount: config.totalWalls });
        contents.push({ content: 'key', amount: 1 });
        while (contents.length < config.treasures) contents.push({ content: 'gold', amount: 1 });
        const protectedCells = new Set(safeZone);
        contents.forEach((content, i) => {
            const [r, c] = itemPositions[i];
            board[r][c].base = { type: 'treasure', neighborMines: 0, ...content, collected: false };
            if (content.content === 'sword' || content.content === 'pickaxe') protectedCells.add(`${r},${c}`);
        });
        for (const [r, c] of itemPositions.slice(config.treasures)) board[r][c].base.type = 'stairs';

        const walls = LayeredWallPlacement.place(board, config, protectedCells);
        const enemyPositions = positions.filter(([r, c]) => !protectedCells.has(`${r},${c}`) && !board[r][c].cover);
        if (enemyPositions.length < config.enemies) throw new RangeError('Not enough room for enemy covers');
        ItemPlacementStrategy.shuffleArray(enemyPositions);
        for (const [r, c] of enemyPositions.slice(0, config.enemies)) board[r][c].cover = new LayeredEnemyCover();
        Object.defineProperty(board, 'placementCounts', { value: Object.freeze({
            mines: config.mines, treasures: config.treasures, stairs: config.stairs,
            enemies: config.enemies, walls
        }), enumerable: false });
        return board;
    }
}
