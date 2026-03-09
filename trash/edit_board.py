import pathlib
p = pathlib.Path('src/objects/Board.js')
text = p.read_text(encoding='utf-8', errors='ignore')

old1 = '        // 古ぁEルを削除'
old2 = '        // 新しいセルを作E'
old3 = '        // セルをEードに追加'
old4 = '        // セルのイベントをボEドに伝播'
old5 = '    // 階段セルをアクチEEEブに'
old6 = '    // 敵の危険地帯を描画EEE現状はクリアのみEEEE'
old7 = '        // 忁EEEに応じてここに描画ロジチEEEを追加'
old8 = '        // 侁E Debugモードでのみ表示するなど'

text = text.replace(old1, '        // 古いセルを削除')
text = text.replace(old2, '        // 新しいセルを作成')
text = text.replace(old3, '        // セルをボードに追加')
text = text.replace(old4, '        // セルのイベントをボードに伝播')
text = text.replace(old5, '    // 階段セルをアクティブに')
text = text.replace(old6, '    // 敵の危険地帯を描画')
text = text.replace(old7, '        // 必要に応じてここに描画ロジックを追加')
text = text.replace(old8, '        // 例: Debugモードでのみ表示するなど')

old_blocks = [
'''        // Logic cells and UI cells share names (WallCell, MineCell, etc.).
        // Because of the script load order, the UI cells (src/objects/special/) define WallCell,
        // and then logic cells (src/logic/cells/) redefine WallCell as a plain JS class.
        // Therefore, `new WallCell(this.scene, ...)` fails because the logic WallCell expects no arguments 
        // and doesn't extend Phaser.GameObjects.Container (thus reading 'sys' of undefined scene).

        // To fix this quickly without renaming all logic or UI classes, we can explicitly instantiate the View classes 
        // if we rename the Logic classes. But since we already wrote the UI classes as MineCell, we need to rename the logic classes.
''',
'''        // !WARNING: This uses the global Phaser cell classes (e.g., window.WallCell if available, or just assumes they are loaded).
        // Since we introduced Logic cells with the EXACT SAME NAMES (WallCell, MineCell, etc.), 
        // there is a namespace collision. The logic cells in src/logic/cells/ overwritten the Phaser UI cells in src/objects/special/.

        let newCell;
'''
]

for block in old_blocks:
    text = text.replace(block, '')

insert_idx = text.find('        // セルをボードに追加\n        this.add(newCell);\n        this.cells[row][col] = newCell;')

new_block = '''        let newCell;

        if (cellData instanceof WallLogicCell) {
            newCell = new WallCell(this.scene, x, y, this.cellSize, row, col);
            if (cellData.wallClusterId) {
                newCell.setClusterId(cellData.wallClusterId);
            }
        } else if (cellData instanceof MineLogicCell) {
            newCell = new MineCell(this.scene, x, y, this.cellSize, row, col);
        } else if (cellData instanceof EnemyLogicCell) {
            newCell = new EnemyCell(this.scene, x, y, this.cellSize, row, col);
        } else if (cellData instanceof TreasureLogicCell) {
            newCell = new TreasureCell(this.scene, x, y, this.cellSize, row, col);
        } else if (cellData instanceof StairsLogicCell) {
            newCell = new StairsCell(this.scene, x, y, this.cellSize, row, col);
        } else {
            newCell = new Cell(this.scene, x, y, this.cellSize, row, col);
        }

'''
text = text[:insert_idx] + new_block + text[insert_idx:]
p.write_text(text, encoding='utf-8')
print("Successfully replaced.")
