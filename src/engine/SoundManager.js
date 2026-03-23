export class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isPaused = false;
        const initAudio = () => {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
        window.addEventListener('click', initAudio);
        window.addEventListener('keydown', initAudio);
    }

    play(type) {
        if (!this.ctx || this.isMuted || this.isPaused) return;

        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        switch (type) {
            case 'dig':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, time);
                osc.frequency.exponentialRampToValueAtTime(50, time + 0.05);
                gain.gain.setValueAtTime(0.2, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
                osc.start(time);
                osc.stop(time + 0.05);
                break;
            case 'gold':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, time);
                osc.frequency.setTargetAtTime(1200, time, 0.1);
                gain.gain.setValueAtTime(0.3, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
                osc.start(time);
                osc.stop(time + 0.2);
                break;
            case 'deposit':
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, time);
                osc.frequency.setValueAtTime(600, time + 0.1);
                gain.gain.setValueAtTime(0.3, time);
                gain.gain.linearRampToValueAtTime(0, time + 0.2);
                osc.start(time);
                osc.stop(time + 0.2);
                break;
            case 'explode':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, time);
                osc.frequency.exponentialRampToValueAtTime(10, time + 0.3);
                gain.gain.setValueAtTime(0.5, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
                osc.start(time);
                osc.stop(time + 0.3);
                break;
            case 'death':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, time);
                osc.frequency.exponentialRampToValueAtTime(50, time + 0.15);
                gain.gain.setValueAtTime(0.4, time);
                gain.gain.linearRampToValueAtTime(0, time + 0.15);
                osc.start(time);
                osc.stop(time + 0.15);
                break;
        }
    }

    startAmbience() {}
}
