const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame } = require('./helpers/game-context');

function mixerFixture() {
    const game = loadGame();
    const calls = [];
    const scene = {
        cache: { audio: { exists: key => key !== 'missing' } },
        sound: {
            play(key, options) { calls.push(['sfx', key, options.volume]); },
            add(key, options) {
                calls.push(['add', key, options.loop]);
                return {
                    isPlaying: false, isPaused: false, volume: options.volume,
                    play() { this.isPlaying = true; this.isPaused = false; calls.push(['play', key]); },
                    pause() { this.isPlaying = false; this.isPaused = true; },
                    resume() { this.isPlaying = true; this.isPaused = false; },
                    stop() { this.isPlaying = false; calls.push(['stop', key]); },
                    destroy() { calls.push(['destroy', key]); },
                    setVolume(value) { this.volume = value; }
                };
            }
        }
    };
    return { mixer: new (game.get('AudioManager'))(scene), calls };
}

test('cached SFX play on first use, missing sounds are ignored, repeated events are throttled', () => {
    const { mixer, calls } = mixerFixture();
    assert.equal(mixer.playSfx('pickup'), true);
    assert.equal(mixer.playSfx('pickup'), false);
    assert.equal(mixer.playSfx('missing'), false);
    mixer.toggleMute();
    assert.equal(mixer.playSfx('enemy_defeat'), false);
    assert.deepEqual(calls, [['sfx', 'pickup', 0.35]]);
});

test('BGM survives a floor restart without duplication and releases the previous scene track', () => {
    const { mixer, calls } = mixerFixture();
    mixer.playBgm('bgm_explore');
    const first = mixer.bgm;
    mixer.playBgm('bgm_explore');
    assert.equal(mixer.bgm, first);
    assert.equal(calls.filter(call => call[0] === 'add').length, 1);
    mixer.playBgm('bgm_menu');
    assert.equal(calls.some(call => call[0] === 'destroy' && call[1] === 'bgm_explore'), true);
    assert.equal(first.isPlaying, false);
    assert.equal(mixer.bgm.isPlaying, true);
});

test('mute and zero volume remain effective across BGM changes, and can resume later', () => {
    const { mixer } = mixerFixture();
    mixer.toggleMute(); mixer.playBgm('bgm_menu');
    assert.equal(mixer.bgm.isPlaying, false);
    mixer.setVolume(0.8);
    assert.equal(mixer.bgm.isPlaying, false);
    mixer.toggleMute();
    assert.equal(mixer.bgm.isPlaying, true);
    mixer.setVolume(0); mixer.toggleMute(); mixer.toggleMute();
    assert.equal(mixer.bgm.isPlaying, false);
    mixer.playBgm('bgm_explore');
    assert.equal(mixer.bgm.isPlaying, false);
    mixer.setVolume(0.5);
    assert.equal(mixer.bgm.isPlaying, true);
    assert.equal(mixer.bgm.volume, 0.14);
    mixer.setVolume(2); assert.equal(mixer.volume, 1);
    mixer.setVolume(-1); assert.equal(mixer.volume, 0);
});

test('non-square source frames keep their proportions when fitted to cells', () => {
    const game = loadGame();
    const image = {frame:{realWidth:640, realHeight:320}, setScale(value) { this.scale = value; }};
    game.get('AssetPresentation').fit(image, 40);
    assert.equal(image.scale * image.frame.realWidth, 40);
    assert.equal(image.scale * image.frame.realHeight, 20);
});

test('menu button still invokes its action after audio feedback', () => {
    const game = loadGame();
    const handlers = {}, calls = [];
    const bg = {setInteractive() { return this; }, on(event, callback) { handlers[event] = callback; return this; }};
    const scene = {game:{audio:{playSfx(key) { calls.push(key); }}}, add:{
        rectangle() { return bg; }, text() { return {setOrigin() { return this; }}; }
    }};
    const button = Object.create(game.get('MenuButton').prototype);
    Object.assign(button, {scene, width:200, height:50, baseColor:0, add() {}});
    button.createVisuals('開始', () => calls.push('start'));
    handlers.pointerdown();
    assert.deepEqual(calls, ['ui_click', 'start']);
});
