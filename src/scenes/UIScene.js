// UIScene.js - ゲームUIを管理するシーン（GameSceneの上に重ねて表示）
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // UIの初期化
        this.initializeUI();

        // リサイズイベントの登録
        this.scale.on('resize', this.handleResize, this);

        // イベントリスナーの設定
        this.setupEventListeners();
    }

    handleResize(gameSize, baseSize, displaySize, resolution) {
        // カメラのサイズ更新はPhaserが自動で行うが、念のため確認
        this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);

        // UIの再構築
        // 既存のUIをクリア
        if (this.uiContainer) {
            this.uiContainer.removeAll(true);
        }

        // 以前の状態を保持（必要であれば）
        const oldZoom = this.currentZoom || 1.0;

        // 再作成
        this.initializeUI();

        // ズーム状態の復元 (Sliderの位置などを更新するため)
        this.updateZoom(0); // Delta 0 で更新すれば現在値で再描画される
    }

    initializeUI() {
        // UIコンテナを作成
        this.uiContainer = this.add.container(0, 0);

        // 上部パネル
        this.createTopPanel();

        // 下部コントロールパネル
        this.createControlPanel();

        // メッセージパネル
        this.createMessagePanel();
        // スクロールバー
        this.createScrollBars();
    }

    // 下部コントロールパネルの作成
    createControlPanel() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const panelHeight = 60;
        const panelY = height - panelHeight / 2;

        // パネル背景
        const panelBg = this.add.rectangle(width / 2, panelY, width, panelHeight, 0xf0f0f0)
            .setStrokeStyle(1, 0xdddddd);
        this.uiContainer.add(panelBg);

        // ボタンの作成（パネル内に配置）
        this.createButtons(panelY);

        // ズームコントロールの作成 (右側)
        this.createZoomControls(width - 200, panelY);
    }

    // ボタンの作成
    createButtons(panelY) {
        // 新しいゲームボタン (左側)
        this.createNewGameButton(80, panelY);

        // メニューに戻るボタン (さらに右)
        this.createMenuButton(210, panelY);
    }

    createTopPanel() {
        // 上部パネル背景
        const topPanelBg = this.add.rectangle(
            this.cameras.main.width / 2,
            25,
            this.cameras.main.width,
            50,
            0xf0f0f0
        ).setStrokeStyle(1, 0xdddddd);
        this.uiContainer.add(topPanelBg);

        // 情報アイテムの間隔と幅
        const itemWidth = 180;
        const spacing = 20;
        const totalItems = 4; // 旗、時間、スコア、総スコア
        const totalWidth = itemWidth * totalItems + spacing * (totalItems - 1);
        const startX = (this.cameras.main.width - totalWidth) / 2;

        // 旗（地雷）カウンター
        this.createInfoItem(
            startX + itemWidth / 2,
            25,
            '🚩 残り:',
            '10',
            'flagsLeft'
        );

        // タイマー
        this.createInfoItem(
            startX + itemWidth + spacing + itemWidth / 2,
            25,
            '⏱️ 時間:',
            '0',
            'timer'
        );

        // スコア
        this.createInfoItem(
            startX + (itemWidth + spacing) * 2 + itemWidth / 2,
            25,
            '💎 得点:',
            '0',
            'score'
        );

        // 総スコア
        this.createInfoItem(
            startX + (itemWidth + spacing) * 3 + itemWidth / 2,
            25,
            '🏆 総得点:',
            '0',
            'totalScore'
        );
    }

    createInfoItem(x, y, label, value, key) {
        const container = this.add.container(x, y);

        // 背景
        const bg = this.add.rectangle(0, 0, 170, 35, 0xdddddd, 0.7)
            .setStrokeStyle(1, 0xcccccc);

        // ラベル
        const labelText = this.add.text(-75, 0, label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#333'
        }).setOrigin(0, 0.5);

        // 値
        const valueText = this.add.text(30, 0, value, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#333'
        }).setOrigin(0, 0.5);

        container.add([bg, labelText, valueText]);
        this.uiContainer.add(container);

        // 参照を保存
        if (!this.uiElements) this.uiElements = {};
        this.uiElements[key] = valueText;
    }

    createMessagePanel() {
        // メッセージパネル（画面下部、コントロールパネルの上）
        const messageY = this.cameras.main.height - 80;

        this.messageText = this.add.text(
            this.cameras.main.width / 2,
            messageY,
            '',
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                fontWeight: 'bold',
                color: '#333'
            }
        ).setOrigin(0.5);

        this.uiContainer.add(this.messageText);
    }

    createNewGameButton(x, y) {
        const button = this.add.container(x, y);

        // 背景
        const bg = this.add.rectangle(0, 0, 120, 35, 0x4CAF50, 1)
            .setInteractive()
            .on('pointerdown', () => this.restartGame())
            .on('pointerover', () => bg.setFillStyle(0x45a049))
            .on('pointerout', () => bg.setFillStyle(0x4CAF50));

        // テキスト
        const text = this.add.text(0, 0, '新しいゲーム', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#fff'
        }).setOrigin(0.5);

        button.add([bg, text]);
        this.uiContainer.add(button);
    }

    createMenuButton(x, y) {
        const button = this.add.container(x, y);

        // 背景
        const bg = this.add.rectangle(0, 0, 120, 35, 0x2196F3, 1)
            .setInteractive()
            .on('pointerdown', () => this.returnToMenu())
            .on('pointerover', () => bg.setFillStyle(0x1976D2))
            .on('pointerout', () => bg.setFillStyle(0x2196F3));

        // テキスト
        const text = this.add.text(0, 0, 'メニューへ', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#fff'
        }).setOrigin(0.5);

        button.add([bg, text]);
        this.uiContainer.add(button);
    }

    // ズームコントロールの作成
    createZoomControls(centerX, y) {
        // コンテナ
        const container = this.add.container(0, 0);

        // ラベル
        const label = this.add.text(centerX - 100, y, 'Zoom:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#333'
        }).setOrigin(1, 0.5);

        // [-] ボタン
        const minusBtn = this.add.rectangle(centerX - 80, y, 30, 30, 0xdddddd)
            .setStrokeStyle(1, 0x999999)
            .setInteractive()
            .on('pointerdown', () => this.updateZoom(-0.25))
            .on('pointerover', () => minusBtn.setFillStyle(0xe0e0e0))
            .on('pointerout', () => minusBtn.setFillStyle(0xdddddd));

        const minusText = this.add.text(centerX - 80, y, '-', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#333',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // [+] ボタン
        const plusBtn = this.add.rectangle(centerX + 80, y, 30, 30, 0xdddddd)
            .setStrokeStyle(1, 0x999999)
            .setInteractive()
            .on('pointerdown', () => this.updateZoom(0.25))
            .on('pointerover', () => plusBtn.setFillStyle(0xe0e0e0))
            .on('pointerout', () => plusBtn.setFillStyle(0xdddddd));

        const plusText = this.add.text(centerX + 80, y, '+', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#333',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // スライダーバー背景
        const sliderBg = this.add.rectangle(centerX, y, 100, 4, 0xcccccc);

        // 現在のズーム値
        this.currentZoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 2.0; // 拡大縮小機能を実装

        // スライダーノブ
        this.sliderKnob = this.add.circle(centerX, y, 8, 0x2196F3)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ draggable: true });

        // ドラッグイベント
        this.sliderKnob.on('drag', (pointer, dragX, dragY) => {
            // 範囲制限
            const minX = centerX - 50;
            const maxX = centerX + 50;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);

            this.sliderKnob.x = clampedX;

            // ズーム値を計算 (0.0 - 1.0)
            const progress = (clampedX - minX) / 100;
            // map 0-1 to minZoom-maxZoom
            const newZoom = this.minZoom + (this.maxZoom - this.minZoom) * progress;

            this.setZoom(newZoom);
        });

        this.uiContainer.add([
            label,
            minusBtn, minusText,
            plusBtn, plusText,
            sliderBg,
            this.sliderKnob
        ]);

    }

    // スクロールバーの作成
    createScrollBars() {
        this.scrollBars = {};

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const barSize = 16; // 押しやすくするために太くする

        // --- 垂直スクロールバー (BarV) ---
        // (右端, topPanel下 ~ controlPanel上)
        const topY = 50; // topPanelHeight
        const bottomY = height - 60; // controlPanelHeight
        const vHeight = bottomY - topY;

        const barV = this.add.rectangle(width - barSize / 2, topY + vHeight / 2, barSize, vHeight, 0xaaaaaa, 0.3)
            .setInteractive();

        const thumbV = this.add.rectangle(width - barSize / 2, topY + 20, barSize, 40, 0x666666, 0.8)
            .setOrigin(0.5, 0) // Origin Top-Center
            .setInteractive({ draggable: true });

        // Input Blocking Logic for V
        const blockInput = () => this.game.events.emit('blockInput');
        const unblockInput = () => this.game.events.emit('unblockInput');

        barV.on('pointerdown', (pointer) => {
            console.log('[UIScene] BarV PointerDown');
            blockInput();
        });
        barV.on('pointerup', unblockInput);
        barV.on('pointerupoutside', unblockInput);

        thumbV.on('pointerdown', (pointer, localX, localY, event) => {
            console.log('[UIScene] ThumbV PointerDown');
            event.stopPropagation(); // Trackクリックとの干渉防止
            blockInput();
            thumbV.setFillStyle(0x444444, 0.8);
        });

        // Debug
        this.input.enableDebug(thumbV);
        this.input.enableDebug(barV);
        thumbV.on('pointerup', () => {
            unblockInput();
            thumbV.setFillStyle(0x666666, 0.8);
        });
        thumbV.on('pointerupoutside', () => {
            unblockInput();
            thumbV.setFillStyle(0x666666, 0.8);
        });

        this.scrollBars.v = { track: barV, thumb: thumbV, start: topY, size: vHeight };

        // --- 水平スクロールバー (BarH) ---
        // (左端 ~ 右端, controlPanelの上)
        const hY = height - 60 - barSize / 2;
        const hWidth = width; // フル幅

        const barH = this.add.rectangle(hWidth / 2, hY, hWidth, barSize, 0xaaaaaa, 0.3)
            .setInteractive();

        const thumbH = this.add.rectangle(40, hY, 40, barSize, 0x666666, 0.8)
            .setOrigin(0, 0.5) // Origin Left-Center
            .setInteractive({ draggable: true });

        // Input Blocking Logic for H
        barH.on('pointerdown', blockInput);
        barH.on('pointerup', unblockInput);
        barH.on('pointerupoutside', unblockInput);

        thumbH.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            blockInput();
            thumbH.setFillStyle(0x444444, 0.8);
        });
        thumbH.on('pointerup', () => {
            unblockInput();
            thumbH.setFillStyle(0x666666, 0.8);
        });
        thumbH.on('pointerupoutside', () => {
            unblockInput();
            thumbH.setFillStyle(0x666666, 0.8);
        });

        this.scrollBars.h = { track: barH, thumb: thumbH, start: 0, size: hWidth };

        this.uiContainer.add([barV, thumbV, barH, thumbH]);

        // 初期状態は非表示
        this.toggleScrollBars(false, false);

        // ドラッグ状態フラグ
        this.isDraggingV = false;
        this.isDraggingH = false;

        // --- トラッククリックイベント (ジャンプ) ---
        barV.on('pointerdown', (pointer) => {
            const track = this.scrollBars.v;
            // クリック位置から比率を計算
            const localY = pointer.y; // World Y since UI scene
            const minY = track.start;
            const maxY = track.start + track.size;

            // 範囲内チェック
            if (localY >= minY && localY <= maxY) {
                // thumbの中心をここに移動させるイメージ
                // ただし正確には thumb.height/2 を考慮すべきだが簡易実装
                const ratio = (localY - minY) / track.size;
                this.game.events.emit('scrollRequest', { axis: 'vertical', value: ratio });
            }
        });

        barH.on('pointerdown', (pointer) => {
            const track = this.scrollBars.h;
            const localX = pointer.x;
            const minX = track.start;
            const maxX = track.start + track.size;

            if (localX >= minX && localX <= maxX) {
                const ratio = (localX - minX) / track.size;
                this.game.events.emit('scrollRequest', { axis: 'horizontal', value: ratio });
            }
        });

        // --- ドラッグイベント ---
        // dragstart/end での blockInput は pointerdown/up でカバーされるが、念のため残すか、削除でよい。
        // pointerdown で既に block されており、dragstart で重複して送っても害はないが、
        // 色変更ロジックが重複すると面倒なので、pointerdown側に寄せた。
        thumbV.on('dragstart', () => {
            this.isDraggingV = true;
        });
        thumbV.on('dragend', () => {
            this.isDraggingV = false;
        });

        thumbV.on('drag', (pointer, dragX, dragY) => {
            const track = this.scrollBars.v;
            // 範囲制限 (Origin Topのため、YはTop座標)
            const thumbSize = track.thumb.height;
            const minY = track.start;
            const maxY = track.start + track.size - thumbSize;

            const rawDragY = dragY;
            dragY = Phaser.Math.Clamp(dragY, minY, maxY);
            const clampedY = dragY;

            thumbV.y = dragY;

            // 割合計算 (0.0 - 1.0)
            const available = (maxY - minY);
            let ratio = 0;
            if (available > 0) {
                ratio = (dragY - minY) / available;
            }

            console.log(`[UIScene] DragV: Pointer=${pointer.y.toFixed(1)} In=${rawDragY.toFixed(1)} Clamped=${clampedY.toFixed(1)} Range=[${minY.toFixed(1)}, ${maxY.toFixed(1)}] Ratio=${ratio.toFixed(4)}`);
            this.game.events.emit('scrollRequest', { axis: 'vertical', value: ratio });
        });

        thumbH.on('dragstart', () => {
            this.isDraggingH = true;
        });
        thumbH.on('dragend', () => {
            this.isDraggingH = false;
        });

        thumbH.on('drag', (pointer, dragX, dragY) => {
            const track = this.scrollBars.h;
            // 範囲制限 (Origin Leftのため、XはLeft座標)
            const thumbSize = track.thumb.width;
            const minX = track.start;
            const maxX = track.start + track.size - thumbSize;

            const rawDragX = dragX;
            dragX = Phaser.Math.Clamp(dragX, minX, maxX);
            const clampedX = dragX;

            thumbH.x = dragX;

            // 割合計算
            const available = (maxX - minX);
            let ratio = 0;
            if (available > 0) {
                ratio = (dragX - minX) / available;
            }

            console.log(`[UIScene] DragH: Pointer=${pointer.x.toFixed(1)} In=${rawDragX.toFixed(1)} Clamped=${clampedX.toFixed(1)} Range=[${minX.toFixed(1)}, ${maxX.toFixed(1)}] Ratio=${ratio.toFixed(4)}`);
            this.game.events.emit('scrollRequest', { axis: 'horizontal', value: ratio });
        });
    }

    // スクロールバーの表示切り替え
    toggleScrollBars(showV, showH) {
        if (!this.scrollBars) return;
        this.scrollBars.v.track.setVisible(showV);
        this.scrollBars.v.thumb.setVisible(showV);
        this.scrollBars.h.track.setVisible(showH);
        this.scrollBars.h.thumb.setVisible(showH);
    }

    // スクロールバー更新（GameSceneからのイベントで呼ばれる）
    updateScrollBars(data) {
        if (!this.scrollBars) return;

        // data: { h, v } calculated by ScrollCoordinator

        // --- 垂直 (Vertical) ---
        const trackV = this.scrollBars.v;
        if (data.v.visible) {
            this.toggleScrollBars(true, this.scrollBars.h.track.visible);

            // サイズ計算
            let thumbSize = data.v.sizeRatio * trackV.size;
            thumbSize = Phaser.Math.Clamp(thumbSize, 20, trackV.size);

            // Visual Update
            trackV.thumb.height = thumbSize;
            trackV.thumb.setSize(trackV.track.width, thumbSize);
            if (trackV.thumb.input) {
                // Rectangle.setTo(x, y, width, height)
                trackV.thumb.input.hitArea.setTo(
                    -trackV.track.width / 2,
                    0, // Origin Topなので0
                    trackV.track.width,
                    thumbSize
                );
            }

            // 位置計算 (ドラッグ中はViewからの更新を無視)
            if (!this.isDraggingV) {
                const minY = trackV.start;
                const maxY = trackV.start + trackV.size - thumbSize;
                // data.v.ratio (0.0 - 1.0) をUI座標にマップ
                trackV.thumb.y = minY + (maxY - minY) * data.v.ratio;
            }
        } else {
            trackV.track.setVisible(false);
            trackV.thumb.setVisible(false);
        }

        // --- 水平 (Horizontal) ---
        const trackH = this.scrollBars.h;
        if (data.h.visible) {
            this.scrollBars.h.track.setVisible(true);
            this.scrollBars.h.thumb.setVisible(true);

            // サイズ計算
            let thumbSize = data.h.sizeRatio * trackH.size;
            thumbSize = Phaser.Math.Clamp(thumbSize, 20, trackH.size);

            // Visual Update
            trackH.thumb.width = thumbSize;
            trackH.thumb.setSize(thumbSize, trackH.track.height);
            if (trackH.thumb.input) {
                trackH.thumb.input.hitArea.width = thumbSize;
                trackH.thumb.input.hitArea.height = trackH.track.height;
                // HitAreaの中心を維持
                trackH.thumb.input.hitArea.setTo(
                    0, // Origin Leftなので0
                    -trackH.track.height / 2,
                    thumbSize,
                    trackH.track.height
                );
            }

            // 位置計算
            if (!this.isDraggingH) {
                const minX = trackH.start;
                const maxX = trackH.start + trackH.size - thumbSize;
                trackH.thumb.x = minX + (maxX - minX) * data.h.ratio;
            }
        } else {
            trackH.track.setVisible(false);
            trackH.thumb.setVisible(false);
        }
    }

    // ズーム値を更新 (相対値)
    updateZoom(delta) {
        const newZoom = Phaser.Math.Clamp(this.currentZoom + delta, this.minZoom, this.maxZoom);
        this.setZoom(newZoom);

        // ノブの位置も更新
        const centerX = this.cameras.main.width / 2;
        const progress = (newZoom - this.minZoom) / (this.maxZoom - this.minZoom);
        this.sliderKnob.x = (centerX - 50) + (progress * 100);
    }

    // ズーム値を設定 (絶対値)
    setZoom(value) {
        this.currentZoom = value;
        // GameSceneに通知
        this.game.events.emit('zoomUpdate', value);
    }

    setupEventListeners() {
        // GameSceneからのイベントをリッスン
        this.game.events.on('updateUI', this.updateUI, this);
        this.game.events.on('showMessage', this.showMessage, this);
        this.game.events.on('updateScroll', this.updateScrollBars, this);
    }

    // UI要素を更新
    updateUI(data) {
        // 各UI要素を更新
        if (data.flagsLeft !== undefined && this.uiElements.flagsLeft) {
            this.uiElements.flagsLeft.setText(data.flagsLeft.toString());
        }

        if (data.timer !== undefined && this.uiElements.timer) {
            this.uiElements.timer.setText(data.timer.toString());
        }

        if (data.score !== undefined && this.uiElements.score) {
            this.uiElements.score.setText(data.score.toString());
        }

        if (data.totalScore !== undefined && this.uiElements.totalScore) {
            this.uiElements.totalScore.setText(data.totalScore.toString());
        }
    }

    // メッセージを表示
    showMessage(data) {
        // 既存のタイマーをキャンセル
        if (this.messageTimer) {
            this.messageTimer.remove();
        }

        // メッセージを設定
        this.messageText.setText(data.text);
        this.messageText.setColor(data.color || '#333');

        // 時間指定がある場合、タイマーを設定
        if (data.duration) {
            this.messageTimer = this.time.delayedCall(data.duration, () => {
                this.messageText.setText('');
            });
        }
    }

    // ゲームを再スタート
    restartGame() {
        // 同じ設定で新しいゲームを開始
        this.scene.get('GameScene').restartGame();
    }

    // メニューに戻る
    returnToMenu() {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
    }
}