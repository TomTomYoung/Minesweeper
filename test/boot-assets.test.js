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

    loadScripts(context, ['src/assets.js', 'src/scenes/BootScene.js']);
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
        ['treasure', 'treasure_open', 'gold', 'mine', 'flag', 'wall', 'key', 'sword', 'stairs', 'enemy', 'enemy_defeated', 'menu_background', 'pickaxe']
    );
    for (const { assetPath } of loadedImages) {
        assert.equal(fs.existsSync(path.join(projectRoot, assetPath)), true, `${assetPath} must exist`);
    }
    assert.equal(loadedAudio.length, 12);
    for (const { assetPath } of loadedAudio) {
        const data = fs.readFileSync(path.join(projectRoot, assetPath));
        assert.equal(data.toString('ascii', 0, 4), assetPath.endsWith('.ogg') ? 'OggS' : 'RIFF');
    }
});

test('all catalog images match the recorded export format and digest', () => {
    const crypto = require('node:crypto');
    const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'assets/v2/production.json')));
    assert.equal(manifest.images.length, 26);
    for (const entry of manifest.images) {
        const data = fs.readFileSync(path.join(projectRoot, entry.export.path));
        assert.equal(crypto.createHash('sha256').update(data).digest('hex'), entry.export.sha256, entry.id);
        if (entry.id === 'menu_background') {
            assert.equal(data.subarray(0, 3).toString('hex'), 'ffd8ff');
        } else {
            assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
            assert.equal(data.readUInt32BE(16), 256);
            assert.equal(data.readUInt32BE(20), 256);
            assert.equal(data[25], 6, `${entry.id} must have RGBA channels`);
        }
    }
});

