class NumberLogicCell extends BaseLogicCell {

    /**
     * Called when the user clicks an already revealed number cell.
     * Attempts to expand around the cell if the required flags are met.
     */
    interact(board, row, col) {
        const result = super.interact(board, row, col);

        if (this.neighborMines === 0) return result;

        // Count surrounding flags
        let flagCount = 0;
        const neighbors = [];

        for (let i = Math.max(0, row - 1); i <= Math.min(board.rows - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(board.cols - 1, col + 1); j++) {
                if (i === row && j === col) continue;

                const neighbor = board.getCell(i, j);
                if (neighbor.isFlagged) {
                    flagCount++;
                } else if (!neighbor.isRevealed && !neighbor.isWall) {
                    neighbors.push([i, j]);
                }
            }
        }

        // Exact match -> reveal remaining unrevealed cells
        if (flagCount === this.neighborMines) {
            for (const [r, c] of neighbors) {
                const neighborCell = board.getCell(r, c);
                const subResult = neighborCell.reveal(board, r, c, { automatic: true });

                result.events.push(...subResult.events);
                result.scoreEvents.push(...subResult.scoreEvents);

                if (subResult.events.includes('GAME_OVER')) break;
            }
        }

        return result;
    }
}

