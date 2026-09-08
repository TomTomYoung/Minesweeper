/** Strategy for placing enemies on unoccupied cells outside the safe zone. */
class EnemyPlacementStrategy {
    static place(board, config, safeZone) {
        const requestedEnemies = config.enemies || 0;
        const availableCells = [];

        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                const cell = board[row][col];
                if (!safeZone.has(`${row},${col}`) &&
                    !cell.isMine && !cell.isEnemy && !cell.isWall &&
                    !cell.isTreasure && !cell.isStairs) {
                    availableCells.push([row, col]);
                }
            }
        }

        if (availableCells.length < requestedEnemies) {
            throw new RangeError(`Cannot place ${requestedEnemies} enemies; only ${availableCells.length} cells are available`);
        }

        this.shuffleArray(availableCells);
        for (let index = 0; index < requestedEnemies; index++) {
            const [row, col] = availableCells[index];
            board[row][col] = new EnemyLogicCell();
        }
        return requestedEnemies;
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
