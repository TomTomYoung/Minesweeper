// Cell.js - ゲームのセルを表すクラス
class Cell extends Phaser.GameObjects.Container {
    constructor(scene, x, y, size, row, col) {
        super(scene, x, y);
        scene.add.existing(this);

        // セルの位置情報（ボード上の行と列）
        this.boardRow = row;
        this.boardCol = col;
        this.size = size;

        // セルの状態
        this.revealed = false;
        this.flagged = false;
        this.type = 'normal'; // normal, mine, wall, treasure, stairs
        this.cellState = 0; // 0=hidden, 1=revealed, 2=interacted

        // 表示要素の作成
        this.createVisuals();

        // 操作可能に設定
        this.setInteractive(new Phaser.Geom.Rectangle(0, 0, size, size), Phaser.Geom.Rectangle.Contains);

        // イベントリスナーを設定
        this.setupEvents();
    }

    // 視覚要素を作成
    createVisuals() {
        // 背景
        this.background = this.scene.add.rectangle(0, 0, this.size, this.size, GAME_CONFIG.CELL_COLORS.DEFAULT, 1)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0xececec);

        // テキスト（隣接地雷数など）
        this.text = this.scene.add.text(this.size / 2, this.size / 2, '', {
            fontSize: Math.floor(this.size * 0.6) + 'px',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        this.tile = this.scene.add.image(this.size / 2, this.size / 2, 'tile_hidden');
        AssetPresentation.fit(this.tile, this.size);
        this.icon = this.scene.add.sprite(this.size / 2, this.size / 2, 'dummy').setVisible(false);
        AssetPresentation.fit(this.icon, this.size * 0.92);

        // 要素を追加
        this.add([this.background, this.tile, this.text, this.icon]);
    }

    // イベントリスナーを設定
    setupEvents() {
        // 左クリック
        this.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown() || pointer.middleButtonDown()) return; // 右クリック・ホイールクリックの場合は処理しない

            // カスタムイベントを発火
            this.emit('cellClicked', this);
        });

        // 右クリック
        this.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {

                // コンテキストメニューを抑制
                //pointer.event.preventDefault();

                // カスタムイベントを発火
                this.emit('cellRightClicked', this);
            }
        });
    }

    // セルを開く
    reveal(value = null) {
        if (this.revealed || this.flagged) return;

        this.revealed = true;
        if (this.tile) this.tile.setVisible(false);

        // Call a method that subclasses can override
        this.renderReveal(value);
    }

    // 旗を設定/解除
    toggleFlag() {
        if (this.revealed) return;

        this.flagged = !this.flagged;

        if (this.flagged) {
            this.setIconTexture('flag');
            this.icon.setVisible(true);
        } else {
            this.icon.setVisible(false);
        }
    }

    setIconTexture(key) {
        this.icon.setTexture(key);
        AssetPresentation.fit(this.icon, this.size * 0.92);
    }

    setStatusBadge(key) {
        if (!this.statusBadge) {
            this.statusBadge = this.scene.add.image(this.size * 0.8, this.size * 0.8, key);
            this.add(this.statusBadge);
        }
        this.statusBadge.setTexture(key).setVisible(this.revealed);
        AssetPresentation.fit(this.statusBadge, this.size * 0.38);
    }

    // セルのタイプを設定
    setType(type) {
        this.type = type;
    }

    // セルの状態を更新
    updateState(state) {
        const flagged = !!state.isFlagged && !state.isRevealed;
        if (this.flagged !== flagged) {
            this.flagged = flagged;
            this.icon.setVisible(flagged);
            if (flagged && this.icon.setTexture) this.setIconTexture('flag');
        }
        if (state.viewType) this.setType(state.viewType);
        if (state.isRevealed && !this.revealed) this.reveal(state.neighborMines);
        if (state.state !== undefined && this.cellState !== state.state) {
            this.cellState = state.state;
            this.renderStateUpdate(state);
        }
    }

    // デフォルトの開示時の視覚効果（通常セル）
    // サブクラスでオーバーライドして特有の表現を実装する
    renderReveal(value) {
        this.background.setFillStyle(GAME_CONFIG.CELL_COLORS.REVEALED);
        this.background.setStrokeStyle(1, 0xa9a9a9);

        // 数字を表示（value が数値の場合）
        if (value !== null && value > 0) {
            this.text.setText(value.toString());
            this.text.setColor('#' + GAME_CONFIG.NUMBER_COLORS[value].toString(16).padStart(6, '0'));
            this.text.setVisible(true);
        }
    }

    // 状態更新時の視覚効果
    // サブクラスでオーバーライド可能
    renderStateUpdate(state) {
        // デフォルトでは何もしない
    }
}
