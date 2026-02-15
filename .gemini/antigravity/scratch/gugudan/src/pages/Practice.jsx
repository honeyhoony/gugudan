import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameLogic } from '../lib/gameLogic';
import { useUser } from '../context/UserContext';
import confetti from 'canvas-confetti';
import { X, Mic, MicOff, Timer } from 'lucide-react';
import ResultModal from '../components/ResultModal';
import NumericKeypad from '../components/NumericKeypad';

export default function Practice() {
    const { state } = useLocation();
    const { user, updateStats, settings } = useUser();
    const navigate = useNavigate();

    const [problems, setProblems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong'
    const [stats, setStats] = useState({ correct: 0, wrong: 0 });
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    // Track wrong problems for "Retry Wrong" feature
    const wrongProblemsRef = useRef([]);

    // Timer state
    const [timeLeft, setTimeLeft] = useState(10);
    const timerRef = useRef(null);

    // Voice state
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const mode = state?.mode || 'random';
    const selectedDans = state?.dans || [2, 3, 4, 5, 6, 7, 8, 9];
    const voiceEnabled = settings?.voiceEnabled && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    // Initialize problems
    useEffect(() => {
        if (!user) navigate('/');

        let pList = [];
        if (mode === 'order') pList = GameLogic.getOrderProblems(selectedDans);
        else if (mode === 'reverse') pList = GameLogic.getReverseProblems(selectedDans);
        else if (mode === 'random') pList = GameLogic.getRandomProblems(30, selectedDans);
        else if (mode === 'exam') pList = GameLogic.getRandomProblems(20, selectedDans);
        else if (mode === 'retry-wrong') pList = state.wrongProblems || [];
        else pList = GameLogic.getRandomProblems(30, selectedDans);

        if (pList.length === 0 && mode === 'retry-wrong') {
            alert('다시 풀 틀린 문제가 없습니다!');
            navigate('/dashboard');
            return;
        }

        setProblems(pList);

        // Setup Voice Recognition
        if (voiceEnabled) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'ko-KR';
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                const number = transcript.replace(/[^0-9]/g, '');
                if (number) {
                    handleVoiceInput(number);
                }
            };

            recognitionRef.current.onend = () => {
                if (isListening) recognitionRef.current.start();
            };
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(10);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    clearInterval(timerRef.current);
                    handleAnswer(null, true); // Timeout
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);
    }, [currentIndex]);

    const speakProblem = useCallback((a, b) => {
        if (!voiceEnabled) return;

        const msg = new SpeechSynthesisUtterance();
        const aTxt = ["", "", "이", "삼", "사", "오", "육", "칠", "팔", "구"][a];
        const bTxt = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"][b];

        // Correct grammar (은/는)
        const hasBatchim = [1, 3, 6, 7, 8].includes(b);
        const marker = hasBatchim ? "은?" : "는?";

        msg.text = `${aTxt} ${bTxt}${marker}`;
        msg.lang = 'ko-KR';
        msg.rate = 1.1;
        window.speechSynthesis.speak(msg);

        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.log("Recognition error", e);
            }
        }
    }, [voiceEnabled, isListening]);

    useEffect(() => {
        if (problems.length > 0 && currentIndex < problems.length && !gameOver) {
            setInputValue('');
            setFeedback(null);
            startTimer();
            const p = problems[currentIndex];
            speakProblem(p.a, p.b);
        } else if (problems.length > 0 && currentIndex >= problems.length) {
            setGameOver(true);
        }
    }, [currentIndex, problems, gameOver]);

    const handleKeypress = (key) => {
        if (feedback) return;
        setInputValue(prev => prev + key);
    };

    const handleBackspace = () => {
        if (feedback) return;
        setInputValue(prev => prev.slice(0, -1));
    };

    const handleVoiceInput = (val) => {
        if (feedback) return;
        handleAnswer(val);
    };

    const handleAnswer = (val = null, isTimeout = false) => {
        if (feedback) return;

        const currentProblem = problems[currentIndex];
        const answer = currentProblem.a * currentProblem.b;
        const input = val !== null ? parseInt(val) : parseInt(inputValue);

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
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            setTimeout(() => setCurrentIndex(prev => prev + 1), 800);
        } else {
            setStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
            setCombo(0);
            wrongProblemsRef.current.push(currentProblem);
            // Wait a bit more for wrong answer so they see the result
            setTimeout(() => setCurrentIndex(prev => prev + 1), 2000);
        }
    };

    const handleQuit = () => {
        if (confirm("정말 그만둘까요?")) {
            navigate('/dashboard');
        }
    };

    if (gameOver) {
        return <ResultModal
            stats={stats}
            maxCombo={maxCombo}
            wrongProblems={wrongProblemsRef.current}
            onHome={() => navigate('/dashboard')}
            onRetry={() => window.location.reload()}
        />;
    }

    if (problems.length === 0) return <div className="animate-spin">로딩중...</div>;

    const currentProblem = problems[currentIndex];

    return (
        <div className="card animate-pop" style={{ maxWidth: '500px', width: '95%', margin: '0 auto', position: 'relative' }}>
            <button onClick={handleQuit} className="btn-outline" style={{ position: 'absolute', right: '1rem', top: '1rem', padding: '0.5rem', border: 'none', background: 'transparent', color: '#666' }}>
                <X size={24} />
            </button>

            <div className="stats-badge" style={{ top: '1rem', left: '1rem', background: '#333', color: '#fff' }}>
                {currentIndex + 1} / {problems.length}
            </div>

            {/* Timer Progress Bar */}
            <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                marginTop: '3rem',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${(timeLeft / 10) * 100}%`,
                    height: '100%',
                    background: timeLeft < 3 ? 'var(--error)' : 'var(--primary)',
                    transition: 'width 0.1s linear'
                }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '0.9rem', color: timeLeft < 3 ? 'var(--error)' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Timer size={14} /> {timeLeft.toFixed(1)}s
            </div>

            <div style={{ marginTop: '1rem', marginBottom: '1rem', minHeight: '30px', textAlign: 'center' }}>
                {combo > 1 && (
                    <div className="animate-pop" style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '1.5rem' }}>
                        🔥 {combo} 연속 정답! 🔥
                    </div>
                )}
            </div>

            <div className={`problem-display ${feedback === 'correct' ? 'animate-pop' : ''}`} style={{ fontSize: '4rem', textAlign: 'center', marginBottom: '1rem' }}>
                {currentProblem.a} × {currentProblem.b} = {inputValue || '?'}
            </div>

            {feedback === 'wrong' && (
                <div className="animate-pop" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ color: 'var(--error)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        땡! 정답은 {currentProblem.a * currentProblem.b}
                    </div>
                </div>
            )}

            {feedback === 'correct' && (
                <div className="animate-pop" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        정답! 잘했어요!
                    </div>
                </div>
            )}

            {!feedback && (
                <NumericKeypad
                    onPress={handleKeypress}
                    onBackspace={handleBackspace}
                    onSubmit={() => handleAnswer()}
                    value={inputValue}
                />
            )}

            {voiceEnabled && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center', opacity: 0.7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {isListening ? <Mic color="var(--primary)" size={18} /> : <MicOff size={18} />}
                        <span>음성으로 답해보세요 (예: "{currentProblem.a * currentProblem.b}")</span>
                    </div>
                </div>
            )}
        </div>
    );
}
