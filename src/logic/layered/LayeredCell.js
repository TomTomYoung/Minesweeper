/** One base and at most one cover. Revealed refers to the current top surface. */
class LayeredCell {
    constructor(base = { type: 'empty', neighborMines: 0 }, cover = null) {
        this.base = base;
        this.cover = cover;
        this.isRevealed = false;
        this.isFlagged = false;
    }

    get isMine() { return this.base.type === 'mine'; }
    get isWall() { return this.cover?.type === 'wall'; }
    get isEnemy() { return this.cover?.type === 'enemy'; }
    get isTreasure() { return this.base.type === 'treasure'; }
    get isStairs() { return this.base.type === 'stairs'; }
    get neighborMines() { return this.base.neighborMines || 0; }

    removeCover() {
        this.cover = null;
        // Removing a cover never activates or reveals its base, including a mine.
        this.isRevealed = false;
    }
}

class LayeredWallCover {
    constructor(clusterId) { this.type = 'wall'; this.clusterId = clusterId; }

    interact(cell, inventory) {
        if (!inventory.pickaxes) return { events: ['PICKAXE_REQUIRED'], scoreEvents: [] };
        inventory.pickaxes--;
        cell.removeCover();
        return { events: ['WALL_REMOVED'], scoreEvents: [] };
    }
}

class LayeredEnemyCover {
    constructor() { this.type = 'enemy'; }

    interact(cell, inventory) {
        if (!inventory.swords) return { events: ['SWORD_REQUIRED', 'GAME_OVER'], scoreEvents: [] };
        inventory.swords--;
        cell.removeCover();
        return { events: ['ENEMY_DEFEATED'], scoreEvents: [] };
    }
}
