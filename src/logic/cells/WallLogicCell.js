class WallLogicCell extends BaseLogicCell {
    constructor() {
        super();
        this.isWall = true;
        this.wallClusterId = null;
    }

    get viewType() {
        return 'wall';
    }

    reveal(board, row, col, options = {}) {
        if (this.isRevealed) return { events: [], scoreEvents: [] };

        const autoReveal = options && options.autoRevealWallCluster;

        if (autoReveal && this.wallClusterId) {
            // Open all walls with the same cluster ID
            for (let i = 0; i < board.rows; i++) {
                for (let j = 0; j < board.cols; j++) {
                    const target = board.getCell(i, j);
                    if (target.isWall && target.wallClusterId === this.wallClusterId && !target.isRevealed) {
                        target.isRevealed = true;
                        target.state = 1;
                    }
                }
            }
        } else {
            // Manual mode
            this.isRevealed = true;
            this.state = 1;
        }

        return { events: [], scoreEvents: [] };
    }

    interact(board, row, col) {
        if (this.state >= 1 && this.wallClusterId) {
            // Already revealed wall clicked: try to open 4-neighbors with same cluster ID
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;

                const neighbor = board.getCell(newRow, newCol);
                if (neighbor && neighbor.isWall && neighbor.wallClusterId === this.wallClusterId && !neighbor.isRevealed) {
                    neighbor.isRevealed = true;
                    neighbor.state = 1;
                }
            }
        }

        return { events: [], scoreEvents: [] };
    }
}
