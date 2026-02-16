export class AudioService {
    static audioCtx = null;
    static isPlaying = false;
    static lastTime = 0;
    static timerId = null;

    static init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    static playKick(time) {
        const osc = this.audioCtx.createOscillator();
        const env = this.audioCtx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
        env.gain.setValueAtTime(1, time);
        env.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        osc.connect(env);
        env.connect(this.audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.15);
    }

    static playHiHat(time) {
        const bufferSize = this.audioCtx.sampleRate * 0.05;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;
        const env = this.audioCtx.createGain();
        env.gain.setValueAtTime(0.3, time);
        env.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        source.connect(filter);
        filter.connect(env);
        env.connect(this.audioCtx.destination);
        source.start(time);
        source.stop(time + 0.05);
    }

    static playBass(time, freq) {
        const osc = this.audioCtx.createOscillator();
        const env = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        env.gain.setValueAtTime(0.2, time);
        env.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, time);
        osc.connect(filter);
        filter.connect(env);
        env.connect(this.audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    static startExamBGM() {
        this.init();
        if (this.isPlaying) return;
        this.isPlaying = true;

        const bpm = 145;
        const stepTime = 60 / bpm / 4;
        let step = 0;

        const scheduler = () => {
            while (this.lastTime < this.audioCtx.currentTime + 0.1) {
                if (step % 4 === 0) this.playKick(this.lastTime);
                if (step % 2 === 1) this.playHiHat(this.lastTime);

                // Bassline pattern
                const bassPattern = [55, 0, 55, 48, 55, 0, 60, 48];
                const freq = bassPattern[step % 8];
                if (freq > 0) this.playBass(this.lastTime, freq);

                this.lastTime += stepTime;
                step++;
            }
            this.timerId = setTimeout(scheduler, 25);
        };

        this.lastTime = this.audioCtx.currentTime;
        scheduler();
    }

    static stopBGM() {
        this.isPlaying = false;
        if (this.timerId) clearTimeout(this.timerId);
    }
}
