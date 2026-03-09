import pathlib

p = pathlib.Path('src/objects/Board.js')
text = p.read_text(encoding='utf-8', errors='ignore')
lines = text.split('\n')

new_lines = []
skip = False

for i, line in enumerate(lines):
    if '    replaceCell(row, col, cellData) {' in line:
        new_lines.append('    // セルを置き換える')
        new_lines.append('    replaceCell(row, col, cellData) {')
        new_lines.append('        const oldCell = this.cells[row][col];')
        new_lines.append('        const cellIndex = this.getAll().indexOf(oldCell);')
        new_lines.append('')
        new_lines.append('        // 古いセルを削除')
        new_lines.append('        if (cellIndex !== -1) {')
        new_lines.append('            this.removeAt(cellIndex, true);')
        new_lines.append('        }')
        new_lines.append('')
        new_lines.append('        // セルの位置')
        new_lines.append('        const x = col * this.cellSize;')
        new_lines.append('        const y = row * this.cellSize;')
        new_lines.append('')
        new_lines.append('        let newCell;')
        new_lines.append('')
        new_lines.append('        if (cellData instanceof WallLogicCell) {')
        new_lines.append('            newCell = new WallCell(this.scene, x, y, this.cellSize, row, col);')
        new_lines.append('            if (cellData.wallClusterId) {')
        new_lines.append('                newCell.setClusterId(cellData.wallClusterId);')
        new_lines.append('            }')
        new_lines.append('        } else if (cellData instanceof MineLogicCell) {')
        new_lines.append('            newCell = new MineCell(this.scene, x, y, this.cellSize, row, col);')
        new_lines.append('        } else if (cellData instanceof EnemyLogicCell) {')
        new_lines.append('            newCell = new EnemyCell(this.scene, x, y, this.cellSize, row, col);')
        new_lines.append('        } else if (cellData instanceof TreasureLogicCell) {')
        new_lines.append('            newCell = new TreasureCell(this.scene, x, y, this.cellSize, row, col);')
        new_lines.append('        } else if (cellData instanceof StairsLogicCell) {')
        new_lines.append('            newCell = new StairsCell(this.scene, x, y, this.cellSize, row, col);')
        new_lines.append('        } else {')
        new_lines.append('            newCell = new Cell(this.scene, x, y, this.cellSize, row, col);')
        new_lines.append('        }')
        new_lines.append('')
        new_lines.append('        // セルをボードに追加')
        new_lines.append('        this.add(newCell);')
        new_lines.append('        this.cells[row][col] = newCell;')
        new_lines.append('')
        new_lines.append('        // セルのイベントをボードに伝播')
        new_lines.append("        newCell.on('cellClicked', this.handleCellClick, this);")
        new_lines.append("        newCell.on('cellRightClicked', this.handleCellRightClick, this);")
        new_lines.append('')
        new_lines.append('        // セルの状態を更新')
        new_lines.append('        if (cellData.isRevealed) {')
        new_lines.append('            newCell.reveal(cellData.neighborMines);')
        new_lines.append('        }')
        new_lines.append('')
        new_lines.append('        if (cellData.isFlagged) {')
        new_lines.append('            newCell.toggleFlag();')
        new_lines.append('        }')
        new_lines.append('    }')
        skip = True
        continue
    
    if skip and '    activateStairs() {' in line:
        skip = False

    if not skip and '    // セルを置き換える' not in line:
        new_lines.append(line)

p.write_text('\n'.join(new_lines), encoding='utf-8')
print("Successfully replaced edit_board3.py.")
