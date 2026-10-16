/** Renders the visible surface only; the base appears after its own reveal. */
class LayeredCellView extends Cell {
    updateState(state) {
        this.viewData = state;
        this.revealed = state.isRevealed;
        this.flagged = state.isFlagged;
        this.type = 'layered';
        this.text.setText('').setVisible(false);
        this.icon.setVisible(false).setAlpha(1);
        if (this.statusBadge) this.statusBadge.setVisible(false);
        if (this.detailText) this.detailText.setVisible(false);
        this.tile.setVisible(!this.revealed);
        this.background.setFillStyle(0xe7e1d2);
        if (this.flagged) {
            this.setIconTexture('flag'); this.icon.setVisible(true); return;
        }
        if (!this.revealed) return;
        const texture = state.coverType || {
            mine: 'mine', treasure: state.collected ? 'treasure_open' : 'treasure', stairs: 'stairs'
        }[state.baseType];
        if (texture) { this.setIconTexture(texture); this.icon.setVisible(true); }
        if (state.coverType) {
            this.showDetail('覆', '#534330');
            if (state.showUnderCover) {
                const under = { mine: 'mine', treasure: 'treasure', stairs: 'stairs' }[state.baseType];
                if (under) this.setStatusBadge(under);
                else this.showDetail(String(state.neighborMines), '#234c6d');
            }
        } else if (state.baseType === 'treasure') {
            const content = { gold: 'gold', key: 'key', sword: 'sword', pickaxe: 'pickaxe' }[state.treasureContent];
            if (content) this.setStatusBadge(content);
            if (state.amount > 1) this.showDetail(`×${state.amount}`, '#294c3e');
            if (state.collected) this.icon.setAlpha(0.6);
        } else if (state.baseType === 'stairs') {
            this.setUnlocked(!!this.unlocked);
        } else if (state.baseType === 'number') {
            this.text.setText(String(state.neighborMines)).setVisible(true)
                .setColor('#' + GAME_CONFIG.NUMBER_COLORS[state.neighborMines].toString(16).padStart(6, '0'));
        }
    }

    showDetail(text, color) {
        if (!this.detailText) {
            this.detailText = this.scene.add.text(2, 1, '', {
                fontSize: `${Math.max(10, Math.floor(this.size * 0.3))}px`,
                fontFamily: 'Arial', backgroundColor: '#fff7e5', padding: { x: 1, y: 0 }
            });
            this.add(this.detailText);
        }
        this.detailText.setText(text).setColor(color).setVisible(true);
    }

    setUnlocked(unlocked) {
        this.unlocked = unlocked;
        if (this.revealed && !this.viewData?.coverType && this.viewData?.baseType === 'stairs') {
            this.setStatusBadge(unlocked ? 'ui_check' : 'ui_lock');
        }
    }
}
