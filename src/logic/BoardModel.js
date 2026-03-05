/**
 * @fileoverview BoardModel.js
 * 
 * Game Board State Model.
 * 
 * This class encapsulates the state and logic of the Minesweeper board.
 * It manages the grid of cells, handles cell revealing logic (including recursion),
 * manages flags, and provides state queries (e.g., neighbor mine counts).
 * 
 * It is a pure logic class and does not directly interact with the Phaser UI.
 * Start/End of game states are reported back via return values.
 * 
 * Input:
 * - Initialized board data array (from BoardGenerator).
 * 
 * Output:
 * - Result objects containing events ('GAME_OVER', 'TREASURE', etc.) and state updates.
 */

class BoardModel {
    /**
     * @param {Array<Array<Object>>} boardData - BoardGeneratorで生成されたボードデータ
     */
    constructor(boardData) {
        this.board = boardData;
        this.rows = boardData.length;
        this.cols = boardData[0].length;
    }

    /**
     * セルの状態を進める（クリックやインタラクト）
     * 状態: 0=隠蔽、1=表示、2=アクション完了
     */
    advanceState(row, col, options = {}) {
        const cell = this.board[row][col];
        if (cell.isFlagged) return { events: [], scoreEvents: [] };

        if (!cell.isRevealed) {
            return this.reveal(row, col, options);
        } else {
            const result = { events: [], scoreEvents: [] };

            if (cell.state === 1) {
                if (cell.isTreasure) {
                    cell.state = 2;
                    result.events.push('CELL_UPDATED');

                    if (cell.treasureContent === 'gold') {
                        result.scoreEvents.push({ type: 'TREASURE_GOLD' });
                    } else if (cell.treasureContent === 'key') {
                        result.events.push('ITEM_KEY');
                    } else if (cell.treasureContent === 'sword') {
                        result.events.push('ITEM_SWORD');
                    }
                } else if (cell.isStairs) {
                    result.events.push('STAIRS_INTERACTED');
                } else if (!cell.isWall && !cell.isMine && !cell.isEnemy) {
                    return this.expandRevealedNumberCell(row, col);
                }
            } else if (cell.state === 2) {
                // 既に状態2の場合は数字展開等（お宝などに数字がある場合等を想定）
                if (!cell.isWall && !cell.isMine && !cell.isEnemy && !cell.isTreasure && !cell.isStairs) {
                    return this.expandRevealedNumberCell(row, col);
                }
            } else {
                // fallback for traditional mode (if state was not updated)
                if (!cell.isWall && !cell.isMine && !cell.isTreasure && !cell.isStairs && !cell.isEnemy) {
                    return this.expandRevealedNumberCell(row, col);
                }
            }

            return result;
        }
    }

    /**
     * 指定されたセルを取得
     */
    getCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.board[row][col];
        }
        return null;
    }

    /**
     * 旗の切り替え
     * @param {number} row 
     * @param {number} col 
     * @param {number} flagsLeft - 残りの旗の数
     * @returns {Object} 結果 { success: boolean, flagsDelta: number }
     */
    toggleFlag(row, col, flagsLeft) {
        const cell = this.board[row][col];

        if (cell.isRevealed) {
            return { success: false, flagsDelta: 0 };
        }

        if (cell.isFlagged) {
            cell.isFlagged = false;
            return { success: true, flagsDelta: 1 };
        } else {
            if (flagsLeft <= 0) {
                return { success: false, flagsDelta: 0 };
            }
            cell.isFlagged = true;
            return { success: true, flagsDelta: -1 };
        }
    }

    /**
     * セルを開く
     * @param {number} row 
     * @param {number} col 
     * @param {Object} options - オプション
     * @param {boolean} options.autoRevealWallCluster - 壁クラスターの一括オープン有無
     * @returns {Object} 結果レポート { events: Array<string>, scoreInfo: Array<Object> }
     */
    reveal(row, col, options = {}) {
        const result = {
            events: [], // 'GAME_OVER', 'WIN', etc.
            scoreEvents: [] // { type: 'TREASURE', points: 100 }
        };

        const cell = this.board[row][col];

        // 既に開かれているか、旗が立っている場合は何もしない
        if (cell.isRevealed || cell.isFlagged) return result;

        // 壁の場合は壁面クラスターを開く
        if (cell.isWall) {
            this.revealWallCluster(row, col, options.autoRevealWallCluster);
            return result;
        }

        // 幅優先探索（BFS）による自動オープン処理
        const queue = [[row, col]];
        const visited = new Set();
        visited.add(`${row},${col}`);

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            const currentCell = this.board[r][c];

            // すでに開かれているか旗が立っているならスキップ
            if (currentCell.isRevealed || currentCell.isFlagged) continue;

            currentCell.isRevealed = true;
            currentCell.state = 1;

            // 地雷を踏んだ場合
            if (currentCell.isMine) {
                result.events.push('GAME_OVER');
                return result; // 即時終了
            }

            // エネミーを倒した場合
            if (currentCell.isEnemy) {
                result.events.push('ENEMY_DEFEATED');
                // エネミーは数字を持たないが、周囲の数字には貢献している。
                // 倒したからといって消えるわけではない（isRevealedになるだけ）。
                // 自動展開はしない（通常の数字展開に任せる）。
            }

            // お宝を見つけた場合 (第一段階ではスコアを与えません)

            // 階段の場合
            if (currentCell.isStairs) {
                // ここではイベントを記録せず、UI側でcell状態を見て判断でも良いが、わかりやすくイベント追加
                // ただしBFSは続く
            }

            // 周囲８方向のうち、数字が0なら隣接セルを展開
            // 仕様上、自動オープンは被覆セル（壁・特殊セル）を判定に使わず
            // ベースセル情報（neighborMines / isMine）のみで連鎖させる。
            if (currentCell.neighborMines === 0) {
                for (let i = Math.max(0, r - 1); i <= Math.min(this.rows - 1, r + 1); i++) {
                    for (let j = Math.max(0, c - 1); j <= Math.min(this.cols - 1, c + 1); j++) {
                        if (i === r && j === c) continue;
                        const key = `${i},${j}`;
                        if (!visited.has(key)) {
                            const neighbor = this.board[i][j];
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

    /**
     * 開かれたセルの周囲を展開 (ダブルクリック/数字クリック機能)
     */
    expandRevealedNumberCell(row, col) {
        const cell = this.board[row][col];
        const result = { events: [], scoreEvents: [] };

        // 開かれた数字セルのみ処理
        if (!cell.isRevealed || cell.neighborMines === 0) return result;

        // 周囲の旗の数をカウント
        let flagCount = 0;
        const neighbors = [];

        for (let i = Math.max(0, row - 1); i <= Math.min(this.rows - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(this.cols - 1, col + 1); j++) {
                if (i === row && j === col) continue;

                const neighbor = this.board[i][j];
                if (neighbor.isFlagged) {
                    flagCount++;
                } else if (!neighbor.isRevealed && !neighbor.isWall) {
                    neighbors.push([i, j]);
                }
            }
        }

        // 周囲の旗の数が隣接地雷数と一致する場合、残りの未開示セルを開く
        if (flagCount === cell.neighborMines) {
            for (const [r, c] of neighbors) {
                const subResult = this.reveal(r, c);
                // 結果をマージ
                result.events.push(...subResult.events);
                result.scoreEvents.push(...subResult.scoreEvents);
                if (subResult.events.includes('GAME_OVER')) break;
            }
        }

        return result;
    }

    /**
     * 壁面クラスター全体を開く
     * @param {number} row 
     * @param {number} col 
     * @param {boolean} autoReveal - 自動オープンの設定
     */
    revealWallCluster(row, col, autoReveal) {
        const cell = this.board[row][col];
        if (!cell.isWall) return; // 壁でない場合は何もしない

        const clusterId = cell.wallClusterId;

        if (autoReveal) {
            // クラスターIDが同じ壁を一斉に開く
            // 注: wallClusterMapを持っていないので全探索する必要がある。
            // 効率化のためmapを渡すか、Generatorで作ったものを保持するのが良いが、
            // ここではシンプルに全探索する (サイズが大きくないので許容範囲)
            if (clusterId) {
                for (let i = 0; i < this.rows; i++) {
                    for (let j = 0; j < this.cols; j++) {
                        const target = this.board[i][j];
                        if (target.isWall && target.wallClusterId === clusterId && !target.isRevealed) {
                            target.isRevealed = true;
                            target.state = 1;
                        }
                    }
                }
            }
        } else {
            // 手動モード
            if (!cell.isRevealed) {
                cell.isRevealed = true;
                cell.state = 1;
            } else {
                // すでに開かれているセルをクリックした場合、4近傍を開く
                const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                for (const [dr, dc] of directions) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                        const neighbor = this.board[newRow][newCol];
                        if (neighbor.isWall && neighbor.wallClusterId === clusterId && !neighbor.isRevealed) {
                            neighbor.isRevealed = true;
                            neighbor.state = 1;
                        }
                    }
                }
            }
        }
    }

    /**
     * 全てのセルを表示 (ゲームオーバー時)
     */
    revealAll() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j].isRevealed = true;
                this.board[i][j].state = 1;
            }
        }
    }
}
