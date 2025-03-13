// config.js - ゲームの定数と設定値
const GAME_CONFIG = {
    // ゲームサイズ
    WIDTH: 800,
    HEIGHT: 600,
    
    // セル関連
    CELL_COLORS: {
        DEFAULT: 0xc0c0c0,
        REVEALED: 0xe0e0e0,
        MINE: 0xff0000,
        WALL: 0x6b6b6b,
        TREASURE: 0xffd700,
        STAIRS: 0x9370db
    },
    
    // 数字の色
    NUMBER_COLORS: [
        null,           // 0: 表示なし
        0x0000ff,       // 1: 青
        0x008000,       // 2: 緑
        0xff0000,       // 3: 赤
        0x00008b,       // 4: 濃い青
        0x8b0000,       // 5: 濃い赤
        0x008080,       // 6: ティール
        0x000000,       // 7: 黒
        0x808080        // 8: グレー
    ],
    
    // テキストスタイル
    TEXT_STYLES: {
        UI: {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#333',
            align: 'center'
        },
        TITLE: {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#333',
            align: 'center',
            fontWeight: 'bold'
        },
        BUTTON: {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#fff',
            align: 'center'
        },
        MESSAGE: {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#333',
            align: 'center',
            fontWeight: 'bold'
        }
    }
};