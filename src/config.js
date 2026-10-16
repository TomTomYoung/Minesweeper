/**
 * @fileoverview config.js
 * 
 * Game View Configuration Constants.
 * 
 * This file contains constant definitions mainly used for UI and Rendering,
 * such as colors, fonts, and game dimensions.
 * 
 * For Game Logic configuration (rules, difficulty), see src/utils/GameConfig.js.
 */
const GAME_CONFIG = {
    // ゲームサイズ
    WIDTH: 800,
    HEIGHT: 600,

    // セル関連
    CELL_COLORS: {
        DEFAULT: 0xa3b0a7,
        REVEALED: 0xeee8d9,
        MINE: 0xe5bfb0,
        WALL: 0xc3c7bf,
        TREASURE: 0xe7d3a6,
        STAIRS: 0xc2d8d5
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
