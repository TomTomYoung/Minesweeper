const MenuLayout = {
    getTitlePosition(width) {
        return { x: width / 2, y: 80 };
    },

    getSubtitlePosition(width) {
        return { x: width / 2, y: 130 };
    },

    getModeSelectorPosition(width) {
        return { x: width / 2, y: 180 };
    },

    getDifficultySelectorPosition(width) {
        return { x: width / 2, y: 250 };
    },

    getCustomButtonPosition(width) {
        return { x: width / 2, y: 330 };
    },

    getCustomPanelPosition(width, height) {
        return { x: width / 2, y: height / 2 + 50 };
    }
};
