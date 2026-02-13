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

        // // アイコン（地雷、旗など）
        // this.icon = this.scene.add.sprite(this.size / 2, this.size / 2, 'mine')
        //     .setScale(Math.min(1, this.size / 40)) // アイコンのサイズを調整
        //     .setVisible(false);

        // // アイコン（地雷、旗など）
        // this.icon = this.scene.add.sprite(this.size / 2, this.size / 2, 'mine')
        //     .setVisible(false);

        // // 画像が読み込まれた後にサイズを調整
        // this.scene.textures.once(`textureready-${this.icon.texture.key}`, () => {
        //     const frame = this.icon.frame;
        //     const imageWidth = frame.width;
        //     const imageHeight = frame.height;

        //     // セルの80%のサイズになるよう調整（正方形でない画像にも対応）
        //     const scaleX = (this.size * 0.8) / imageWidth;
        //     const scaleY = (this.size * 0.8) / imageHeight;

        //     // 縦横比を維持するため、小さいほうのスケールを使用
        //     const scale = Math.min(scaleX, scaleY);

        //     this.icon.setScale(scale);
        // });            

        // アイコン（地雷、旗など）
        // アイコン（地雷、旗など）
        const iconKey = 'mine';
        if (this.scene.textures.exists(iconKey)) {
            this.icon = this.scene.add.sprite(this.size / 2, this.size / 2, iconKey)
                .setVisible(false);
        } else {
            // テクスチャがない場合のフォールバック（矩形など）
            console.warn(`Texture '${iconKey}' not found. Using fallback.`);
            this.icon = this.scene.add.rectangle(this.size / 2, this.size / 2, this.size * 0.6, this.size * 0.6, 0xff0000)
                .setVisible(false);
        }

        // サイズを調整
        this.icon.setDisplaySize(this.size * 0.8, this.size * 0.8);

        // 要素を追加
        this.add([this.background, this.text, this.icon]);
    }

    // イベントリスナーを設定
    setupEvents() {
        // 左クリック
        this.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown() || pointer.middleButtonDown()) return; // 右クリック・ホイールクリックの場合は処理しない

            // クリック効果音を再生
            if (this.scene.audio) {
                this.scene.audio.playSfx('click');
            }

            // カスタムイベントを発火
            this.emit('cellClicked', this);
        });

        // 右クリック
        this.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {

                // コンテキストメニューを抑制
                //pointer.event.preventDefault();

                // クリック効果音を再生
                if (this.scene.audio) {
                    this.scene.audio.playSfx('click');
                }

                // カスタムイベントを発火
                this.emit('cellRightClicked', this);
            }
        });
    }

    // セルを開く
    reveal(value = null) {
        if (this.revealed || this.flagged) return;

        this.revealed = true;

        // タイプに応じた視覚効果を設定
        switch (this.type) {
            case 'mine':
                this.background.setFillStyle(GAME_CONFIG.CELL_COLORS.MINE);
                this.icon.setTexture('mine');
                this.icon.setVisible(true);
                break;

            case 'wall':
                this.background.setFillStyle(GAME_CONFIG.CELL_COLORS.WALL);
                break;

            case 'treasure':
                this.background.setFillStyle(GAME_CONFIG.CELL_COLORS.TREASURE);
                this.icon.setTexture('treasure');
                this.icon.setVisible(true);
                break;

            case 'stairs':
                this.background.setFillStyle(GAME_CONFIG.CELL_COLORS.STAIRS);
                this.icon.setTexture('stairs');
                this.icon.setVisible(true);
                break;

            default: // 通常セル
                this.background.setFillStyle(GAME_CONFIG.CELL_COLORS.REVEALED);
                this.background.setStrokeStyle(1, 0xa9a9a9);

                // 数字を表示（value が数値の場合）
                if (value !== null && value > 0) {
                    this.text.setText(value.toString());
                    this.text.setColor('#' + GAME_CONFIG.NUMBER_COLORS[value].toString(16).padStart(6, '0'));
                    this.text.setVisible(true);
                }
                break;
        }
    }

    // 旗を設定/解除
    toggleFlag() {
        if (this.revealed) return;

        this.flagged = !this.flagged;

        if (this.flagged) {
            this.icon.setTexture('flag');
            this.icon.setVisible(true);
        } else {
            this.icon.setVisible(false);
        }
    }

    // セルのタイプを設定
    setType(type) {
        this.type = type;
    }

    // セルの状態を更新
    updateState(state) {
        // 旗の状態を更新
        if (this.flagged !== state.isFlagged) {
            this.flagged = state.isFlagged;
            this.icon.setVisible(this.flagged);
            if (this.flagged) {
                this.icon.setTexture('flag');
            }
        }

        // 開示状態を更新
        if (!this.revealed && state.isRevealed) {
            // タイプを設定
            if (state.isMine) this.setType('mine');
            else if (state.isWall) this.setType('wall');
            else if (state.isTreasure) this.setType('treasure');
            else if (state.isStairs) this.setType('stairs');

            // 開示
            this.reveal(state.neighborMines);
        }
    }
}