import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, Mic, MicOff, Star, CheckCircle, RefreshCcw, Volume2 } from 'lucide-react';
import { AudioService } from '../lib/audioService';

const KOREAN_DIGITS = ['공', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];

const KOREAN_NUMBERS_MAP = {
    '영': 0, '공': 0, '일': 1, '하나': 1, '이': 2, '둘': 2, '삼': 3, '셋': 3,
    '사': 4, '넷': 4, '오': 5, '다섯': 5, '육': 6, '여섯': 6, '칠': 7, '일곱': 7,
    '팔': 8, '여덟': 8, '구': 9, '아홉': 9, '십': 10,
    '십일': 11, '십이': 12, '십삼': 13, '십사': 14, '십오': 15, '십육': 16, '십칠': 17, '십팔': 18, '십구': 19,
    '이십': 20, '삼십': 30, '사십': 40, '오십': 50, '육십': 60, '칠십': 70, '팔십': 80, '구십': 90
};

const getKoreanNumber = (num) => {
    if (num < 10) return KOREAN_DIGITS[num];
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
    const noBatchimList = ['이', '사', '오', '구'];
    const batchimList = ['일', '삼', '육', '칠', '팔', '십'];
    if (noBatchimList.some(c => lastChar.endsWith(c))) return '는';
    if (batchimList.some(c => lastChar.endsWith(c))) return '은';
    return '은';
};

export default function Learn() {
    const { dan } = useParams();
    const navigate = useNavigate();
    const danNum = parseInt(dan);

    const [mode, setMode] = useState('speaking'); // 'speaking' or 'listening'

    // Speaking Mode State
    const [currentStep, setCurrentStep] = useState(1);
    const [isListening, setIsListening] = useState(false);
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong'
    const [volume, setVolume] = useState(0);

    // Listening Mode State (Legacy)
    const [isPlaying, setIsPlaying] = useState(false);
    const [direction, setDirection] = useState('asc'); // 'asc' or 'desc'
    const [highlightedStep, setHighlightedStep] = useState(null);
    const isPlayingRef = useRef(false);
    const directionRef = useRef('asc');

    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Safety check
    if (isNaN(danNum) || danNum < 2 || danNum > 9) {
        return <div style={{ padding: '2rem' }}>잘못된 접근입니다.</div>;
    }

    // --- Speaking Mode Logic ---

    // Initialize Audio Context for Volume Meter
    const startVolumeMeter = async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) return;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const average = sum / dataArray.length;
                setVolume(average);
                animationFrameRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();
        } catch (e) {
            console.error("Audio meter error", e);
        }
    };

    const stopVolumeMeter = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
        setVolume(0);
    };

    const textToNumbers = (text) => {
        // Simple parser to extract numbers from Korean text
        // "이 일은 이" -> [2, 1, 2]
        // "2 1은 2" -> [2, 1, 2]

        // 1. First, replace known Korean number words with spaces surrounding them to isolate
        let processed = text;

        // Handle common digit strings
        processed = processed.replace(/[0-9]+/g, (match) => ` ${match} `);

        // Map Korean words to digits? 
        // Iterate KOREAN_NUMBERS_MAP keys and if found, replace with digit?
        // Be careful with substrings (e.g. '십' in '이십'). Sort by length descending.
        const sortedKeys = Object.keys(KOREAN_NUMBERS_MAP).sort((a, b) => b.length - a.length);

        // We will try to find numbers in the string
        // Actually, simpler approach: Split by space, parse each token.
        // But Speech API often groups "이십" as one token.

        // Let's create a cleaner string with only numbers and spaces
        let numberString = processed;
        sortedKeys.forEach(key => {
            const val = KOREAN_NUMBERS_MAP[key];
            // Replace key with just value
            numberString = numberString.split(key).join(` ${val} `);
        });

        // Split and filter
        const nums = numberString.split(/[^0-9]+/).filter(s => s.trim() !== '').map(Number);
        return nums;
    };

    const checkSpeech = (transcript) => {
        const nums = textToNumbers(transcript);
        const result = danNum * currentStep;

        // We need to find [danNum, currentStep, result] in order
        // e.g. [2, 1, 2]

        // Check if the sequence exists
        let matchIndex = 0;
        const target = [danNum, currentStep, result];

        for (let num of nums) {
            if (num === target[matchIndex]) {
                matchIndex++;
                if (matchIndex >= target.length) return true;
            }
        }
        return false;
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            startVolumeMeter();
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            console.log("Transcript:", transcript);

            if (event.results[0].isFinal) {
                if (checkSpeech(transcript)) {
                    // Correct!
                    AudioService.playCorrectSound();
                    setFeedback('correct');
                    recognition.stop();
                    setTimeout(() => {
                        setFeedback(null);
                        if (currentStep < 9) {
                            setCurrentStep(prev => prev + 1);
                        } else {
                            // Completed all!
                            // Play fanfare?
                            AudioService.playPerfectSound();
                            alert("와우! 모든 단계를 완료했어요! 참 잘했어요!");
                            navigate('/dashboard');
                        }
                    }, 1000);
                } else {
                    // Wrong
                    AudioService.playWrongSound();
                    setFeedback('wrong');
                    recognition.stop();
                    setTimeout(() => {
                        setFeedback(null);
                        // Restart listening automatically? Maybe better to let user click again or restart automatically
                    }, 1000);
                }
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            stopVolumeMeter();
            // If feedback is null (meaning no result or mid-process), maybe we should restart if user didn't speak?
            // But let's require manual click for now to avoid loops, unless successful.
            if (feedback === null && mode === 'speaking') {
                // Maybe auto-restart if silence? 
                // For now, let's keep it manual or auto-restart if we want continuous flow.
                // The user wants "Say correctly -> Next".
                // If silence, just stop.
            }
            if (feedback === 'correct' && currentStep < 9) {
                // Auto start next?
                setTimeout(() => startListening(), 1200);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
    };

    const toggleMic = () => {
        if (isListening) stopListening();
        else startListening();
    };

    // Auto-start listening when step changes or mode changes?
    // Maybe better to wait for user interaction to avoid permission issues loop.
    useEffect(() => {
        // Cleanup
        return () => {
            stopListening();
            stopVolumeMeter();
        };
    }, []);

    // --- Listening Mode Logic (Legacy) ---
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    useEffect(() => {
        directionRef.current = direction;
    }, [direction]);

    useEffect(() => {
        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => {
            window.speechSynthesis.cancel();
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const playSequence = (stepIndex) => {
        if (!isPlayingRef.current) return;
        const steps = directionRef.current === 'asc' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1];
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
        const voices = window.speechSynthesis.getVoices();
        const korVoice = voices.find(v => v.lang.includes('ko'));
        if (korVoice) utterance.voice = korVoice;

        utterance.onend = () => {
            if (isPlayingRef.current) setTimeout(() => playSequence(stepIndex + 1), 400);
        };
        utterance.onerror = () => {
            if (isPlayingRef.current) setTimeout(() => playSequence(stepIndex + 1), 500);
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
            // Wake up
            const dummy = new SpeechSynthesisUtterance('');
            dummy.volume = 0;
            window.speechSynthesis.speak(dummy);

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

    // --- Render ---

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', paddingTop: '3rem', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                    <button
                        onClick={() => { setMode('speaking'); setIsPlaying(false); window.speechSynthesis.cancel(); }}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: mode === 'speaking' ? '#fff' : 'transparent',
                            boxShadow: mode === 'speaking' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: mode === 'speaking' ? 'bold' : 'normal',
                            color: mode === 'speaking' ? '#3b82f6' : '#64748b',
                            fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                    >
                        <Mic size={16} /> 말하기
                    </button>
                    <button
                        onClick={() => { setMode('listening'); stopListening(); }}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: mode === 'listening' ? '#fff' : 'transparent',
                            boxShadow: mode === 'listening' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: mode === 'listening' ? 'bold' : 'normal',
                            color: mode === 'listening' ? '#3b82f6' : '#64748b',
                            fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                    >
                        <Volume2 size={16} /> 듣기
                    </button>
                </div>
                <div style={{ width: '40px' }}></div>
            </div>

            <h2 style={{ textAlign: 'center', margin: '0 0 1.5rem', fontSize: '1.8rem', fontWeight: 'bold' }}>
                {danNum}단 {mode === 'speaking' ? '말하기 도전!' : '듣기 연습'}
            </h2>

            {/* Speaking Mode UI */}
            {mode === 'speaking' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Status Card */}
                    <div style={{
                        background: feedback === 'wrong' ? '#fee2e2' : feedback === 'correct' ? '#dcfce7' : isListening ? '#eff6ff' : '#f8fafc',
                        padding: '1.5rem',
                        borderRadius: '20px',
                        textAlign: 'center',
                        border: `2px solid ${feedback === 'wrong' ? '#ef4444' : feedback === 'correct' ? '#22c55e' : isListening ? '#3b82f6' : '#e2e8f0'}`,
                        transition: 'all 0.3s ease'
                    }}>
                        <div style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#64748b' }}>
                            {feedback === 'correct' ? '정답입니다! 🎉' : feedback === 'wrong' ? '땡! 다시 말해보세요 😅' : isListening ? '듣고 있어요... 말해보세요!' : '마이크 버튼을 눌러 시작하세요'}
                        </div>

                        {/* Visualizer / Icon */}
                        <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isListening ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} style={{
                                            width: '6px',
                                            height: `${20 + Math.random() * volume * 2}px`,
                                            background: '#3b82f6',
                                            borderRadius: '3px',
                                            transition: 'height 0.1s ease'
                                        }} />
                                    ))}
                                </div>
                            ) : (
                                <MicOff size={40} color="#cbd5e1" />
                            )}
                        </div>
                    </div>

                    {/* Problem List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0 0.5rem' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(step => {
                            const isCurrent = step === currentStep;
                            const isDone = step < currentStep;

                            return (
                                <div key={step} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '1rem',
                                    borderRadius: '16px',
                                    background: isCurrent ? '#fff' : isDone ? '#f0fdf4' : '#f8fafc',
                                    border: isCurrent ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    opacity: isCurrent ? 1 : isDone ? 0.7 : 0.5,
                                    transform: isCurrent ? 'scale(1.02)' : 'scale(1)',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isCurrent ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none'
                                }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{danNum} × {step}</span>
                                    {isDone && <CheckCircle size={24} color="#22c55e" fill="#dcfce7" />}
                                    {isCurrent && <Mic size={24} className="animate-pulse" color="#3b82f6" />}
                                    {!isDone && !isCurrent && <div style={{ width: '24px' }}></div>}
                                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: isDone ? '#22c55e' : isCurrent ? '#3b82f6' : '#94a3b8' }}>
                                        {isDone || isCurrent ? danNum * step : '?'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Fixed Bottom Button */}
                    <div style={{ position: 'sticky', bottom: '1rem', left: 0, right: 0, paddingTop: '1rem', background: 'white' }}>
                        <button
                            className="btn btn-primary"
                            onClick={toggleMic}
                            style={{
                                width: '100%',
                                padding: '1.2rem',
                                fontSize: '1.2rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                background: isListening ? '#ef4444' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                borderRadius: '16px',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                            }}
                        >
                            {isListening ? (
                                <> <Square size={24} fill="currentColor" /> 멈추기 </>
                            ) : (
                                <> <Mic size={24} /> 말하기 시작 ({currentStep}단계) </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Listening Mode UI (Old) */}
            {mode === 'listening' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button
                            className={`btn ${isPlaying ? 'btn-outline' : 'btn-primary'}`}
                            onClick={togglePlay}
                            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            {isPlaying ? '멈춤' : '듣기 시작'}
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={toggleDirection}
                            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <RefreshCcw size={20} />
                            {direction === 'asc' ? '차례대로' : '거꾸로'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                        {currentStep && [1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => { // Just use constant array
                            const actualStep = direction === 'asc' ? step : (10 - step);
                            const isActive = actualStep === highlightedStep;
                            return (
                                <div key={actualStep} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.2rem',
                                    background: isActive ? '#3b82f6' : '#fff',
                                    color: isActive ? '#fff' : '#1e293b',
                                    borderBottom: '1px solid #f1f5f9'
                                }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{danNum} × {actualStep}</span>
                                    <span style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{danNum * actualStep}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
