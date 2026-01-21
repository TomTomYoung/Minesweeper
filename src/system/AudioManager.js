/**
 * AudioManager.js
 * 
 * Central system for managing audio playback.
 * Handles:
 * - SFX playback (with throttling/pooling if needed)
 * - BGM playback (looping, volume control)
 * - Mute/Unmute state
 */
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.isMuted = false;
        this.bgm = null;
    }

    playSfx(key, config = {}) {
        if (this.isMuted) return;
        if (!this.scene.sound.get(key)) {
            console.warn(`Audio key '${key}' not found.`);
            return;
        }
        this.scene.sound.play(key, config);
    }

    playBgm(key, config = { loop: true, volume: 0.5 }) {
        if (this.bgm) {
            this.bgm.stop();
        }

        if (!this.scene.sound.get(key)) {
            console.warn(`Audio key '${key}' not found.`);
            return;
        }

        this.bgm = this.scene.sound.add(key, config);
        if (!this.isMuted) {
            this.bgm.play();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.bgm) {
            if (this.isMuted) {
                this.bgm.pause();
            } else {
                this.bgm.resume();
            }
        }
        return this.isMuted;
    }
}
