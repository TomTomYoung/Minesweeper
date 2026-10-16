class TreasureCell extends Cell {
    constructor(scene, x, y, size, row, col) {
        super(scene, x, y, size, row, col);
        this.setType('treasure');
    }

    renderReveal() {
        this.background.setFillStyle(GAME_CONFIG.CELL_COLORS.TREASURE);
        if (this.icon.setTexture) this.icon.setTexture('treasure');
        this.icon.setVisible(true);
    }

    renderStateUpdate(state) {
        if (state.state !== 2) return;
        const texture = { gold: 'treasure', key: 'key', sword: 'sword' }[state.treasureContent];
        if (texture && this.icon.setTexture) this.icon.setTexture(texture);
        this.icon.setVisible(true);
        this.icon.setAlpha(0.6);
        this.background.setFillStyle(0xe0e0e0);
    }
}
