class TreasureCell extends Cell {
    constructor(scene, x, y, size, row, col) {
        super(scene, x, y, size, row, col);
        this.setType('treasure');
    }

    renderReveal() {
        this.background.setFillStyle(GAME_CONFIG.CELL_COLORS.TREASURE);
        this.setIconTexture('treasure');
        this.icon.setVisible(true);
    }

    renderStateUpdate(state) {
        if (state.state !== 2) return;
        this.setIconTexture('treasure_open');
        this.icon.setVisible(true).setAlpha(0.75);
        this.background.setFillStyle(0xeee8d9);
        const texture = { gold:'gold', key:'key', sword:'sword' }[state.treasureContent];
        if (texture) this.setStatusBadge(texture);
    }
}
