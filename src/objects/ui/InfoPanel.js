class InfoPanel extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width) {
        super(scene, x, y);
        scene.add.existing(this);

        this.width = width;
        this.height = 50;
        this.uiElements = {};

        this.createElements();
    }

    createElements() {
        // Background
        const bg = this.scene.add.rectangle(0, 0, this.width, this.height, 0xf0f0f0)
            .setStrokeStyle(1, 0xdddddd);
        this.add(bg);

        // Info Items
        const itemWidth = 180;
        const spacing = 20;
        const totalItems = 4; // Flags, Timer, Score, TotalScore
        const totalContentWidth = itemWidth * totalItems + spacing * (totalItems - 1);

        // Calculate startX relative to container center (0,0)
        let startX = -totalContentWidth / 2 + itemWidth / 2;

        this.createItem(startX, 0, '🚩 残り:', '10', 'flagsLeft');
        startX += itemWidth + spacing;

        this.createItem(startX, 0, '⏱️ 時間:', '0', 'timer');
        startX += itemWidth + spacing;

        this.createItem(startX, 0, '💎 得点:', '0', 'score');
        startX += itemWidth + spacing;

        this.createItem(startX, 0, '🏆 総得点:', '0', 'totalScore');
    }

    createItem(x, y, label, value, key) {
        const wrapper = this.scene.add.container(x, y);

        // Item Background
        const bg = this.scene.add.rectangle(0, 0, 170, 35, 0xdddddd, 0.7)
            .setStrokeStyle(1, 0xcccccc);

        // Label
        const labelText = this.scene.add.text(-75, 0, label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#333'
        }).setOrigin(0, 0.5);

        // Value
        const valueText = this.scene.add.text(30, 0, value, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#333'
        }).setOrigin(0, 0.5);

        wrapper.add([bg, labelText, valueText]);
        this.add(wrapper);

        // Store reference
        this.uiElements[key] = valueText;
    }

    updateData(flagsLeft, timer) {
        if (flagsLeft !== undefined && this.uiElements.flagsLeft) {
            this.uiElements.flagsLeft.setText(flagsLeft.toString());
        }
        if (timer !== undefined && this.uiElements.timer) {
            this.uiElements.timer.setText(timer.toString());
        }
    }

    updateUI(data) {
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
}
