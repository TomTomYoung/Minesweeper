const fs = require('fs');
const BoardModelText = fs.readFileSync('src/logic/BoardModel.js', 'utf8');
const code = BoardModelText + `

const boardData = [];
for(let i=0; i<5; i++){
    boardData[i] = [];
    for(let j=0; j<5; j++){
        boardData[i][j] = {
            isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0, state: 0, isWall: false, isEnemy: false, isStairs: false, isTreasure: false
        };
    }
}
const model = new BoardModel(boardData);
model.reveal(2, 2);
let revealed = [];
for(let i=0; i<5; i++){
    for(let j=0; j<5; j++){
        if(model.board[i][j].isRevealed) revealed.push(\`\${i},\${j}\`);
    }
}
console.log("Revealed:", revealed.length);
`;
fs.writeFileSync('test_run.js', code);
