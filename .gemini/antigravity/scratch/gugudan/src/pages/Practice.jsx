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
    '팔': 8, '여덟': 8, '구': 9, '아홉': 9, '십': 10
};

const parseKoreanNumber = (text) => {
    // Basic implementation for single digits or common results
    let num = text.replace(/[^0-9]/g, '');
    if (num) return parseInt(num);

    // Check for words
    for (let word in KOREAN_NUMBERS) {
        if (text.includes(word)) return KOREAN_NUMBERS[word];
    }
    return null;
};

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
                const transcript = event.results[event.results.length - 1][0].transcript.trim();
                console.log("Speech Transcript:", transcript);
                const number = parseKoreanNumber(transcript);
                if (number !== null) {
                    handleVoiceInput(number);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                if (event.error === 'no-speech') return;
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
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
        if (window.confirm("정말 그만둘까요?")) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
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

    if (problems.length === 0) return <div className="animate-spin">로딩중...</div>;

    const currentProblem = problems[currentIndex];

    return (
        <div className="card animate-pop" style={{ maxWidth: '500px', width: '95%', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
            <button onClick={handleQuit} className="btn-outline" style={{ position: 'absolute', right: '0.8rem', top: '0.8rem', padding: '0.4rem', border: 'none', background: 'transparent', color: '#666', zIndex: 10 }}>
                <X size={24} />
            </button>

            <div className="stats-badge" style={{ top: '1rem', left: '1rem', background: '#333', color: '#fff', fontSize: '0.9rem', padding: '0.3rem 0.8rem' }}>
                {currentIndex + 1} / {problems.length}
            </div>

            {/* Timer Progress Bar */}
            <div style={{
                width: '100%',
                height: '10px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '5px',
                marginTop: '3.5rem',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{
                    width: `${(timeLeft / 10) * 100}%`,
                    height: '100%',
                    background: timeLeft < 3 ? 'var(--error)' : 'var(--primary)',
                    transition: 'width 0.1s linear'
                }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '1rem', fontWeight: 'bold', color: timeLeft < 3 ? 'var(--error)' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Timer size={16} /> {Math.ceil(timeLeft)}초 남음
            </div>

            <div style={{ marginTop: '1rem', marginBottom: '0.5rem', minHeight: '35px', textAlign: 'center' }}>
                {combo > 1 && (
                    <div className="animate-pop" style={{ color: '#ff4757', fontWeight: '900', fontSize: '1.6rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        🔥 {combo} 연속 정답! 🔥
                    </div>
                )}
            </div>

            <div className={`problem-display ${feedback === 'correct' ? 'animate-pop' : ''}`} style={{
                fontSize: 'clamp(3rem, 15vw, 4.5rem)',
                textAlign: 'center',
                marginBottom: '1rem',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {currentProblem.a} × {currentProblem.b} = <span style={{ color: feedback === 'wrong' ? 'var(--error)' : 'inherit' }}>{inputValue || '?'}</span>
            </div>

            <div style={{ minHeight: '60px', marginBottom: '1rem' }}>
                {feedback === 'wrong' && (
                    <div className="animate-pop" style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--error)', fontSize: '1.5rem', fontWeight: 'bold', background: 'rgba(255,71,87,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                            땡! 정답은 {currentProblem.a * currentProblem.b}
                        </div>
                    </div>
                )}

                {feedback === 'correct' && (
                    <div className="animate-pop" style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold', background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                            정답! 대단해요! 👏
                        </div>
                    </div>
                )}
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
                <div style={{ marginTop: '1.5rem', textAlign: 'center', background: isListening ? 'rgba(59,130,246,0.05)' : 'transparent', padding: '0.8rem', borderRadius: '12px', transition: 'all 0.3s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: isListening ? 'var(--primary)' : '#666' }}>
                        {isListening ? <Mic className="animate-pulse" size={20} /> : <MicOff size={20} />}
                        <span style={{ fontWeight: isListening ? 'bold' : 'normal' }}>
                            {isListening ? '듣고 있어요... 숫자를 말씀하세요' : '음성 인식을 시작하는 중...'}
                        </span>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button onClick={handleQuit} className="btn-outline" style={{ fontSize: '0.9rem', color: '#999', border: 'none', background: 'transparent' }}>
                    학습 중단하고 나가기
                </button>
            </div>
        </div>
    );
}
