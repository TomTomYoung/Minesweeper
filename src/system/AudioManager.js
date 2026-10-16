// One game-owned mixer survives scene restarts. Sounds are explicitly cache-checked.
class AudioManager {
    constructor(scene) {
        this.sound = scene.sound;
        this.cache = scene.cache.audio;
        this.isMuted = false;
        this.volume = 0.35;
        this.bgm = null;
        this.track = null;
        this.lastPlayed = new Map();
    }

    playSfx(key, config = {}) {
        if (this.isMuted || this.volume === 0 || !this.cache.exists(key)) return false;
        const now = Date.now();
        if (now - (this.lastPlayed.get(key) || 0) < 45) return false;
        this.lastPlayed.set(key, now);
        this.sound.play(key, { ...config, volume:this.volume * (config.volume ?? 1) });
        return true;
    }

    playBgm(key) {
        if (this.track === key && this.bgm) return;
        if (this.bgm) { this.bgm.stop(); this.bgm.destroy(); this.bgm = null; }
        this.track = key;
        if (!this.cache.exists(key)) return;
        this.bgm = this.sound.add(key, { loop:true, volume:this.volume * 0.28 });
        if (!this.isMuted && this.volume > 0) this.bgm.play();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.bgm) {
            if (this.isMuted) this.bgm.pause();
            else if (this.bgm.isPaused && this.volume > 0) this.bgm.resume();
            else if (!this.bgm.isPlaying && this.volume > 0) this.bgm.play();
        }
        return this.isMuted;
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.bgm) {
            this.bgm.setVolume(this.volume * 0.28);
            if (this.volume === 0) this.bgm.pause();
            else if (!this.isMuted) {
                if (this.bgm.isPaused) this.bgm.resume();
                else if (!this.bgm.isPlaying) this.bgm.play();
            }
        }
    }
}
