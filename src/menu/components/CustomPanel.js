class CustomPanel extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, onApply, onCancel) {
        super(scene, x, y);
        scene.add.existing(this);

        this.width = width;
        this.height = height;
        this.onApply = onApply;
        this.onCancel = onCancel;

        this.customFields = {};
        this.customToggles = {};

        this.createVisuals();
        this.setVisible(false);
    }

    createVisuals() {
        // Background
        const panelBg = this.scene.add.rectangle(0, 0, this.width, this.height, 0xf8f8f8)
            .setStrokeStyle(2, 0xdddddd);
        this.add(panelBg);

        // Title
        const title = this.scene.add.text(0, -130, 'カスタム設定', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#333'
        }).setOrigin(0.5);
        this.add(title);

        this.createFields();
        this.createButtons();
    }

    createFields() {
        const fieldData = [
            { label: '行数:', key: 'rows', min: 5, max: 30, default: 9 },
            { label: '列数:', key: 'cols', min: 5, max: 30, default: 9 },
            { label: '地雷数:', key: 'mines', min: 1, max: 200, default: 10 },
            { label: '壁クラスター数:', key: 'wallClusters', min: 0, max: 20, default: 3 },
            { label: '壁の総数:', key: 'totalWalls', min: 0, max: 100, default: 15 },
            { label: 'お宝の数:', key: 'treasures', min: 0, max: 20, default: 3 },
            { label: '階段の数:', key: 'stairs', min: 1, max: 5, default: 1 }
        ];

        fieldData.forEach((field, index) => {
            const y = -90 + index * 30;
            this.createNumberField(y, field);
        });

        // Toggles
        const toggleY = -90 + fieldData.length * 30;
        this.createToggle(-220, toggleY, '壁を数えに含める', true, 'wallsCountInCalculation');
        this.createToggle(-220, toggleY + 30, '壁クラスターを自動公開', false, 'autoRevealWallCluster');
    }

    createNumberField(y, field) {
        // Label
        const label = this.scene.add.text(-220, y, field.label, {
            fontSize: '16px', fontFamily: 'Arial', color: '#333'
        }).setOrigin(0, 0.5);

        // Field Value
        const valueText = this.scene.add.text(-70, y, field.default.toString(), {
            fontSize: '16px', fontFamily: 'Arial', color: '#333'
        }).setOrigin(0.5);

        // - Button
        const decreaseBtn = this.scene.add.text(-125, y, '-', {
            fontSize: '20px', fontFamily: 'Arial', color: '#333'
        }).setOrigin(0.5).setInteractive();

        // + Button
        const increaseBtn = this.scene.add.text(-15, y, '+', {
            fontSize: '20px', fontFamily: 'Arial', color: '#333'
        }).setOrigin(0.5).setInteractive();

        // Logic
        decreaseBtn.on('pointerdown', () => {
            let val = parseInt(valueText.text);
            if (val > field.min) valueText.setText((val - 1).toString());
        });

        increaseBtn.on('pointerdown', () => {
            let val = parseInt(valueText.text);
            if (val < field.max) valueText.setText((val + 1).toString());
        });

        this.add([label, valueText, decreaseBtn, increaseBtn]);
        this.customFields[field.key] = valueText;
    }

    createToggle(x, y, label, initialState, key) {
        // Label
        const labelText = this.scene.add.text(x, y, label, {
            fontSize: '16px', fontFamily: 'Arial', color: '#333'
        }).setOrigin(0, 0.5);

        // Switch
        const toggleSwitch = this.scene.add.rectangle(
            x + labelText.width + (initialState ? 42 : 18), y,
            18, 18, initialState ? 0x4CAF50 : 0xcccccc
        );

        // Click Area
        const toggleBg = this.scene.add.rectangle(x + labelText.width + 30, y, 50, 24)
            .setStrokeStyle(1, 0xcccccc).setInteractive();

        toggleBg.on('pointerdown', () => {
            const isOff = toggleSwitch.fillColor === 0xcccccc;
            // Toggle
            if (isOff) { // Turn On
                toggleSwitch.x = x + labelText.width + 42;
                toggleSwitch.fillColor = 0x4CAF50;
            } else { // Turn Off
                toggleSwitch.x = x + labelText.width + 18;
                toggleSwitch.fillColor = 0xcccccc;
            }
        });

        this.add([labelText, toggleBg, toggleSwitch]);
        this.customToggles[key] = { switch: toggleSwitch, labelWidth: labelText.width, baseX: x };
    }

    createButtons() {
        const applyBtn = new MenuButton(this.scene, -100, 110, 150, 40, '適用', 0x4CAF50, () => this.applySettings());
        const cancelBtn = new MenuButton(this.scene, 100, 110, 150, 40, 'キャンセル', 0xf44336, () => {
            if (this.onCancel) this.onCancel();
        });
        this.add([applyBtn, cancelBtn]);
    }

    applySettings() {
        const config = {};
        // Parse fields
        for (const [key, textObj] of Object.entries(this.customFields)) {
            config[key] = parseInt(textObj.text);
        }
        // Parse toggles
        for (const [key, toggle] of Object.entries(this.customToggles)) {
            // Logic: if switch x > base + label + 25 (approx check from original)
            // Simpler: check color
            config[key] = (toggle.switch.fillColor === 0x4CAF50);
        }

        config.treasurePoints = 100; // Default

        if (this.onApply) this.onApply(config);
    }

    showError(msg) {
        // Simple error text
        const errorText = this.scene.add.text(0, 140, msg, { color: '#ff0000', fontSize: '14px' }).setOrigin(0.5);
        this.add(errorText);
        this.scene.time.delayedCall(3000, () => errorText.destroy());
    }
}
