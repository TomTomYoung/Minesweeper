import pathlib
p = pathlib.Path('src/objects/Board.js')
text = p.read_text(encoding='utf-8', errors='ignore')
old = '''        // To fix this quickly without renaming all logic or UI classes, we can explicitly instantiate the View classes 
        // if we rename the Logic classes. But since we already wrote the UI classes as MineCell, we need to rename the logic classes.

        // セルをEードに追加'''
new = '''        // To fix this quickly without renaming all logic or UI classes, we can explicitly instantiate the View classes 
        // if we rename the Logic classes. But since we already wrote the UI classes as MineCell, we need to rename the logic classes.

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

        // セルをボEドに追加'''
if old in text:
    p.write_text(text.replace(old, new), encoding='utf-8')
    print("Replaced!")
else:
    print("String not found!")
