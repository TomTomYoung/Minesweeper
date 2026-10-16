class MessagePanel extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        scene.add.existing(this);

        this.createElements();
    }

    createElements() {
        this.messageText = this.scene.add.text(0, 0, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#333',
            align: 'center',
            wordWrap: { width: this.scene.cameras.main.width - 40 }
        }).setOrigin(0.5);
        this.add(this.messageText);
    }

    showMessage(data) {
        if (this.messageTimer) {
            this.messageTimer.remove();
        }

        this.messageText.setText(data.text);
        this.messageText.setColor(data.color || '#333');

        if (data.duration) {
            this.messageTimer = this.scene.time.delayedCall(data.duration, () => {
                this.messageText.setText('');
            });
        }
    }
}

