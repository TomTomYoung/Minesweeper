// GameScene.js - ゲームのメインロジックを管理するシーン
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // ゲームセッションの初期化
        this.initGameSession();

        // スクロールコーディネーターの初期化
        this.scrollCoordinator = new ScrollCoordinator();

        // カメラコントローラーの初期化
        this.cameraController = new CameraController(this, this.cameras.main, this.scrollCoordinator);

        // ゲームボードの作成
        this.createGameBoard(this.session.config.rows, this.session.config.cols, this.session.config.cellSize);

        // 入力イベントの設定
        this.setupInput();

        // UIの初期更新
        this.updateUI();

        // メッセージ表示 (2周目以降など)
        if (this.session.level > 1) {
            this.game.events.emit('showMessage', {
                text: `レベル ${this.session.level} スタート！`,
                color: '#0000ff',
                duration: 3000
            });
        }
        // 他のシーンからのイベントをリッスン
        this.game.events.on('zoomUpdate', this.setZoom, this);
        this.game.events.on('scrollRequest', this.handleScrollRequest, this);
        this.game.events.on('blockInput', () => { this.cameraController.setLock(true); });
        this.game.events.on('unblockInput', () => { this.cameraController.setLock(false); });

        // Controllerからのイベント
        this.events.on('cameraMoved', () => this.updateScrollInfo());

        // カメラ操作の設定 (背景ゾーン作成と割り当て)
        this.setupCameraInputZone();

        // 初期スクロール情報の送信
        this.time.delayedCall(100, () => this.updateScrollInfo());

        // --- デバッグ機能 ---
        this.debugMode = true; // 初期状態で有効化（不要ならfalseへ）
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(9999);
        this.input.keyboard.on('keydown-D', () => {
            this.debugMode = !this.debugMode;
            this.debugGraphics.clear();
            console.log('Debug Mode:', this.debugMode);
            this.updateScrollInfo();
        });
    }

    update(time, delta) {
        // タイマー更新 (Sessionに委譲)
        if (this.session.updateTimer(delta)) {
            this.updateUI();
        }
    }

    // ゲームセッションの初期化
    initGameSession() {
        // 現在の設定を取得
        const globalGameData = this.game.gameData;
        const config = globalGameData.gameConfig.getCurrentConfig();
        const level = globalGameData.level || 1;
        const adjustedConfig = globalGameData.gameConfig.adjustForLevel(level);

        // 必要なら cell size デフォルト値など
        if (!adjustedConfig.cellSize) adjustedConfig.cellSize = 40;

        // Sessionの作成
        this.session = new GameSession(
            adjustedConfig,
            level,
            globalGameData.score,
            globalGameData.totalScore
        );

        // 空のボードで開始 (最初のクリック待ち状態)
        this.session.start();

        // View用ボードデータ参照
        this.boardData = this.session.boardData;
    }

    // ゲームボードの作成
    createGameBoard(rows, cols, cellSize) {
        // ゲームボードのコンテナを作成
        this.boardContainer = this.add.container(0, 0);

        // ボードのサイズ計算
        const boardWidth = cols * cellSize;
        const boardHeight = rows * cellSize;

        // ボードの位置（中央揃え）
        const boardX = (this.cameras.main.width - boardWidth) / 2;
        const boardY = 70; // 上部UIの下

        // ボード背景
        const boardBg = this.add.rectangle(
            boardX + boardWidth / 2,
            boardY + boardHeight / 2,
            boardWidth + 10,
            boardHeight + 10,
            0xbdbdbd
        ).setStrokeStyle(3, 0x7b7b7b);
        this.boardContainer.add(boardBg);

        // Board クラスのインスタンスを作成
        this.board = new Board(
            this,
            boardX,
            boardY,
            rows,
            cols,
            cellSize
        );

        // 初期ボードデータは設定済み(全部空など)
    }

    // 入力イベントの設定
    setupInput() {
        // セルのクリックイベントをリッスン
        this.board.on('cellClicked', this.handleCellClick, this);
        this.board.on('cellRightClicked', this.handleCellRightClick, this);
    }

    // セルがクリックされたときの処理
    handleCellClick(cell) {
        const row = cell.boardRow;
        const col = cell.boardCol;

        // セッション・ロジックに委譲
        const result = this.session.handleCellClick(row, col);

        // ボードが更新された場合（初回クリック後など）、再描画が必要な場合がある
        // 特に初回クリックでボードが生成された直後は、セルタイプを更新する必要がある
        // Sessionの `isFirstClick` が false になっていて、かつ View のボードがまだ初期状態なら更新
        // ... ただ、Session側でボードオブジェクト自体が差し替わるわけではなく、中身が書き換わっているはず。
        // BoardGenerator.generate は新しい配列を返すが...
        // GameSession.start(firstClick) で this.boardData が再代入されている。

        // ここが重要： GameSession で boardData が新しくなった場合、Viewもそれを知る必要がある。
        // 毎回 cellClick 後に boardData を確認して更新かけるか、
        // Sessionから「ボード生成された」イベントをもらうか。

        // 簡易的に、SessionのboardDataが変わっていたらViewに反映する仕組みにする
        if (this.boardData !== this.session.boardData) {
            this.boardData = this.session.boardData;
            this.board.updateCellTypes(this.boardData); // 全セル再構築
        }

        this.processSessionResult(result);
    }

    // 右クリック時の処理（旗を立てる）
    handleCellRightClick(cell) {
        const row = cell.boardRow;
        const col = cell.boardCol;

        const result = this.session.handleCellRightClick(row, col);

        if (result.success) {
            this.board.updateCellUI(row, col, this.session.boardModel.getCell(row, col));
            this.updateUI();

            // 勝利チェック
            const winState = this.session.getWinState();
            if (winState.isWin) {
                // すでに processSessionResult で処理されているはずだが、
                // handleCellRightClick は _checkWinCondition を呼んで終了してしまうので
                // ここで明示的にイベント発行などをチェックしたいが、
                // Session側でイベントを返してもらうのが一番良い。
                // 修正: handleCellRightClick も result.event を返すように Session.js を微調整した方が良いが、
                // 今は一旦、変更後の状態確認で対処。
            }
            if (this.session.isGameOver && this.session.win) {
                this.gameOver(true, result.bonus || 0); // result.bonusが無いかもしれない
            }
        }
    }

    // Sessionからの結果を処理
    processSessionResult(result) {
        // イベント処理
        if (result.events && result.events.length > 0) {
            if (result.events.includes('GAME_OVER')) {
                this.gameOver(false);
            }
            if (result.events.includes('NEXT_LEVEL')) {
                this.goToNextLevel();
            }
        }

        // スコア加算イベントがあった場合 (Session内部で加算済みだが、演出用)
        if (result.scoreEvents) {
            for (const evt of result.scoreEvents) {
                if (evt.type === 'TREASURE') {
                    // お宝発見時の演出
                    this.game.events.emit('showMessage', {
                        text: `お宝を見つけました！ +${this.session.config.treasurePoints}点`,
                        color: '#ffd700',
                        duration: 2000
                    });
                    if (this.sound.get('treasure')) {
                        this.sound.play('treasure');
                    }
                }
            }
        }

        // 勝利イベント
        if (result.event === 'WIN') { // Session の checkWinCondition が返す想定
            // 注: checkWinCondition は内部メソッドだったが、handleCellClick がそれを呼ぶ形なら result に含めるべき
            // しかし今の GameSession.js は _checkWinCondition の戻り値を handleCellClick の戻り値にマージしていない可能性がある。
            // 補正: GameSession.js の修正が必要かもしれないが、
            // とりあえず this.session.getWinState() で確認
            const ws = this.session.getWinState();
            if (ws.isWin) {
                // ボーナスは Session 内で計算され score に加算済みだが、表示用に欲しい。
                // 簡易的にここでは表示だけ行うか...
                this.gameOver(true);
            }
        } else if (this.session.isGameOver && this.session.win) {
            this.gameOver(true);
        }

        // View更新
        this.updateBoardUI();
        this.updateUI();
    }

    // UIの更新
    updateUI() {
        // グローバルデータとの同期（他シーンへの伝達用）
        this.game.gameData.score = this.session.score;
        this.game.gameData.totalScore = this.session.totalScore;
        this.game.gameData.level = this.session.level;

        // UIシーンに更新イベントを送信
        this.game.events.emit('updateUI', {
            flagsLeft: this.session.flagsLeft,
            timer: this.session.timer,
            score: this.session.score,
            totalScore: this.session.totalScore
        });
    }

    // ボードUIの更新
    updateBoardUI() {
        for (let i = 0; i < this.session.config.rows; i++) {
            for (let j = 0; j < this.session.config.cols; j++) {
                this.board.updateCellUI(i, j, this.session.boardModel.getCell(i, j));
            }
        }
    }

    // 全ての地雷を表示
    revealAllMines() {
        this.session.boardModel.revealAllMines();
        this.updateBoardUI();
    }

    // 次のレベルへ進む
    goToNextLevel() {
        // メッセージを表示
        this.game.events.emit('showMessage', {
            text: '階段を見つけました！次のレベルへ…',
            color: '#9370db',
            duration: 1500
        });

        // レベルを増加 (Session内では increment してないかもしれないので手動で)
        // いや、start() で level を指定して new Session しているから、
        // gameData.level を上げて restart すればよい。

        this.game.gameData.level++;

        // 少し待ってから次のレベルを開始
        this.time.delayedCall(1500, () => {
            this.scene.restart();
        });
    }

    // ゲーム終了処理
    gameOver(isWin, bonusPointInfo = 0) {
        if (isWin) {
            // 勝利メッセージを表示
            // ボーナスポイントの計算ロジックが二重になっているので注意が必要。
            // Session内で計算済みなら、その差分を表示したいが...
            // 今回は「勝利！」とだけ出すか、Sessionからボーナス値を取得する getter があればベスト。
            // 簡略化して「ボーナスGET」と表示
            this.game.events.emit('showMessage', {
                text: `勝利！おめでとうございます！`,
                color: '#00aa00'
            });
        } else {
            // 全ての地雷を表示
            this.revealAllMines();

            // 敗北メッセージを表示
            this.game.events.emit('showMessage', {
                text: 'ゲームオーバー！',
                color: '#ff0000'
            });

            // 爆発音を再生
            if (this.sound.get('explosion')) {
                this.sound.play('explosion');
            }
        }
    }

    // ズーム値を設定
    setZoom(value) {
        this.cameraController.setZoom(value);
        // updateScrollInfoは cameraMoved イベント経由で呼ばれる
    }

    // カメラ操作用の入力ゾーン設定
    setupCameraInputZone() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 画面全体を覆う透明なゾーンを最背面に配置
        // Origin(0)で左上基準。ScrollFactor(0)でカメラ移動してもついてくる（＝画面固定）
        this.backgroundZone = this.add.zone(0, 0, width, height)
            .setOrigin(0)
            .setScrollFactor(0)
            .setInteractive()
            .setDepth(-9999);

        this.cameraController.setupPanInput(this.backgroundZone);
    }

    // スクロールバーからの操作を処理
    handleScrollRequest(data) {
        const bounds = this.getScrollBounds();

        if (data.axis === 'vertical') {
            const targetY = this.scrollCoordinator.calculateCameraPosition(data.value, 'vertical', this.cameras.main, bounds);
            this.cameras.main.scrollY = targetY;
        } else if (data.axis === 'horizontal') {
            const targetX = this.scrollCoordinator.calculateCameraPosition(data.value, 'horizontal', this.cameras.main, bounds);
            this.cameras.main.scrollX = targetX;
        }
        this.updateScrollInfo();
    }

    // スクロール情報の更新と送信
    updateScrollInfo() {
        if (!this.boardConfig && this.session && this.session.config) {
            this.boardConfig = {
                rows: this.session.config.rows,
                cols: this.session.config.cols,
                cellSize: this.session.config.cellSize
            };
        }

        // Bounds計算
        const bounds = this.getScrollBounds();

        // --- Visual Debug Draw ---
        if (this.debugMode && this.debugGraphics) {
            this.debugGraphics.clear();
            // Content Bounds (Red)
            this.debugGraphics.lineStyle(2, 0xff0000);
            this.debugGraphics.strokeRect(bounds.left, bounds.top, bounds.width, bounds.height);

            // Camera Viewport (Green)
            const cam = this.cameras.main;
            const viewX = cam.scrollX;
            const viewY = cam.scrollY;
            const viewW = cam.width / cam.zoom;
            const viewH = cam.height / cam.zoom;

            this.debugGraphics.lineStyle(2, 0x00ff00);
            this.debugGraphics.strokeRect(viewX, viewY, viewW, viewH);
        }
        const viewportW = this.cameras.main.width / this.cameras.main.zoom;
        const viewportH = this.cameras.main.height / this.cameras.main.zoom;

        // クランプ処理（行き過ぎ防止） - Coordinatorには任せずGameSceneの責任とする
        if (this.debugMode) console.groupCollapsed('GameScene: Clamp Trace');
        if (this.debugMode) console.log(`[Pre-Clamp] Scroll: ${this.cameras.main.scrollX.toFixed(1)}, ${this.cameras.main.scrollY.toFixed(1)}`);

        // 垂直
        if (bounds.height > viewportH) {
            const maxScrollY = bounds.top + bounds.height - viewportH;
            const oldY = this.cameras.main.scrollY;
            this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, bounds.top, maxScrollY);
            if (this.debugMode && oldY !== this.cameras.main.scrollY) {
                console.log(`[Clamp V] ${oldY.toFixed(1)} -> ${this.cameras.main.scrollY.toFixed(1)} (Range: ${bounds.top} ~ ${maxScrollY})`);
            }
        }
        // 水平
        if (bounds.width > viewportW) {
            const maxScrollX = bounds.left + bounds.width - viewportW;
            const oldX = this.cameras.main.scrollX;
            this.cameras.main.scrollX = Phaser.Math.Clamp(this.cameras.main.scrollX, bounds.left, maxScrollX);
            if (this.debugMode && oldX !== this.cameras.main.scrollX) {
                console.log(`[Clamp H] ${oldX.toFixed(1)} -> ${this.cameras.main.scrollX.toFixed(1)} (Range: ${bounds.left} ~ ${maxScrollX})`);
            }
        }

        if (this.debugMode) console.log(`[Post-Clamp] Scroll: ${this.cameras.main.scrollX.toFixed(1)}, ${this.cameras.main.scrollY.toFixed(1)}`);
        if (this.debugMode) console.groupEnd();

        // UI用データの計算を委譲
        const syncData = this.scrollCoordinator.calculateUISyncData(this.cameras.main, bounds);

        this.game.events.emit('updateScroll', syncData);
    }

    // コンテンツの矩形範囲を取得
    getScrollBounds() {
        const padding = 50;
        // ボードの位置情報が必要。GameSceneのcreateGameBoardで計算しているがプロパティ保存してない。
        // 再計算するか、setup時に保存するか。
        // createGameBoardで boardContainer.x/y は 0,0。
        // board.x/y は createGameBoard で入れた boardX, boardY。

        // 簡易的に再計算
        const rows = this.session.config.rows;
        const cols = this.session.config.cols;
        const cellSize = this.session.config.cellSize;
        const boardWidth = cols * cellSize;
        const boardHeight = rows * cellSize;

        // createGameBoardと同じロジック
        // const boardX = (this.cameras.main.width - boardWidth) / 2;
        // const boardY = 70;
        // この boardX は初期位置。

        // ボード本体の絶対座標範囲
        // boardX が画面外（マイナス）の可能性もある。
        const initialBoardX = (this.cameras.main.width - boardWidth) / 2;
        const initialBoardY = 70;

        return {
            left: initialBoardX - padding,
            top: initialBoardY - padding,
            width: boardWidth + padding * 2,
            height: boardHeight + padding * 2
        };
    }

    // ゲームの再スタート
    restartGame() {
        this.scene.restart();
    }
}