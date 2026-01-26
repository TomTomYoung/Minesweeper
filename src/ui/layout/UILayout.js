const UILayout = {
    // レイアウト設定定数
    CONFIG: {
        HEADER_HEIGHT: 50,  // 上部情報パネルの高さ
        FOOTER_HEIGHT: 60,  // 下部コントロールパネルの高さ
        MARGIN: 10,         // 基本余白
        PANEL_SPACING: 20   // パネル間の間隔
    },

    // 上部の情報パネル（フラグ数、時間、スコア）の表示領域を取得
    getInfoPanelRect(canvasWidth, canvasHeight) {
        // x: 画面中央, y: ヘッダー高さの半分（中心）, width: 画面幅いっぱい
        return {
            x: canvasWidth / 2,
            y: this.CONFIG.HEADER_HEIGHT / 2,
            width: canvasWidth,
            height: this.CONFIG.HEADER_HEIGHT // 高さも返すように拡張
        };
    },

    // ゲームオーバー/クリア時のメッセージ表示位置を取得
    getMessagePanelPosition(canvasWidth, canvasHeight) {
        // ヘッダー情報の取得
        const header = this.getInfoPanelRect(canvasWidth, canvasHeight);
        // ヘッダーの下端 (y + height/2) + 余白
        // ※ yは中心座標なので、下端は y + height/2
        const yPos = header.y + (header.height / 2) + 30;
        return { x: canvasWidth / 2, y: yPos };
    },

    // 下部の操作パネル（リセットボタン、モード切替）の表示領域を取得
    getControlPanelRect(canvasWidth, canvasHeight) {
        const h = this.CONFIG.FOOTER_HEIGHT;
        // x: 画面中央, y: 画面下部（高さ - パネル高さの半分）, width: 画面幅いっぱい
        return {
            x: canvasWidth / 2,
            y: canvasHeight - h / 2,
            width: canvasWidth,
            height: h
        };
    },

    // ズームスライダー（右上）の設定を取得
    getZoomSliderConfig(canvasWidth, canvasHeight) {
        // コントロールパネルと同じ高さ基準（右端に配置）
        const cprPos = this.getControlPanelRect(canvasWidth, canvasHeight);
        return {
            x: canvasWidth - 120, // 右端から120px
            y: cprPos.y,          // コントロールパネルと同じY座標
            width: 150,           // 幅150px
            height: 20            // 高さ20px
        };
    },

    // 縦スクロールバー（右端）の設定を取得
    getScrollBarVConfig(canvasWidth, canvasHeight) {
        // 上下のパネル領域を取得して計算
        const header = this.getInfoPanelRect(canvasWidth, canvasHeight);
        const footer = this.getControlPanelRect(canvasWidth, canvasHeight);

        // 利用可能領域の開始Yと終了Y
        const startY = header.y + (header.height / 2) + this.CONFIG.MARGIN;
        const endY = footer.y - (footer.height / 2) - this.CONFIG.MARGIN;

        const barHeight = endY - startY;
        const centerY = startY + barHeight / 2;

        return {
            x: canvasWidth - 10,       // 右端から10px
            y: centerY,                // 垂直中央
            width: 20,                 // 幅20px
            height: barHeight          // 利用可能高さ
        };
    },

    // 横スクロールバー（下部）の設定を取得
    getScrollBarHConfig(canvasWidth, canvasHeight) {
        // フッター領域を取得
        const footer = this.getControlPanelRect(canvasWidth, canvasHeight);

        // フッターの上端 - 余白
        const yPos = footer.y - (footer.height / 2) - 10;

        return {
            x: canvasWidth / 2,        // 水平中央
            y: yPos,                   // 下端から70px相当
            width: canvasWidth - 40,   // 横一杯から少し余白
            height: 20                 // 高さ20px
        };
    }
};
