const UILayout = {
    getInfoPanelRect(width) {
        return { x: width / 2, y: 25, width: width };
    },

    getMessagePanelPosition(width) {
        return { x: width / 2, y: 80 };
    },

    getControlPanelRect(width, height) {
        const panelHeight = 60;
        return { x: width / 2, y: height - panelHeight / 2, width: width };
    },

    getZoomSliderConfig(width) {
        return {
            x: width - 120,
            y: 80,
            width: 150,
            height: 20
        };
    },

    getScrollBarVConfig(width, height) {
        return {
            x: width - 10,
            y: height / 2,
            width: 20,
            height: height - 120
        };
    },

    getScrollBarHConfig(width, height) {
        return {
            x: width / 2,
            y: height - 70,
            width: width - 40,
            height: 20
        };
    }
};
