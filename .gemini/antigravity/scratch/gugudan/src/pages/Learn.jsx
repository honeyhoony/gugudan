import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, ArrowDown, ArrowUp } from 'lucide-react';

const KOREAN_DIGITS = ['공', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];

const getKoreanNumber = (num) => {
    // 1-9
    if (num < 10) return KOREAN_DIGITS[num];
    // 10-99
    const tens = Math.floor(num / 10);
    const ones = num % 10;

    let str = '';
    if (tens > 1) str += KOREAN_DIGITS[tens];
    if (tens > 0) str += '십';
    if (ones > 0) str += KOREAN_DIGITS[ones];
    return str;
};

const getBatchimSuffix = (word) => {
    const lastChar = word.slice(-1);
    // Common Korean numbers ending with vowel (no batchim)
    const noBatchimList = ['이', '사', '오', '구'];
    // Numbers ending with consonant (batchim present)
    const batchimList = ['일', '삼', '육', '칠', '팔', '십'];

    // Check if the last character is in our known lists
    if (noBatchimList.some(c => lastChar.endsWith(c))) return '는';
    if (batchimList.some(c => lastChar.endsWith(c))) return '은';

    // Fallback for full Hangul analysis if needed, but for Gugudan this covers 1-9 & 10-81
    // 10(Sip-Eun), 12(Yi-Neun), 14(Sa-Neun)...
    return '은';
};

export default function Learn() {
    const { dan } = useParams();
    const navigate = useNavigate();

    const [isPlaying, setIsPlaying] = useState(false);
    const [direction, setDirection] = useState('asc'); // 'asc' or 'desc'
    const [highlightedStep, setHighlightedStep] = useState(null);

    const isPlayingRef = useRef(false);
    const directionRef = useRef('asc');

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    useEffect(() => {
        directionRef.current = direction;
    }, [direction]);

    const danNum = parseInt(dan);

    const processingRef = useRef(false);

    // Cleanup on unmount AND ensure voices are loaded
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            console.log("Voices loaded:", voices.length);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.cancel();
            window.speechSynthesis.onvoiceschanged = null;
            isPlayingRef.current = false;
        };
    }, []);

    const playSequence = (stepIndex) => {
        if (!isPlayingRef.current) return;

        const steps = directionRef.current === 'asc'
            ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
            : [9, 8, 7, 6, 5, 4, 3, 2, 1];

        if (stepIndex >= steps.length) {
            setIsPlaying(false);
            setHighlightedStep(null);
            return;
        }

        const step = steps[stepIndex];
        setHighlightedStep(step);

        const result = danNum * step;

        const txtDan = KOREAN_DIGITS[danNum];
        const txtStep = KOREAN_DIGITS[step];
        const txtResult = getKoreanNumber(result);
        const suffix = getBatchimSuffix(txtStep);

        const text = `${txtDan} ${txtStep}${suffix}, ${txtResult}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;

        // Try to find a Korean voice
        const voices = window.speechSynthesis.getVoices();
        const korVoice = voices.find(v => v.lang.includes('ko'));
        if (korVoice) utterance.voice = korVoice;

        utterance.onend = () => {
            if (isPlayingRef.current) {
                setTimeout(() => {
                    playSequence(stepIndex + 1);
                }, 400);
            }
        };

        utterance.onerror = (e) => {
            console.error("Speech error", e);
            if (isPlayingRef.current) {
                setTimeout(() => playSequence(stepIndex + 1), 500);
            }
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const togglePlay = () => {
        if (isPlaying) {
            setIsPlaying(false);
            setHighlightedStep(null);
            window.speechSynthesis.cancel();
        } else {
            setIsPlaying(true);
            playSequence(0);
        }
    };

    const toggleDirection = () => {
        setIsPlaying(false);
        setHighlightedStep(null);
        window.speechSynthesis.cancel();
        setDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };


    if (isNaN(danNum) || danNum < 2 || danNum > 9) {
        return <div style={{ padding: '2rem' }}>잘못된 접근입니다.</div>;
    }

    const displaySteps = direction === 'asc' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1];

    return (
        <div className="card animate-pop" style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', minHeight: '100vh', background: '#fff', borderRadius: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => { navigate('/dashboard'); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>📢 {danNum}단 듣기</h2>
                <div style={{ width: '40px' }}></div>
            </div>

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`btn ${isPlaying ? 'btn-outline' : 'btn-primary'}`}
                    onClick={togglePlay}
                    style={{
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '1.1rem'
                    }}
                >
                    {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    {isPlaying ? '멈춤' : '듣기 시작'}
                </button>

                <button
                    className="btn btn-outline"
                    onClick={toggleDirection}
                    style={{ padding: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    {direction === 'asc' ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
                    {direction === 'asc' ? '차례대로' : '거꾸로'}
                </button>
            </div>

            {/* List */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                overflow: 'hidden'
            }}>
                {displaySteps.map((step) => {
                    const isActive = step === highlightedStep;
                    return (
                        <div
                            key={step}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.8rem 1rem',
                                borderRadius: '12px',
                                background: isActive ? '#3b82f6' : 'white',
                                color: isActive ? 'white' : '#1e293b',
                                borderBottom: '1px solid #f1f5f9',
                                transition: 'all 0.2s ease',
                                opacity: isPlaying && !isActive ? 0.3 : 1
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {danNum} × {step}
                            </span>
                            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: isActive ? 'white' : '#3b82f6' }}>
                                {danNum * step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
