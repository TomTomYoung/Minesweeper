class LayeredBoardModel {
    constructor(board) {
        this.board = board;
        this.rows = board.length;
        this.cols = board[0].length;
        this.showAll = false;
    }

    getCell(row, col) { return this.board[row]?.[col] || null; }

    neighbors(row, col) {
        const positions = [];
        for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c++) {
                if (r !== row || c !== col) positions.push([r, c]);
            }
        }
        return positions;
    }

    advanceState(row, col, { inventory } = {}) {
        const result = { events: [], scoreEvents: [], itemRewards: [] };
        const cell = this.getCell(row, col);
        if (!cell || cell.isFlagged) return result;
        const wasRevealed = cell.isRevealed;
        cell.isRevealed = true;
        if (cell.cover) return cell.cover.interact(cell, inventory || { swords: 0, pickaxes: 0 });

        const base = cell.base;
        if (cell.isMine) { result.events.push('GAME_OVER'); return result; }
        if (base.type === 'stairs') {
            // A locked stair is still revealed. This floor's key is the only requirement.
            result.events.push('STAIRS_INTERACTED');
        } else if (base.type === 'treasure') {
            if (wasRevealed && !base.collected) {
                base.collected = true;
                if (base.content === 'gold') result.scoreEvents.push({ type: 'TREASURE_GOLD' });
                else if (base.content === 'key') result.events.push('ITEM_KEY');
                else {
                    result.events.push(base.content === 'sword' ? 'ITEM_SWORD' : 'ITEM_PICKAXE');
                    result.itemRewards.push({ type: base.content, amount: base.amount });
                }
            }
        } else if (!cell.neighborMines) {
            this.autoOpen(row, col);
        } else if (wasRevealed) {
            return this.chord(row, col);
        }
        return result;
    }

    /** Base-only flood fill: covers are displayed but never activated or removed. */
    autoOpen(row, col) {
        const queue = [[row, col]], visited = new Set();
        for (let index = 0; index < queue.length; index++) {
            const [r, c] = queue[index], key = `${r},${c}`;
            if (visited.has(key)) continue;
            visited.add(key);
            const cell = this.getCell(r, c);
            if (!cell || cell.isFlagged || cell.isMine) continue;
            cell.isRevealed = true;
            if (cell.neighborMines === 0) queue.push(...this.neighbors(r, c));
        }
    }

    chord(row, col) {
        const result = { events: [], scoreEvents: [] };
        const positions = this.neighbors(row, col);
        const flags = positions.filter(([r, c]) => this.getCell(r, c).isFlagged).length;
        if (flags !== this.getCell(row, col).neighborMines) return result;
        for (const [r, c] of positions) {
            const cell = this.getCell(r, c);
            if (cell.isFlagged || cell.isRevealed) continue;
            // Chording cannot use tools or interact with a covered base.
            cell.isRevealed = true;
            if (cell.cover) continue;
            if (cell.isMine) { result.events.push('GAME_OVER'); break; }
            if (!cell.neighborMines) this.autoOpen(r, c);
        }
        return result;
    }

    toggleFlag(row, col, flagsLeft) {
        const cell = this.getCell(row, col);
        if (!cell || cell.isRevealed || (!cell.isFlagged && flagsLeft <= 0)) {
            return { success: false, flagsDelta: 0 };
        }
        cell.isFlagged = !cell.isFlagged;
        return { success: true, flagsDelta: cell.isFlagged ? -1 : 1 };
    }

    revealAll() {
        this.showAll = true;
        for (const row of this.board) for (const cell of row) {
            cell.isRevealed = true;
            cell.isFlagged = false;
        }
    }

    getViewState(row, col) {
        const cell = this.getCell(row, col);
        const baseVisible = cell.isRevealed && (!cell.cover || this.showAll);
        return {
            viewType: 'layered', isRevealed: cell.isRevealed, isFlagged: cell.isFlagged,
            coverType: cell.isRevealed ? cell.cover?.type : null,
            baseType: baseVisible ? cell.base.type : null,
            neighborMines: baseVisible ? cell.neighborMines : 0,
            treasureContent: baseVisible ? cell.base.content : null,
            amount: baseVisible ? cell.base.amount : null,
            collected: baseVisible && !!cell.base.collected,
            showUnderCover: this.showAll && !!cell.cover
        };
    }

    getViewData() {
        return this.board.map((row, r) => row.map((cell, c) => this.getViewState(r, c)));
    }
}
