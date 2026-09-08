const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { createContext, evaluate, loadScripts, projectRoot } = require('./helpers/load-scripts');

test('BootScene only preloads image assets that exist', () => {
    const loadedImages = [];
    const loadedAudio = [];
    const Phaser = { Scene: class {} };
    const context = createContext({ Phaser });

    loadScripts(context, ['src/scenes/BootScene.js']);
    const BootScene = evaluate(context, 'BootScene');
    const scene = new BootScene();
    scene.load = {
        image(key, assetPath) {
            loadedImages.push({ key, assetPath });
        },
        audio(key, assetPath) {
            loadedAudio.push({ key, assetPath });
        }
    };

    scene.loadAssets();

    assert.deepEqual(
        loadedImages.map(({ key }) => key),
        ['dummy', 'mine', 'flag', 'wall', 'treasure', 'stairs', 'enemy', 'key', 'sword']
    );
    for (const { assetPath } of loadedImages) {
        assert.equal(fs.existsSync(path.join(projectRoot, assetPath)), true, `${assetPath} must exist`);
    }
    assert.deepEqual(loadedAudio, []);
});
