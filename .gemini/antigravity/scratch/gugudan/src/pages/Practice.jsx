import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameLogic } from '../lib/gameLogic';
import { useUser } from '../context/UserContext';
import confetti from 'canvas-confetti';
import { X, Mic, MicOff, Timer } from 'lucide-react';
import ResultModal from '../components/ResultModal';
import NumericKeypad from '../components/NumericKeypad';

const KOREAN_NUMBERS = {
    '영': 0, '공': 0, '일': 1, '하나': 1, '이': 2, '둘': 2, '삼': 3, '셋': 3,
    '사': 4, '넷': 4, '오': 5, '다섯': 5, '육': 6, '여섯': 6, '칠': 7, '일곱': 7,
    '팔': 8, '여덟': 8, '구': 9, '아홉': 9, '십': 10,
    '이십': 20, '삼십': 30, '사십': 40, '오십': 50, '육십': 60, '칠십': 70, '팔십': 80, '구십': 90
};

const parseKoreanNumber = (text) => {
    let numStr = text.replace(/[^0-9]/g, '');
    if (numStr) return parseInt(numStr);

    let total = 0;
    let found = false;
    for (const [word, val] of Object.entries(KOREAN_NUMBERS)) {
        if (text.includes(word)) {
            total += val;
            found = true;
        }
    }
    return found ? total : null;
};

export default function Practice() {
    const { state } = useLocation();
    const { user, updateStats, settings } = useUser();
    const navigate = useNavigate();

    const [problems, setProblems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [stats, setStats] = useState({ correct: 0, wrong: 0 });
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [volume, setVolume] = useState(0);

    const wrongProblemsRef = useRef([]);
    const timerRef = useRef(null);
    const [timeLeft, setTimeLeft] = useState(10);
    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const activeRef = useRef(true);

    // Ref to always have the latest state for handlers
    const stateRef = useRef({ currentIndex, problems, feedback, gameOver, inputValue });
    useEffect(() => {
        stateRef.current = { currentIndex, problems, feedback, gameOver, inputValue };
    }, [currentIndex, problems, feedback, gameOver, inputValue]);

    const mode = state?.mode || 'random';
    const selectedDans = state?.dans || [2, 3, 4, 5, 6, 7, 8, 9];
    const voiceEnabled = settings?.voiceEnabled && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    // Audio Analyzer Setup
    const startVolumeMeter = async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) return;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!activeRef.current) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
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
                if (!activeRef.current) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                setVolume(average);
                animationFrameRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();
        } catch (e) {
            console.error("Audio meter error", e);
        }
    };

    const handleAnswer = useCallback((val = null, isTimeout = false) => {
        // Use Ref for current state to avoid being a dependency for everything else
        const { currentIndex, problems, feedback, gameOver, inputValue } = stateRef.current;
        if (feedback || gameOver || !problems[currentIndex]) return;

        const currentProblem = problems[currentIndex];
        const answer = currentProblem.a * currentProblem.b;
        const input = val !== null ? parseInt(val) : parseInt(inputValue);

        if (isNaN(input) && !isTimeout) return;

        const isCorrect = !isTimeout && input === answer;

        if (timerRef.current) clearInterval(timerRef.current);
        setFeedback(isCorrect ? 'correct' : 'wrong');
        updateStats(currentProblem.a, currentProblem.b, isCorrect);

        if (isCorrect) {
            setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
            setCombo(prev => {
                const nc = prev + 1;
                if (nc > maxCombo) setMaxCombo(nc);
                return nc;
            });
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
            setTimeout(() => nextProblem(), 800);
        } else {
            setStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
            setCombo(0);
            wrongProblemsRef.current.push(currentProblem);
            setTimeout(() => nextProblem(), 2000);
        }
    }, [updateStats, maxCombo]); // Dependencies reduced!

    const nextProblem = useCallback(() => {
        if (!activeRef.current) return;
        const { currentIndex, problems } = stateRef.current;
        if (currentIndex + 1 >= problems.length) {
            setGameOver(true);
        } else {
            setCurrentIndex(prev => prev + 1);
            setInputValue('');
            setFeedback(null);
        }
    }, []);

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(10);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    clearInterval(timerRef.current);
                    handleAnswer(null, true);
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);
    }, [handleAnswer]);

    const speakProblem = useCallback((a, b) => {
        if (!voiceEnabled) return;
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance();
        msg.text = `${a} 곱하기 ${b}는?`;
        msg.lang = 'ko-KR';
        msg.rate = 1.3;
        window.speechSynthesis.speak(msg);

        if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) { }
        }
    }, [voiceEnabled]);

    // Initialize problems and voice
    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true });
            return;
        }

        let pList = [];
        if (mode === 'order') pList = GameLogic.getOrderProblems(selectedDans);
        else if (mode === 'reverse') pList = GameLogic.getReverseProblems(selectedDans);
        else if (mode === 'random') pList = GameLogic.getRandomProblems(30, selectedDans);
        else if (mode === 'exam') pList = GameLogic.getRandomProblems(20, selectedDans);
        else if (mode === 'retry-wrong') pList = state?.wrongProblems || [];
        else pList = GameLogic.getRandomProblems(30, selectedDans);

        if (pList.length === 0) {
            navigate('/dashboard', { replace: true });
            return;
        }

        setProblems(pList);

        if (voiceEnabled) {
            startVolumeMeter();
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'ko-KR';
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript.trim();
                console.log("Speech Result:", transcript);
                const number = parseKoreanNumber(transcript);
                if (number !== null) handleAnswer(number);
            };

            recognitionRef.current.onend = () => {
                const { feedback, gameOver } = stateRef.current;
                if (activeRef.current && !feedback && !gameOver) {
                    try { recognitionRef.current.start(); } catch (e) { }
                }
            };
        }

        return () => {
            activeRef.current = false;
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
            if (audioContextRef.current) audioContextRef.current.close();
            window.speechSynthesis.cancel();
        };
    }, []);

    // Effect for Speaking PROBLEM - ONLY when currentIndex changes
    useEffect(() => {
        if (problems.length > 0 && currentIndex < problems.length && !gameOver && !feedback) {
            speakProblem(problems[currentIndex].a, problems[currentIndex].b);
        }
    }, [currentIndex, problems.length > 0]); // ONLY on new problem

    // Effect for Timer - Start when feedback is cleared (i.e. new problem)
    useEffect(() => {
        if (problems.length > 0 && currentIndex < problems.length && !gameOver && !feedback) {
            startTimer();
        }
    }, [currentIndex, feedback === null]);

    const handleKeypress = (key) => {
        if (feedback || gameOver) return;
        setInputValue(prev => (prev.length < 3 ? prev + key : prev));
    };

    const handleBackspace = () => {
        if (feedback || gameOver) return;
        setInputValue(prev => prev.slice(0, -1));
    };

    const handleQuit = () => {
        if (window.confirm("그만둘까요?")) {
            navigate('/dashboard', { replace: true });
        }
    };

    if (gameOver) {
        return <ResultModal
            stats={stats}
            maxCombo={maxCombo}
            wrongProblems={wrongProblemsRef.current}
            onHome={() => navigate('/dashboard', { replace: true })}
            onRetry={() => window.location.reload()}
        />;
    }

    if (problems.length === 0) return <div style={{ textAlign: 'center', marginTop: '5rem' }}>준비 중...</div>;

    const currentProblem = problems[currentIndex];

    return (
        <div className="card animate-pop" style={{
            maxWidth: '500px', width: '95%', margin: '0.5rem auto', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ background: '#333', color: '#fff', padding: '2px 10px', borderRadius: '15px', fontSize: '0.8rem' }}>
                    {currentIndex + 1} / {problems.length}
                </span>
                <button onClick={handleQuit} style={{ border: 'none', background: 'transparent', color: '#999' }}><X size={20} /></button>
            </div>

            <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden', marginTop: '0.4rem' }}>
                <div style={{ width: `${(timeLeft / 10) * 100}%`, height: '100%', background: timeLeft < 3 ? '#ff4757' : '#3b82f6', transition: 'width 0.1s linear' }} />
            </div>

            <div style={{ minHeight: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
                {combo > 1 && !feedback && <span style={{ color: '#ff4757', fontWeight: 'bold' }}>🔥 {combo}연속!</span>}
                {feedback === 'wrong' && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>땡! 정답: {currentProblem.a * currentProblem.b}</span>}
                {feedback === 'correct' && <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>정답! ✨</span>}
            </div>

            <div style={{ fontSize: '3.5rem', textAlign: 'center', fontWeight: 'bold', margin: '0.2rem 0' }}>
                {currentProblem.a} × {currentProblem.b} = <span style={{ color: feedback === 'wrong' ? '#ef4444' : 'inherit' }}>{inputValue || '?'}</span>
            </div>

            {!feedback && (
                <NumericKeypad
                    onPress={handleKeypress}
                    onBackspace={handleBackspace}
                    onSubmit={() => handleAnswer()}
                    value={inputValue}
                />
            )}

            {voiceEnabled && (
                <div style={{ textAlign: 'center', marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Inner Circle pulsating with volume */}
                            <div style={{
                                position: 'absolute',
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.2)',
                                transform: `scale(${1 + volume / 100})`,
                                transition: 'transform 0.1s ease-out'
                            }} />
                            <Mic size={16} color="#3b82f6" style={{ position: 'relative', zIndex: 1 }} />
                        </div>

                        {/* Bars visualizer */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => {
                                // Dynamic height based on volume
                                const h = Math.min(100, (volume * (1 + i * 0.1)));
                                return (
                                    <div key={i} style={{
                                        width: '3px',
                                        height: `${Math.max(2, h / 4)}px`,
                                        background: h > 50 ? '#3b82f6' : '#93c5fd',
                                        borderRadius: '2px',
                                        transition: 'height 0.05s ease-out'
                                    }} />
                                );
                            })}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 'bold' }}>목소리 인식 중</span>
                    </div>
                </div>
            )}
        </div>
    );
}
