const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const { projectRoot } = require('./helpers/load-scripts');

for (const entrypoint of ['normal.html', 'rpg.html']) {
    test(`${entrypoint} loads the mode registry before GameSession`, () => {
        const html = fs.readFileSync(`${projectRoot}/${entrypoint}`, 'utf8');
        const boardModelIndex = html.indexOf('src/logic/BoardModel.js');
        const registryIndex = html.indexOf('src/logic/modes/GameModeRegistry.js');
        const sessionIndex = html.indexOf('src/logic/GameSession.js');

        assert.notEqual(boardModelIndex, -1);
        assert.notEqual(registryIndex, -1);
        assert.notEqual(sessionIndex, -1);
        assert.equal(boardModelIndex < registryIndex && registryIndex < sessionIndex, true);
    });
}
