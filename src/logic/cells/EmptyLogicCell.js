class EmptyLogicCell extends BaseLogicCell {
    /**
     * Called when the user clicks this cell.
     */
    reveal(board, row, col) {
        const result = super.reveal(board, row, col);
        if (result.events.length > 0) return result; // Should be empty

        // Start BFS
        const queue = [[row, col]];
        const visited = new Set();
        visited.add(`${row},${col}`);

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            const currentCell = board.getCell(r, c);

            // Skip if already revealed or flagged, unless it's the very first cell we are processing
            if ((currentCell.isRevealed || currentCell.isFlagged) && !(r === row && c === col)) continue;

            if (r !== row || c !== col) {
                currentCell.isRevealed = true;
                currentCell.state = 1;

                // If it's another empty cell, add neighbors to BFS
                if (currentCell instanceof EmptyLogicCell) {
                    for (let i = Math.max(0, r - 1); i <= Math.min(board.rows - 1, r + 1); i++) {
                        for (let j = Math.max(0, c - 1); j <= Math.min(board.cols - 1, c + 1); j++) {
                            if (i === r && j === c) continue;
                            const key = `${i},${j}`;
                            if (!visited.has(key)) {
                                const neighbor = board.getCell(i, j);
                                // Spec: don't auto-open mines, flags, or already revealed cells
                                if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                                    visited.add(key);
                                    queue.push([i, j]);
                                }
                            }
                        }
                    }
                }
            } else {
                // Initial cell processing (already revealed in super)
                for (let i = Math.max(0, r - 1); i <= Math.min(board.rows - 1, r + 1); i++) {
                    for (let j = Math.max(0, c - 1); j <= Math.min(board.cols - 1, c + 1); j++) {
                        if (i === r && j === c) continue;
                        const key = `${i},${j}`;
                        if (!visited.has(key)) {
                            const neighbor = board.getCell(i, j);
                            if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                                visited.add(key);
                                queue.push([i, j]);
                            }
                        }
                    }
                }
            }
        }

        return result;
    }
}
