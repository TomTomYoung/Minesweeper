const UILayout = {
    // レイアウト設定定数
    CONFIG: {
        HEADER_HEIGHT: 50,  // 上部情報パネルの高さ
        FOOTER_HEIGHT: 60,  // 下部コントロールパネルの高さ
        MARGIN: 10,         // 基本余白
        PANEL_SPACING: 20   // パネル間の間隔
    },

    // 上部の情報パネル（フラグ数、時間、スコア）の表示領域を取得
    getInfoPanelRect(width) {
        // x: 画面中央, y: ヘッダー高さの半分（中心）, width: 画面幅いっぱい
        return {
            x: width / 2,
            y: this.CONFIG.HEADER_HEIGHT / 2,
            width: width
        };
    },

    // ゲームオーバー/クリア時のメッセージ表示位置を取得
    getMessagePanelPosition(width) {
        // ヘッダーの下 + 少し余白（従来の80px付近）
        // 50 + 30 = 80
        const yPos = this.CONFIG.HEADER_HEIGHT + 30;
        return { x: width / 2, y: yPos };
    },

    // 下部の操作パネル（リセットボタン、モード切替）の表示領域を取得
    getControlPanelRect(width, height) {
        const h = this.CONFIG.FOOTER_HEIGHT;
        // x: 画面中央, y: 画面下部（高さ - パネル高さの半分）, width: 画面幅いっぱい
        return { x: width / 2, y: height - h / 2, width: width };
    },

    // ズームスライダー（右上）の設定を取得
    getZoomSliderConfig(width) {
        // メッセージパネルと同じくらいの高さ（従来の80px）
        const yPos = this.CONFIG.HEADER_HEIGHT + 30;
        return {
            x: width - 120, // 右端から120px
            y: yPos,        // 上端から80px相当
            width: 150,     // 幅150px
            height: 20      // 高さ20px
        };
    },

    // 縦スクロールバー（右端）の設定を取得
    getScrollBarVConfig(width, height) {
        // 上下の予約領域（ヘッダー + フッター + 余白）
        // 従来は height - 120 なので、上下合計120px相当
        // ここではヘッダー(50) + フッター(60) + 余白(10) = 120 とみなす
        const topSpace = this.CONFIG.HEADER_HEIGHT + 10;
        const bottomSpace = this.CONFIG.FOOTER_HEIGHT;
        const barHeight = height - (topSpace + bottomSpace + 10); // 上下余白考慮

        // Y中心位置: 上の余白 + バーの半分の高さ
        const centerY = topSpace + barHeight / 2;

        return {
            x: width - 10,       // 右端から10px
            y: centerY,          // 垂直中央（計算値）
            width: 20,           // 幅20px
            height: barHeight    // 利用可能高さ
        };
    },

    // 横スクロールバー（下部）の設定を取得
    getScrollBarHConfig(width, height) {
        // フッターの少し上
        // フッター(60) + 余白(10) -> 下から70px
        const yPos = height - (this.CONFIG.FOOTER_HEIGHT + 10);

        return {
            x: width / 2,        // 水平中央
            y: yPos,             // 下端から70px相当
            width: width - 40,   // 横一杯から少し余白
            height: 20           // 高さ20px
        };
    }
};
