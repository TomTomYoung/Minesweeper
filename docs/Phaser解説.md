# Phaser 3 実践解説

このドキュメントでは、本プロジェクト（マインスイーパー）の実装コードを例に、Phaser 3 の主要な機能と使い方を解説します。

## 1. ゲームの初期化と設定 (`main.js`)

Phaserゲームを開始するには、設定オブジェクト(`config`)を作成し、`Phaser.Game`インスタンスを生成します。

```javascript:main.js
// ページのロード完了後に実行
window.addEventListener('load', () => {
    // ゲーム設定
    const config = {
        type: Phaser.AUTO, // WebGLが使えるならWebGL、だめならCanvasモードを自動選択
        width: 800,       // ゲーム画面の幅
        height: 600,      // ゲーム画面の高さ
        parent: 'game-container', // ゲームを挿入するHTML要素のID
        backgroundColor: '#f0f0f0', // 背景色
        // 使用するシーンのリスト（順序重要：最初のシーンが自動的に開始されます）
        scene: [BootScene, MenuScene, GameScene, UIScene],
        // ★スケール設定（画面サイズ調整）
        scale: {
            // モード: FIT
            // 指定した width/height の縦横比を維持したまま、
            // 親要素（ウィンドウ）に収まる最大サイズまで拡大縮小します。
            // 隙間ができる場合は、親要素の背景色が見えます（レターボックス）。
            mode: Phaser.Scale.FIT,
            
            // 自動配置: CENTER_BOTH
            // キャンバス要素を親要素の「上下左右中央」に配置します。
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };

    // ゲームインスタンスを作成（これでゲームが起動します）
    const game = new Phaser.Game(config);

    // グローバルデータとしてゲームデータを保持させる例
    game.gameData = {
        difficulty: 'easy',
        score: 0
    };
});
```

### ポイント
*   **`type: Phaser.AUTO`**: 描画モードの自動選択。基本はこれでOK。
*   **`scene`**: ゲームを構成する「場面」のリスト。タイトル画面、ゲーム画面、UIなどを個別のクラスとして管理します。
*   **`parent`**: HTMLのどの `div` タグの中にキャンバスを作るかを指定します。

### 🔍 詳しく解説：`scale` 設定について
今回のプロジェクトではレスポンシブ対応のために以下の設定を行っています。

*   **`mode: Phaser.Scale.FIT`**
    *   **機能**: ゲーム画面のアスペクト比（800x600なら4:3）を**完全に維持**します。ブラウザのウィンドウサイズが変わっても、ゲーム画面が歪むことはありません。
    *   **挙動**: ウィンドウ内に収まる最大のサイズに自動的にリサイズされます。ウィンドウの形がゲームと異なる場合、余った部分には余白（レターボックス）ができます。
    *   **比較**:
        *   `FIT`: アスペクト比維持・全体表示（推奨）。
        *   `ENVELOP`: アスペクト比維持・画面いっぱいに表示（一部が見切れる可能性がある）。
        *   `RESIZE`: HTML同様にキャンバスサイズ自体をリサイズ（ゲームロジック側で動的な配置変更が必要）。

*   **`autoCenter: Phaser.Scale.CENTER_BOTH`**
    *   **機能**: 生成された `<canvas>` 要素を、親要素（`parent`で指定した`#game-container`や`body`）に対して**垂直・水平方向の中央**に配置します。
    *   **メリット**: CSSで `margin: auto` などを書かなくても、Phaser側が自動で中央揃えをしてくれるため便利です。

### 🛠️ その他の便利な `scale` 設定項目

`mode` や `autoCenter` 以外にも、実用的な設定が多数あります。

*   **`zoom`**: (初期値: 1)
    *   キャンバスの初期ズーム倍率を設定します。ドット絵ゲームなどで、元の解像度は低く作成し、表示だけ2倍・4倍にしたい場合に便利です。
    
*   **`min` / `max`**:
    *   `min: { width: 400, height: 300 }`
    *   `max: { width: 1600, height: 1200 }`
    *   リサイズ時の最小・最大サイズを制限します。極端に小さくなったり大きくなったりしてレイアウトが崩れるのを防げます。

*   **`resizeInterval`**:
    *   リサイズイベントの発生頻度（ミリ秒）を制御します。ウィンドウのリサイズ操作中に過剰に更新処理が走るのを防ぎ、パフォーマンスを向上させます。

*   **`fullscreenTarget`**:
    *   フルスクリーン化する際の対象DOM要素を指定します。デフォルトはキャンバスの親要素ですが、特定のラッパー要素全体をフルスクリーンにしたい場合などに使います。

---

## 2. シーン（Scene）の構造 (`src/scenes/MenuScene.js`)

Phaserでは画面単位（メニュー、ゲームプレイ、リザルトなど）を「シーン」としてクラス化します。`Phaser.Scene`を継承して作ります。

```javascript:src/scenes/MenuScene.js
class MenuScene extends Phaser.Scene {
    constructor() {
        // シーンを一意に識別するキーを設定
        super({ key: 'MenuScene' });
    }

    // 初期化処理（前のシーンからデータを受け取る場合などに使用）
    init(data) {
        // ...
    }

    // 画像や音声の読み込み（ロード画面など）
    preload() {
        // BootSceneで読み込み済みの場合は省略可能
    }

    // シーン生成時に1回だけ実行されるメイン処理
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 【テキストの表示】
        // this.add.text(x, y, 文字列, スタイル)
        this.add.text(width / 2, 80, 'マインスイーパー', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#000'
        }).setOrigin(0.5); // 中心基準で配置

        // 【コンテナやボタンの作成メソッド呼び出し】
        this.createModeSelection();
    }
    
    // 毎フレーム実行される処理（ゲームループ）
    update(time, delta) {
        // メニュー画面などで動きがなければ空でもOK
    }
}
```

### ポイント
*   **`create()`**: シーン開始時にオブジェクト（画像、テキスト、ボタンなど）を配置する場所です。
*   **`this.add`**: `GameObjectFactory`。これを使って画面に物を配置します。
    *   `this.add.text(...)`: 文字を表示
    *   `this.add.image(...)` / `this.add.sprite(...)`: 画像を表示
    *   `this.add.rectangle(...)`: 図形を表示

---

## 3. インタラクティブな UI / ボタンの実装

PhaserにはHTMLのような標準ボタンがないため、図形や画像にイベントを設定してボタンを作ります。`MenuScene.js` の `createButton` メソッドが良い例です。

```javascript:src/scenes/MenuScene.js
// ボタンを作成するヘルパー関数
createButton(x, y, width, height, text, color, callback) {
    // 複数の要素（背景とテキスト）をまとめるContainerを作成
    const button = this.add.container(x, y);

    // 背景の矩形を作成
    const bg = this.add.rectangle(0, 0, width, height, color, 1)
        .setInteractive() // ★ユーザー入力を受け付けるように設定
        // クリックイベント
        .on('pointerdown', callback)
        // ホバーエフェクト（マウスが乗った時）
        .on('pointerover', () => bg.setFillStyle(this.lightenColor(color, 20)))
        // マウスが離れた時
        .on('pointerout', () => bg.setFillStyle(color));

    // ボタン上のテキスト
    const buttonText = this.add.text(0, 0, text, { fontSize: '20px' })
        .setOrigin(0.5);

    // コンテナに背景とテキストを追加
    button.add([bg, buttonText]);
    
    return button;
}
```

### ポイント
*   **`.setInteractive()`**: これを呼ばないとクリックやホバーイベントが発生しません。
*   **`pointerdown`**: クリック（タップ）された時のイベント。PC/スマホ両対応です。
*   **`Container`**: 複数のオブジェクトをグループ化して、まとめて移動したり表示/非表示を切り替えるのに便利です。

---

## 4. カスタムゲームオブジェクト (`src/objects/Cell.js`)

ゲーム内のキャラクターやアイテムなどの複利な要素は、独自のクラスを作ることで管理しやすくなります。このプロジェクトでは `Cell` クラスが `Phaser.GameObjects.Container` を継承しています。

```javascript:src/objects/Cell.js
class Cell extends Phaser.GameObjects.Container {
    constructor(scene, x, y, size, row, col) {
        super(scene, x, y);
        // ★作成したインスタンスをシーンに追加（重要）
        scene.add.existing(this);

        this.size = size;
        this.revealed = false;

        // 視覚要素（背景、アイコン、テキスト）の作成
        this.createVisuals();

        // ★クリック判定エリアの設定
        // Container自体は大きさを持たないため、判定範囲を明示的に指定します
        this.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, size, size), 
            Phaser.Geom.Rectangle.Contains
        );

        // イベント設定
        this.setupEvents();
    }

    createVisuals() {
        // 背景
        this.background = this.scene.add.rectangle(0, 0, this.size, this.size, 0xcccccc)
            .setOrigin(0, 0); // 左上基準
            
        // スプライト（画像）
        this.icon = this.scene.add.sprite(this.size / 2, this.size / 2, 'mine')
            .setVisible(false);

        // コンテナに追加
        this.add([this.background, this.icon]);
    }

    setupEvents() {
        this.on('pointerdown', (pointer) => {
            // 右クリック判定
            if (pointer.rightButtonDown()) {
                this.emit('cellRightClicked', this); // カスタムイベント発火
            } else {
                this.emit('cellClicked', this);
            }
        });
    }
}
```

### ポイント
*   **`scene.add.existing(this)`**: `new Cell(...)` しただけでは画面に出ません。このメソッドでシーンの表示リストに追加します。
*   **`super(scene, x, y)`**: 親クラスのコンストラクタを呼び、初期位置を設定します。
*   **カスタムイベント**: `this.emit('eventName', data)` を使うことで、ゲームロジック側（`GameSession`など）にクリックされたことだけを伝え、処理を分離できます。

---

## 5. まとめ：基本的な開発フロー

1.  **Config**: `main.js` で画面サイズやシーン構成を定義。
2.  **Scene**: `MenuScene` や `GameScene` で画面ごとの「ロード」「作成」「更新」を実装。
3.  **Objects**: `Cell` のように繰り返し使う要素はクラス化（継承）して整理。

---

## 6. アーキテクチャの考察：HTML vs Phaser

「得点表示などのデータバインドが必要なGUIはPhaserで実装し、拡大縮小やスクロールバーはHTML（ブラウザ機能）に任せることは可能か？」について、ユーザー様の理解を確認します。

### 結論
**ユーザー様の理解通りの実装が必要です。**

> **「Phaser内で生成したシーンのどの部分を実際に描画するかを担当するのがカメラで、Phaserのサイズ（Canvas）は変わらない」**
> **「HTMLのスクロールバーとは標準で連動しない」**
> **「連動させるのであれば無理やりスクロールバーをHTMLで作った後に、その動作をカメラに接続する必要がある」**

この認識は完全に正しいです。

### 理由と実装の要点

1.  **Canvasは固定サイズの「窓」**:
    *   **Phaserの機能**: 設定(`parent`)があれば自動生成もできますし、既存のCanvasを指定(`canvas`)して使うことも可能です。
    *   **今回の実装**: `main.js`で `parent: 'game-container'` を指定しているため、Phaserが自動的に `<canvas>` タグを生成しています。
    *   **サイズ**: このCanvas要素自体はサイズ固定（例: 800x600）です。
    *   広大なマップがあっても、Canvas要素が大きくなるわけではないため、ブラウザはスクロールバーを表示しません。

2.  **Cameraによる描画範囲の制御**:
    *   その「窓」に、ワールドの「どこ」を映すかを決めるのが `Camera` です。
    *   画面をスクロールさせる唯一の方法は、Phaserの `camera.scrollX` / `camera.scrollY` の値を変更することです。

3.  **HTMLスクロールバーとの連携**:
    *   したがって、ブラウザ標準のスクロールバーを使う場合は、以下の手順による「接続」が必須となります。
        1.  HTML上に、マップと同じ高さを持つ「中身の無いダミーの `div`」を配置してスクロールバーを発生させる。
        2.  JSでその `div` のスクロールイベント (`scroll`) を監視する。
        3.  取得したスクロール位置を、Phaserの `camera.scrollY` に代入して同期させる。

HTMLのスクロールバーを使う場合でも、最終的な描画制御はPhaserのカメラ機能を通す必要があります。

---

## 7. Phaser標準のGUI機能について

「Phaser標準のGUIってなにがあるの？」という疑問について。

### 結論：標準の「UIパーツ」はありません
HTMLの `<button>`, `<input>`, `<select>` や、Unityの `uGUI` のような、**完成されたUIコンポーネントはPhaser本体には存在しません**。

### あるのは「素材（プリミティブ）」だけ
Phaserが提供するのは、UIを作るための「部品の材料」のみです。

*   **Text**: 文字を表示する。
*   **Rectangle / Circle**: 形を表示する（ボタンの背景などに使う）。
*   **Image / Sprite**: 画像を表示する。
*   **Container**: それらをまとめる。
*   **Interactive**: クリックやドラッグを検知する機能。

### どうやってUIを作るのか？
1.  **自作する (今回のパターン)**:
    *   「矩形」と「文字」を組み合わせて `Container` に入れ、クリックイベントを付けて「ボタン」と呼ぶ。
    *   今回の `createButton` や `ScrollBar` クラスはこれに当たります。
2.  **HTMLを使う (DOM Overlay)**:
    *   `<input>` (テキスト入力) など、Canvasで再現するのが大変なものはHTMLを上に重ねるのが通例です。
3.  **プラグインを使う**:
    *   世界中の有志が作ったUIライブラリ導入して機能を追加することが多いです。
    *   **推奨**: **RexUI Plugin** (by Rex Rainbow)
        *   今回の要件（スライダー、スクロールバー）を完璧にカバーしています。
        *   `rexUI.add.slider(...)` や `rexUI.add.scrollBar(...)` と書くだけで、今回自作したような複雑な計算処理なしに実装可能です。

