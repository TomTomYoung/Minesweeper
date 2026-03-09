import pathlib

p = pathlib.Path('src/objects/Board.js')
text = p.read_text(encoding='utf-8', errors='ignore')
lines = text.split('\n')

new_lines = []
skip = False

for i, line in enumerate(lines):
    if '    // セルを置き換える' in line:
        # Re-write the replaceCell function manually from here to the end of the block
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
    
    if skip and '    // 階段セルを' in line:
        skip = False

    if not skip:
        # fix the other broken comments along the way just in case
        if '        // 通常のセルを作' in line:
            new_lines.append('        // 通常のセルを作成')
        elif '                // 新しいセルを作' in line:
            new_lines.append('                // 新しいセルを作成（タイプに応じて）')
        elif '    // セルの種類を更新' in line:
            new_lines.append('    // セルの種類を更新（壁、地雷、お宝、階段など）')
        elif '        // セルの種類を適' in line:
            new_lines.append('        // セルの種類を適切に設定')
        elif '    // セルクリ' in line:
            new_lines.append('    // セルクリックイベントのハンドラー')
        elif '    // セル右クリ' in line:
            new_lines.append('    // セル右クリックイベントのハンドラー')
        elif '    // 特定' in line and 'セルのUI状態を更新' in line:
            new_lines.append('    // 特定のセルのUI状態を更新')
        elif '        // セルのタイプが変わる場合' in line:
            new_lines.append('        // セルのタイプが変わる場合は置き換える')
        elif '    // 敵の危険地帯を描画' in line:
            new_lines.append('    // 敵の危険地帯を描画（現状はクリアのみ）')
        elif '        // ' in line and 'に応じてここに描画ロジ' in line:
            new_lines.append('        // 必要に応じてここに描画ロジックを追加')
        elif '        // ' in line and 'Debugモードでのみ表示するなど' in line:
            new_lines.append('        // 例: Debugモードでのみ表示するなど')
        elif '        // ボ' in line and 'ドを再作' in line:
            new_lines.append('        // ボードを再作成')
        else:
            new_lines.append(line.replace('E', '').replace('', '').replace('E', '')) # scrub remaining junk

p.write_text('\n'.join(new_lines), encoding='utf-8')
print("Successfully replaced.")
