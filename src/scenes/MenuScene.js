class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.layout = MenuLayout;
        this.controller = null;
    }

    create() {
        this.controller = new MenuController(this);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        AssetPresentation.menuBackground(this);
        this.audio = this.game.audio;
        if (this.audio) this.audio.playBgm('bgm_menu');

        // Title
        const titlePos = this.layout.getTitlePosition(width);
        this.add.text(titlePos.x, titlePos.y, 'マインスイーパー', GAME_CONFIG.TEXT_STYLES.TITLE)
            .setOrigin(0.5);

        // Subtitle & Mode Selector
        if (window.initialGameMode) {
            // Fixed Mode
            const subPos = this.layout.getSubtitlePosition(width);
            const layered = window.initialGameMode === GameConfig.MODES.RPG_LAYERED;
            const rpg = layered || ['RPG', 'RPG_SIMPLE'].includes(window.initialGameMode);
            const modeName = layered ? 'RPG 多層モード' : rpg ? 'RPG シンプルモード' : '通常モード';
            const modeDesc = layered ? '剣とつるはしで覆いを除き、鍵を探して次の階へ' : rpg ? 'この階の鍵を見つけ、敵を倒して次の階へ' : '地雷を避けて、すべての安全なマスを開く';

            this.add.text(subPos.x, subPos.y, `${modeName}\n${modeDesc}`, {
                fontSize: '20px', fontFamily: 'Arial', color: '#555', align: 'center'
            }).setOrigin(0.5);

            // No Mode Selector needed
        } else {
            // Default (Selectable)
            const subPos = this.layout.getSubtitlePosition(width);
            this.add.text(subPos.x, subPos.y, 'お宝と階段セル付き', {
                fontSize: '20px', fontFamily: 'Arial', color: '#555', align: 'center'
            }).setOrigin(0.5);

            // Mode Selector
            const modePos = this.layout.getModeSelectorPosition(width);
            const modeSelector = new ModeSelector(this, modePos.x, modePos.y, GameConfig.MODES.RPG, (mode) => {
                this.controller.setMode(mode);
            });
        }

        // Difficulty Icons/Buttons
        const diffPos = this.layout.getDifficultySelectorPosition(width);
        new DifficultySelector(this, diffPos.x, diffPos.y, (difficulty) => {
            this.controller.startGame(difficulty);
        });

        // Custom Settings Panel (Hidden by default)
        // Custom Settings Panel (Hidden by default)
        const panelPos = this.layout.getCustomPanelPosition(width, height);

        const configSchema = {
            title: 'カスタム設定',
            fields: [
                { key: 'rows', label: '行数:', min: 5, max: 30, default: 9 },
                { key: 'cols', label: '列数:', min: 5, max: 30, default: 9 },
                { key: 'mines', label: '地雷数:', min: 1, max: 200, default: 10 },
                { key: 'wallClusters', label: '壁クラスター:', min: 0, max: 20, default: 3 },
                { key: 'totalWalls', label: '壁の総数:', min: 0, max: 100, default: 15 },
                { key: 'treasures', label: 'お宝の数:', min: 0, max: 20, default: 3 },
                { key: 'stairs', label: '階段の数:', min: 1, max: 5, default: 1 },
                { key: 'enemies', label: '敵の数:', min: 0, max: 30, default: 2 }
            ],
            toggles: this.controller.currentMode === GameConfig.MODES.RPG_LAYERED ? [] : [
                { key: 'autoRevealWallCluster', label: '壁クラスターを自動公開', default: false }
            ]
        };

        const customPanel = new GenericConfigPanel(this, panelPos.x, panelPos.y - 30, 620, 460, configSchema,
            (config) => {
                config.treasurePoints = 100; // Inject fixed value
                const result = this.controller.startGame('custom', config);
                if (result && result.error) {
                    customPanel.showError(result.error);
                }
            },
            () => {
                customPanel.setVisible(false);
            }
        ).setDepth(100);

        AssetPresentation.audioControls(this, 420, height - 35);

        // Custom Button
        const customBtnPos = this.layout.getCustomButtonPosition(width);
        new MenuButton(this, customBtnPos.x, customBtnPos.y, 200, 50, 'カスタム設定', 0x9C27B0, () => {
            customPanel.setVisible(!customPanel.visible);
        });
    }
}
