const UILayout = {

    // 上部の情報パネル（フラグ数、時間、スコア）の表示領域を取得
    getInfoPanelRect(width) {
        // x: 画面中央, y: 上部から25px, width: 画面幅いっぱい
        return { x: width / 2, y: 25, width: width };
    },

    // ゲームオーバー/クリア時のメッセージ表示位置を取得
    getMessagePanelPosition(width) {
        // x: 画面中央, y: 上部から80px
        return { x: width / 2, y: 80 };
    },

    // 下部の操作パネル（リセットボタン、モード切替）の表示領域を取得
    getControlPanelRect(width, height) {
        const panelHeight = 60;
        // x: 画面中央, y: 画面下部（高さ - パネル高さの半分）, width: 画面幅いっぱい
        return { x: width / 2, y: height - panelHeight / 2, width: width };
    },

    // ズームスライダー（右上）の設定を取得
    getZoomSliderConfig(width) {
        return {
            x: width - 120, // 右端から120px
            y: 80,          // 上端から80px
            width: 150,     // 幅150px
            height: 20      // 高さ20px
        };
    },

    // 縦スクロールバー（右端）の設定を取得
    getScrollBarVConfig(width, height) {
        return {
            x: width - 10,       // 右端から10px
            y: height / 2,       // 垂直中央
            width: 20,           // 幅20px
            height: height - 120 // 上下の余白分（メッセージパネルやコントローラー等を考慮）を引く
        };
    },

    // 横スクロールバー（下部）の設定を取得
    getScrollBarHConfig(width, height) {
        return {
            x: width / 2,        // 水平中央
            y: height - 70,      // 下端から70px（コントロールパネルの上あたり）
            width: width - 40,   // 横一杯から少し余白
            height: 20           // 高さ20px
        };
    }
};
