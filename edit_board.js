const fs = require('fs');

const text = fs.readFileSync('src/objects/Board.js', 'utf8');
const lines = text.split(/\r?\n/);
const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('    replaceCell(row, col, cellData) {')) {
        newLines.push('    // セルを置き換える');
        newLines.push('    replaceCell(row, col, cellData) {');
        newLines.push('        const oldCell = this.cells[row][col];');
        newLines.push('        const cellIndex = this.getAll().indexOf(oldCell);');
        newLines.push('');
        newLines.push('        // 古いセルを削除');
        newLines.push('        if (cellIndex !== -1) {');
        newLines.push('            this.removeAt(cellIndex, true);');
        newLines.push('        }');
        newLines.push('');
        newLines.push('        // セルの位置');
        newLines.push('        const x = col * this.cellSize;');
        newLines.push('        const y = row * this.cellSize;');
        newLines.push('');
        newLines.push('        let newCell;');
        newLines.push('');
        newLines.push('        if (cellData instanceof WallLogicCell) {');
        newLines.push('            newCell = new WallCell(this.scene, x, y, this.cellSize, row, col);');
        newLines.push('            if (cellData.wallClusterId) {');
        newLines.push('                newCell.setClusterId(cellData.wallClusterId);');
        newLines.push('            }');
        newLines.push('        } else if (cellData instanceof MineLogicCell) {');
        newLines.push('            newCell = new MineCell(this.scene, x, y, this.cellSize, row, col);');
        newLines.push('        } else if (cellData instanceof EnemyLogicCell) {');
        newLines.push('            newCell = new EnemyCell(this.scene, x, y, this.cellSize, row, col);');
        newLines.push('        } else if (cellData instanceof TreasureLogicCell) {');
        newLines.push('            newCell = new TreasureCell(this.scene, x, y, this.cellSize, row, col);');
        newLines.push('        } else if (cellData instanceof StairsLogicCell) {');
        newLines.push('            newCell = new StairsCell(this.scene, x, y, this.cellSize, row, col);');
        newLines.push('        } else {');
        newLines.push('            newCell = new Cell(this.scene, x, y, this.cellSize, row, col);');
        newLines.push('        }');
        newLines.push('');
        newLines.push('        // セルをボードに追加');
        newLines.push('        this.add(newCell);');
        newLines.push('        this.cells[row][col] = newCell;');
        newLines.push('');
        newLines.push('        // セルのイベントをボードに伝播');
        newLines.push("        newCell.on('cellClicked', this.handleCellClick, this);");
        newLines.push("        newCell.on('cellRightClicked', this.handleCellRightClick, this);");
        newLines.push('');
        newLines.push('        // セルの状態を更新');
        newLines.push('        if (cellData.isRevealed) {');
        newLines.push('            newCell.reveal(cellData.neighborMines);');
        newLines.push('        }');
        newLines.push('');
        newLines.push('        if (cellData.isFlagged) {');
        newLines.push('            newCell.toggleFlag();');
        newLines.push('        }');
        newLines.push('    }');
        skip = true;
        continue;
    }

    if (skip && line.includes('    // 階段セルを')) {
        skip = false;
    }

    if (!skip && !line.includes('    // セルを置き換える')) {
        newLines.push(line);
    }
}

fs.writeFileSync('src/objects/Board.js', newLines.join('\n'), 'utf8');
console.log('Successfully replaced Board.js via Node.js.');
