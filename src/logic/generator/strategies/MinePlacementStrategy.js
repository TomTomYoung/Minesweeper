/** Strategy for placing mines on unoccupied cells outside the safe zone. */
class MinePlacementStrategy {
    static place(board, config, safeZone) {
        const availableCells = this.getAvailableCells(board, config.rows, config.cols, safeZone);

        if (availableCells.length < config.mines) {
            throw new RangeError(`Cannot place ${config.mines} mines; only ${availableCells.length} cells are available`);
        }

        this.shuffleArray(availableCells);
        for (let index = 0; index < config.mines; index++) {
            const [row, col] = availableCells[index];
            board[row][col] = new MineLogicCell();
        }
        return config.mines;
    }

    static getAvailableCells(board, rows, cols, safeZone) {
        const availableCells = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = board[row][col];
                if (!safeZone.has(`${row},${col}`) &&
                    !cell.isMine && !cell.isEnemy && !cell.isWall &&
                    !cell.isTreasure && !cell.isStairs) {
                    availableCells.push([row, col]);
                }
            }
        }
        return availableCells;
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
