/**
 * @fileoverview BoardGenerator.js
 * 
 * ゲーム盤面生成ロジック (Game Board Generator Logic)
 * 
 * マインスイーパーの盤面をプロシージャルに生成する静的クラスです。
 * 地雷、壁、お宝、階段の配置を専門のストラテジー（戦略クラス）に委譲して行います。
 */

class BoardGenerator {
    /**
     * 盤面データを生成する
     * @param {Object} config - GameConfigから取得した設定オブジェクト
     * @param {Object} firstClick - 初回クリック位置 {row, col}
     * @returns {Array<Array<Object>>} 生成された盤面データの2次元配列
     */
    static generate(config, firstClick) {
        // 1. 盤面の初期化（全セルをデフォルト状態で作成）
        const board = this.initBoardData(config.rows, config.cols);

        // 2. 安全地帯（Safe Zone）の確保
        // 初回クリック位置とその周囲は地雷などを配置しない
        const safeZone = this.getSafeZone(config.rows, config.cols, firstClick.row, firstClick.col);

        // 3. 地雷の配置 (MinePlacementStrategy)
        // ランダムに地雷を配置します。設定された地雷数(config.mines)配置されるまで繰り返します。
        MinePlacementStrategy.place(board, config, safeZone);

        // 4. お宝と階段の配置 (ItemPlacementStrategy)
        // RPGモード用。地雷がない安全な場所（クラスター）を見つけて配置します。
        // 通常モードでは0個なのでスキップされます。
        ItemPlacementStrategy.place(board, config, safeZone);

        // 5. エネミー（ボムセル）の配置 (EnemyPlacementStrategy)
        // RPGモード用。設定数(config.enemies)だけエネミーを配置します。通常モードでは0個なのでスキップされます。
        EnemyPlacementStrategy.place(board, config, safeZone);

        // Note: 壁（Wall）の配置は現在のパターン（RPGモード標準）では無効化されている、あるいは別ロジックで扱う想定
        // （config.wallClusters が 0 なら生成されない）

        // 6. 数字（隣接する地雷数）の計算
        // 盤面上の地雷・エネミー・壁をカウントして各セルに設定します。
        this.calculateNeighborMines(board, config.rows, config.cols);

        return board;
    }

    /**
     * 指定サイズで空の盤面データを初期化する
     */
    static initBoardData(rows, cols) {
        return Array(rows).fill().map(() =>
            Array(cols).fill().map(() => ({
                isMine: false,      // 地雷か
                isEnemy: false,     // エネミーか
                isWall: false,      // 壁か
                isTreasure: false,  // お宝か
                isStairs: false,    // 階段か
                isRevealed: false,  // 開けられたか
                isFlagged: false,   // 旗が立てられたか
                state: 0,           // 状態 (0:非表示, 1:表示, 2:アクション完了)
                treasureContent: null, // お宝の中身 ('gold', 'key', 'sword')
                neighborMines: 0,   // 隣接する危険セルの数
                wallClusterId: null // 壁クラスターID（壁の場合）
            }))
        );
    }

    /**
     * 初回クリック位置周囲の安全地帯（地雷を置かない場所）を取得する
     * 
     * ゲーム開始時の理不尽な即死を防ぐため、最初にクリックしたマスと
     * その周囲8マス（計9マス）を「安全地帯」として確保します。
     * 
     * @returns {Set<string>} 安全地帯の座標セット ("row,col"形式)
     */
    static getSafeZone(rows, cols, centerRow, centerCol) {
        const safeZone = new Set();

        // 初回クリック位置(centerRow, centerCol)を中心とした3x3の範囲をループします
        // Math.max/min を使うことで、盤面の端（0行目や最終行など）からはみ出さないように制御しています

        // 開始行: クリック位置の1つ上。ただし0より小さくならないようにする（盤面上端の対策）
        const startRow = Math.max(0, centerRow - 1);

        // 終了行: クリック位置の1つ下。ただし(rows-1)より大きくならないようにする（盤面下端の対策）
        const endRow = Math.min(rows - 1, centerRow + 1);

        // 列についても同様に、左右の端を超えない範囲を計算します
        const startCol = Math.max(0, centerCol - 1);
        const endCol = Math.min(cols - 1, centerCol + 1);

        // 計算した範囲（最大3x3マス）を走査
        for (let i = startRow; i <= endRow; i++) {
            for (let j = startCol; j <= endCol; j++) {
                // 安全地帯の座標を "行,列" という文字列形式で記録
                // Setを使うことで、重複なく座標を管理できます
                safeZone.add(`${i},${j}`);
            }
        }
        return safeZone;
    }

    /**
     * 全セルの隣接地雷数を計算して設定する
     */
    static calculateNeighborMines(board, rows, cols) {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                // 注意: 壁や敵などは数字の計算に含まれない。地雷のみをカウントするよう仕様変更
                if (!board[i][j].isMine && !board[i][j].isWall && !board[i][j].isEnemy) {
                    board[i][j].neighborMines = this.countNeighborMines(board, rows, cols, i, j);
                }
            }
        }
    }

    /**
     * 特定のセル周囲の地雷数をカウントする
     * （仕様書29行目・145行目：エネミーや壁自体は数字の計算に含まれない）
     * 
     * @param {Array<Array<Object>>} board - 盤面データ配列
     * @param {number} rows - グリッドの行数
     * @param {number} cols - グリッドの列数
     * @param {number} row - 対象セルの行インデックス
     * @param {number} col - 対象セルの列インデックス
     * @returns {number} 周囲8マスの地雷の合計数
     */
    static countNeighborMines(board, rows, cols, row, col) {
        let count = 0;
        for (let i = Math.max(0, row - 1); i <= Math.min(rows - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(cols - 1, col + 1); j++) {
                // 自分自身はカウントしない
                if (i === row && j === col) continue;

                const cell = board[i][j];
                // 地雷のみカウント
                if (cell.isMine) {
                    count++;
                }
            }
        }
        return count;
    }
}
