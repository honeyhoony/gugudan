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

    static playCorrectSound() {
        this.init();
        const t = this.audioCtx.currentTime;

        // Stadium-like cheering (White noise with resonant filtering)
        const bufferSize = this.audioCtx.sampleRate * 1.5;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.Q.value = 1;

        const env = this.audioCtx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.3, t + 0.1);
        env.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

        noise.connect(filter);
        filter.connect(env);
        env.connect(this.audioCtx.destination);
        noise.start(t);
        noise.stop(t + 1.5);

        // Add a high-pitched "woo!" whistle
        const osc = this.audioCtx.createOscillator();
        const oscEnv = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(1800, t + 0.1);
        oscEnv.gain.setValueAtTime(0.1, t);
        oscEnv.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.connect(oscEnv);
        oscEnv.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.5);
    }

    static playWrongSound() {
        this.init();
        const t = this.audioCtx.currentTime;

        // Disappointed crowd "Aww" (Low pass noise)
        const bufferSize = this.audioCtx.sampleRate * 1.0;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.8);

        const env = this.audioCtx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.2, t + 0.1);
        env.gain.exponentialRampToValueAtTime(0.01, t + 0.9);

        noise.connect(filter);
        filter.connect(env);
        env.connect(this.audioCtx.destination);
        noise.start(t);
        noise.stop(t + 1.0);
    }

    static playPerfectSound() {
        this.init();
        const t = this.audioCtx.currentTime;
        // Epic fanfare
        const chords = [
            [523.25, 659.25, 783.99], // C
            [659.25, 830.61, 987.77], // E
            [783.99, 987.77, 1174.66] // G
        ];

        chords.forEach((chord, i) => {
            chord.forEach(f => {
                const osc = this.audioCtx.createOscillator();
                const env = this.audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(f, t + i * 0.3);
                env.gain.setValueAtTime(0, t + i * 0.3);
                env.gain.linearRampToValueAtTime(0.1, t + i * 0.3 + 0.05);
                env.gain.exponentialRampToValueAtTime(0.01, t + i * 0.3 + 0.4);
                osc.connect(env);
                env.connect(this.audioCtx.destination);
                osc.start(t + i * 0.3);
                osc.stop(t + i * 0.3 + 0.5);
            });
        });

        // Massive Cheer
        setTimeout(() => this.playCorrectSound(), 500);
    }
}
