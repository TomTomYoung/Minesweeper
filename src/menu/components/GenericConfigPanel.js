/**
 * GenericConfigPanel.js
 * 
 * A reusable configuration panel component that generates UI based on a schema.
 * 
 * @class GenericConfigPanel
 * @extends Phaser.GameObjects.Container
 * 
 * @specs Input (Constructor)
 *  - scene: Phaser.Scene
 *  - x, y: number - Position
 *  - width, height: number - Dimensions
 *  - config: object
 *      - title: string
 *      - fields: array of objects { key, label, min, max, default }
 *      - toggles: array of objects { key, label, default }
 *  - onApply: function(values) - Callback with config object
 *  - onCancel: function() - Callback on cancel
 * 
 * @specs Output
 *  - onApply(config): Returns object with key-value pairs from fields and toggles.
 * 
 * @dependencies
 *  - Phaser 3
 *  - MenuButton (Optional, can be replaced with standard text)
 */
class GenericConfigPanel extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, panelConfig, onApply, onCancel) {
        super(scene, x, y);
        scene.add.existing(this);

        this.width = width;
        this.height = height;
        this.panelConfig = panelConfig;
        this.onApply = onApply;
        this.onCancel = onCancel;

        this.fieldObjects = {};
        this.toggleObjects = {};

        this.createVisuals();
        this.setVisible(false);
    }

    createVisuals() {
        // Background
        const bg = this.scene.add.rectangle(0, 0, this.width, this.height, 0xf8f8f8)
            .setStrokeStyle(2, 0xdddddd)
            .setInteractive(); // Block input behind
        this.add(bg);

        // Title
        const titleText = this.panelConfig.title || 'Settings';
        const title = this.scene.add.text(0, -this.height / 2 + 30, titleText, {
            fontSize: '20px', fontWeight: 'bold', color: '#333'
        }).setOrigin(0.5);
        this.add(title);

        // Generate Fields
        this.createFields();

        // Footer Buttons
        const btnY = this.height / 2 - 40;
        this.createFooterButtons(btnY);
    }

    createFields() {
        const fields = this.panelConfig.fields || [];
        const toggles = this.panelConfig.toggles || [];

        let startY = -this.height / 2 + 80;
        const spacing = 30;

        // Number Fields
        fields.forEach((field, index) => {
            const y = startY + index * spacing;
            this.createNumberField(y, field);
        });

        // Toggles
        const toggleStartY = startY + fields.length * spacing;
        toggles.forEach((toggle, index) => {
            const y = toggleStartY + index * spacing;
            this.createToggle(y, toggle);
        });
    }

    createNumberField(y, field) {
        const xOffset = -100;

        // Label
        const label = this.scene.add.text(xOffset - 120, y, field.label, {
            fontSize: '16px', color: '#333'
        }).setOrigin(0, 0.5);

        // Value
        const valueText = this.scene.add.text(xOffset + 30, y, field.default.toString(), {
            fontSize: '16px', color: '#333'
        }).setOrigin(0.5);

        // Controls
        const btnStyle = { fontSize: '20px', color: '#333' };

        const decBtn = this.scene.add.text(xOffset - 25, y, '-', btnStyle)
            .setOrigin(0.5).setInteractive();

        const incBtn = this.scene.add.text(xOffset + 85, y, '+', btnStyle)
            .setOrigin(0.5).setInteractive();

        // Logic
        decBtn.on('pointerdown', () => {
            let val = parseInt(valueText.text);
            if (val > field.min) valueText.setText((val - 1).toString());
        });

        incBtn.on('pointerdown', () => {
            let val = parseInt(valueText.text);
            if (val < field.max) valueText.setText((val + 1).toString());
        });

        this.add([label, valueText, decBtn, incBtn]);
        this.fieldObjects[field.key] = valueText;
    }

    createToggle(y, toggle) {
        // Similar implementation to CustomPanel but generic
        const xOffset = -100;

        const label = this.scene.add.text(xOffset - 120, y, toggle.label, {
            fontSize: '16px', color: '#333'
        }).setOrigin(0, 0.5);

        const initialState = toggle.default;

        const switchBg = this.scene.add.rectangle(xOffset + 80, y, 50, 24)
            .setStrokeStyle(1, 0xcccccc).setInteractive();

        const switchKnob = this.scene.add.rectangle(
            initialState ? xOffset + 92 : xOffset + 68, y,
            18, 18, initialState ? 0x4CAF50 : 0xcccccc
        );

        switchBg.on('pointerdown', () => {
            const isOff = switchKnob.fillColor === 0xcccccc;
            if (isOff) {
                switchKnob.x = xOffset + 92;
                switchKnob.fillColor = 0x4CAF50;
            } else {
                switchKnob.x = xOffset + 68;
                switchKnob.fillColor = 0xcccccc;
            }
        });

        this.add([label, switchBg, switchKnob]);
        this.toggleObjects[toggle.key] = switchKnob;
    }

    createFooterButtons(y) {
        // If MenuButton is available use it, else generic text
        if (typeof MenuButton !== 'undefined') {
            const applyBtn = new MenuButton(this.scene, -80, y, 120, 40, 'Apply', 0x4CAF50, () => this.submit());
            const cancelBtn = new MenuButton(this.scene, 80, y, 120, 40, 'Cancel', 0xF44336, () => {
                if (this.onCancel) this.onCancel();
            });
            this.add([applyBtn, cancelBtn]);
        } else {
            // Fallback generic buttons
        }
    }

    submit() {
        const config = {};

        // Collect Fields
        for (const [key, obj] of Object.entries(this.fieldObjects)) {
            config[key] = parseInt(obj.text);
        }

        // Collect Toggles
        for (const [key, obj] of Object.entries(this.toggleObjects)) {
            config[key] = (obj.fillColor === 0x4CAF50);
        }

        if (this.onApply) this.onApply(config);
    }

    showError(msg) {
        const errorText = this.scene.add.text(0, this.height / 2 - 80, msg, {
            color: '#ff0000', fontSize: '14px', align: 'center', wordWrap: { width: this.width - 30 }
        }).setOrigin(0.5);
        this.add(errorText);
        this.scene.time.delayedCall(3000, () => errorText.destroy());
    }
}

