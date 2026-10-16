const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const { projectRoot } = require('./helpers/load-scripts');

for (const entrypoint of ['normal.html', 'rpg.html', 'layered.html']) {
    test(`${entrypoint} pins the Phaser-compatible RexUI build before starting the game`, () => {
        const html = fs.readFileSync(`${projectRoot}/${entrypoint}`, 'utf8');
        const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
        const phaser = 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js';
        const rex = 'https://cdn.jsdelivr.net/gh/rexrainbow/phaser3-rex-notes@0112498f036d7ed0761c173d9ce665d67e728cdd/dist/rexuiplugin.min.js';
        assert.equal(scripts.filter(url => url.includes('rexuiplugin')).length, 1);
        assert.ok(scripts.includes(phaser));
        assert.ok(scripts.includes(rex));
        assert.ok(scripts.indexOf(phaser) < scripts.indexOf(rex));
        assert.ok(scripts.indexOf(rex) < scripts.indexOf('main.js'));
        assert.ok(!scripts.some(url => url.includes('phaser3-rex-notes/dist/')));
    });

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

