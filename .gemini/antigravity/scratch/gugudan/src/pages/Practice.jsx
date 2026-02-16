import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameLogic } from '../lib/gameLogic';
import { useUser } from '../context/UserContext';
import confetti from 'canvas-confetti';
import { X, Mic, MicOff, Timer } from 'lucide-react';
import ResultModal from '../components/ResultModal';
import NumericKeypad from '../components/NumericKeypad';
import MultipleChoice from '../components/MultipleChoice';
import { AudioService } from '../lib/audioService';

const KOREAN_NUMBERS = {
    '영': 0, '공': 0, '일': 1, '하나': 1, '이': 2, '둘': 2, '삼': 3, '셋': 3,
    '사': 4, '넷': 4, '오': 5, '다섯': 5, '육': 6, '여섯': 6, '칠': 7, '일곱': 7,
    '팔': 8, '여덟': 8, '구': 9, '아홉': 9, '십': 10,
    '이십': 20, '삼십': 30, '사십': 40, '오십': 50, '육십': 60, '칠십': 70, '팔십': 80, '구십': 90
};

const KOREAN_NAMES = {
    1: '일', 2: '이', 3: '삼', 4: '사', 5: '오', 6: '육', 7: '칠', 8: '팔', 9: '구'
};

const parseKoreanNumber = (text) => {
    // 1. 숫자가 직접 포함된 경우 (예: "24", "정답은 42")
    let numStr = text.replace(/[^0-9]/g, '');
    if (numStr) return parseInt(numStr);

    // 2. 한글 숫자인 경우 (예: "팔십일", "이십")
    let total = 0;
    let found = false;

    // 긴 단어(이십, 삼십...)부터 먼저 체크
    const words = Object.entries(KOREAN_NUMBERS).sort((a, b) => b[0].length - a[0].length);

    let tempText = text;
    for (const [word, val] of words) {
        if (tempText.includes(word)) {
            total += val;
            tempText = tempText.replace(word, ''); // 이미 처리한 글자는 제거
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
    const [lives, setLives] = useState(5);
    const [gameStarted, setGameStarted] = useState(false);
    // const [options, setOptions] = useState([]); // Removed state for options

    // Define currentProblem early so useMemo can use it
    const currentProblem = problems[currentIndex];

    const wrongProblemsRef = useRef([]);
    const timerRef = useRef(null);
    const [timeLeft, setTimeLeft] = useState(10);
    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const activeRef = useRef(true);
    const processingAnswerRef = useRef(false);

    // Ref to always have the latest state for handlers (Speech Recognition)
    const latest = useRef({ currentIndex, problems, feedback, gameOver, inputValue });
    useEffect(() => {
        latest.current = { currentIndex, problems, feedback, gameOver, inputValue };
    }, [currentIndex, problems, feedback, gameOver, inputValue]);

    const mode = state?.mode || 'random';
    const selectedDans = state?.dans || [2, 3, 4, 5, 6, 7, 8, 9];
    const voiceEnabled = settings?.micEnabled && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const maxTime = 20; // Increased to 20s for ample correction time

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
        // Stop recognition immediately to prevent carry-over
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        processingAnswerRef.current = true;

        // Use the functional state pattern to avoid stale closures
        setGameOver(currentGameOver => {
            if (currentGameOver) return true;

            setFeedback(currentFeedback => {
                if (currentFeedback) return currentFeedback;

                // We need problems and currentIndex here
                const { currentIndex, problems } = latest.current;
                const currentProblem = problems[currentIndex];
                if (!currentProblem) return null;

                const answer = currentProblem.a * currentProblem.b;
                const input = val !== null ? parseInt(val) : parseInt(inputValue);

                if (isNaN(input) && !isTimeout) {
                    processingAnswerRef.current = false; // Reset if not submitting
                    return null;
                }

                const isCorrect = !isTimeout && input === answer;

                if (timerRef.current) clearInterval(timerRef.current);
                updateStats(currentProblem.a, currentProblem.b, isCorrect);

                if (isCorrect) {
                    setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
                    setCombo(prev => {
                        const nc = prev + 1;
                        if (nc > maxComboRef.current) maxComboRef.current = nc;
                        return nc;
                    });
                    if (settings.sfxEnabled) {
                        if (mode === 'exam') AudioService.playCorrectSound();
                        else AudioService.playSimpleDing();
                    }
                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                    setTimeout(() => nextProblem(), mode === 'exam' ? 1200 : 600);
                    return 'correct';
                } else {
                    setStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
                    setCombo(0);
                    if (settings.sfxEnabled) {
                        if (mode === 'exam') AudioService.playWrongSound();
                    }
                    wrongProblemsRef.current.push(currentProblem);

                    if (mode === 'exam') {
                        setLives(prev => {
                            if (prev <= 1) {
                                setTimeout(() => setGameOver(true), 1500);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }

                    setTimeout(() => nextProblem(), 2000);
                    return 'wrong';
                }
            });
            return false;
        });
    }, [updateStats, inputValue, mode, settings.sfxEnabled]);

    const handleAnswerRef = useRef(handleAnswer);
    useEffect(() => {
        handleAnswerRef.current = handleAnswer;
    }, [handleAnswer]);

    // Used for maxCombo because it's hard to update in setCombo functional update
    const maxComboRef = useRef(0);

    // Removed useCallback generateOptions and useEffect.
    // Replaced with useMemo for synchronous update.
    const options = React.useMemo(() => {
        if (!currentProblem) return [];
        const answer = currentProblem.a * currentProblem.b;
        const choices = new Set();
        choices.add(answer);

        const potentialWrong = new Set();
        // 1. Same Dan, different multiplier
        for (let i = 1; i <= 9; i++) {
            if (i !== currentProblem.b) potentialWrong.add(currentProblem.a * i);
        }
        // 2. Inverse problem (e.g. 7x8 -> distractors from 8x table)
        for (let i = 1; i <= 9; i++) {
            if (i !== currentProblem.a) potentialWrong.add(currentProblem.b * i);
        }
        // 3. Very close numbers
        [1, 2, 10].forEach(offset => {
            if (answer + offset > 0) potentialWrong.add(answer + offset);
            if (answer - offset > 0) potentialWrong.add(answer - offset);
        });

        const arrWrong = Array.from(potentialWrong).filter(n => n !== answer);
        while (choices.size < 4 && arrWrong.length > 0) {
            const randomIndex = Math.floor(Math.random() * arrWrong.length);
            choices.add(arrWrong.splice(randomIndex, 1)[0]);
        }
        while (choices.size < 4) {
            choices.add((Math.floor(Math.random() * 8) + 2) * (Math.floor(Math.random() * 8) + 2));
        }
        return Array.from(choices).sort(() => Math.random() - 0.5);
    }, [currentProblem]); // Re-calculates immediately when currentProblem changes

    const nextProblem = useCallback(() => {
        if (!activeRef.current) return;
        processingAnswerRef.current = false; // Allow audio processing again

        setCurrentIndex(prev => {
            if (prev + 1 >= latest.current.problems.length) {
                setGameOver(true);
                return prev;
            }
            setInputValue('');
            setFeedback(null);
            return prev + 1;
        });
    }, []);

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(maxTime);
        if (settings.sfxEnabled) AudioService.updateIntensity(0);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    clearInterval(timerRef.current);
                    handleAnswer(null, true);
                    return 0;
                }
                const nextTime = prev - 0.1;
                // Update BGM intensity based on time left (last 6 seconds)
                if (mode === 'exam' && settings.sfxEnabled) {
                    const urgency = nextTime < 6 ? (6 - nextTime) / 6 : 0;
                    AudioService.updateIntensity(urgency);
                }
                return nextTime;
            });
        }, 100);
    }, [handleAnswer, maxTime, mode, settings.sfxEnabled]);

    const speakProblem = useCallback((a, b) => {
        if (!settings.ttsEnabled) return;

        window.speechSynthesis.cancel();

        const msg = new SpeechSynthesisUtterance();
        // Use natural Gugudan style (e.g., "구이는?" or "육칠은?")
        const textA = KOREAN_NAMES[a] || a;
        const textB = KOREAN_NAMES[b] || b;

        // Handle 은/는 based on batchim (1=일, 3=삼, 6=육, 7=칠, 8=팔)
        const hasBatchim = [1, 3, 6, 7, 8].includes(Number(b));
        const suffix = hasBatchim ? '은' : '는';

        msg.text = `${textA}${textB}${suffix}`; // Removed '?' to make it sound more like a prompt
        msg.lang = 'ko-KR';
        msg.rate = 1.1;
        msg.volume = 1.0;

        setTimeout(() => {
            if (activeRef.current) window.speechSynthesis.speak(msg);
        }, 150);

        if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) { }
        }
    }, [settings.ttsEnabled, voiceEnabled]);

    // 초기 설정
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
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'ko-KR';
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                const { currentIndex, problems, feedback, gameOver } = latest.current;

                // Block if already processing an answer or in feedback state
                if (feedback || gameOver || processingAnswerRef.current) return;

                const results = event.results[event.results.length - 1];
                const transcript = results[0].transcript.trim();

                // Special Commands Check
                if (transcript.includes('다시') || transcript.includes('지워') || transcript.includes('삭제')) {
                    setInputValue('');
                    return;
                }

                const number = parseKoreanNumber(transcript);

                if (number !== null) {
                    setInputValue(String(number));

                    // Auto-submit if the number matches the correct answer (very responsive for single digits)
                    const currentProblem = problems[currentIndex];
                    const answer = currentProblem.a * currentProblem.b;

                    if (number === answer) {
                        handleAnswerRef.current(number);
                    } else if (results.isFinal) {
                        handleAnswerRef.current(number);
                    }
                }
            };

            recognitionRef.current.onend = () => {
                const { feedback, gameOver } = latest.current;
                // Only restart if we are NOT processing an answer and NOT in feedback/gameover
                if (activeRef.current && !gameOver && !feedback && !processingAnswerRef.current) {
                    try { recognitionRef.current.start(); } catch (e) { }
                }
            };
        }

        return () => {
            activeRef.current = false;
            AudioService.stopBGM();
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

    useEffect(() => {
        if (!gameStarted) return;
        if (gameOver) {
            if (settings.sfxEnabled) AudioService.stopBGM();
            return;
        }

        if (problems.length > 0 && currentIndex < problems.length && !gameOver && !feedback) {
            // Options are now handled by useMemo
            speakProblem(problems[currentIndex].a, problems[currentIndex].b);
            startTimer();
        }
    }, [gameStarted, currentIndex, feedback === null, gameOver, settings.ttsEnabled, settings.sfxEnabled, settings.inputMethod]);

    const handleStartGame = () => {
        setGameStarted(true);
        AudioService.init();

        // Mobile TTS fix: Trigger an empty utterance to unlock the synth on user gesture
        if (settings.ttsEnabled) {
            const dummy = new SpeechSynthesisUtterance('');
            dummy.volume = 0;
            window.speechSynthesis.speak(dummy);
        }

        if (voiceEnabled) {
            startVolumeMeter();
        }

        // Play BGM if SFX enabled, regardless of mode (or specific modes)
        // User requested "exciting song" in "Real problem" (Exam). 
        // Existing code had: if (mode === 'exam') ...
        // Ensure it runs.
        if (settings.sfxEnabled) {
            // Use exam BGM for exam mode, maybe a lighter one for others? 
            // For now, let's enable it for Exam as requested.
            // If it wasn't playing, maybe Init failed?
            // Let's try adding a small delay or ensuring intensity is set.
            if (mode === 'exam') {
                AudioService.startExamBGM();
                AudioService.updateIntensity(0.5); // Start with medium intensity
            }
        }
    };

    // Effect for Timer - Start when feedback is cleared (i.e. new problem) - REMOVED, integrated into above useEffect
    // useEffect(() => {
    //     if (problems.length > 0 && currentIndex < problems.length && !gameOver && !feedback) {
    //         startTimer();
    //     }
    // }, [currentIndex, feedback === null]);

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
            maxCombo={maxComboRef.current}
            wrongProblems={wrongProblemsRef.current}
            onHome={() => navigate('/dashboard', { replace: true })}
            onRetry={() => window.location.reload()}
        />;
    }

    if (!gameStarted) {
        return (
            <div className="card animate-pop" style={{ maxWidth: '400px', width: '90%', margin: '5rem auto', textAlign: 'center', padding: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
                    {mode === 'exam' ? '🏆 20문제 실전 테스트' : '🎮 게임 준비 완료!'}
                </h2>
                <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                    {mode === 'exam' ? '틀리면 하트가 깎여요! 조심하세요!' : '박진감 넘치는 게임을 시작할까요?'}
                </p>
                <button
                    className="btn btn-primary"
                    onClick={handleStartGame}
                    style={{ padding: '1.2rem', fontSize: '1.2rem' }}
                >
                    시작하기!
                </button>
            </div>
        );
    }

    if (problems.length === 0) return <div style={{ textAlign: 'center', marginTop: '5rem' }}>준비 중...</div>;

    // const currentProblem = problems[currentIndex]; // Moved to top

    return (
        <div className={`card animate-pop ${mode === 'exam' ? 'exam-mode' : ''}`} style={{
            maxWidth: '500px', width: '95%', margin: '0.5rem auto', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative',
            background: mode === 'exam' ? 'rgba(41, 46, 73, 0.05)' : 'rgba(255, 255, 255, 0.95)',
            border: mode === 'exam' ? '2px solid var(--primary)' : '1px solid var(--glass-border)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#333', color: '#fff', padding: '2px 10px', borderRadius: '15px', fontSize: '0.8rem' }}>
                        {currentIndex + 1} / {problems.length}
                    </span>
                    {mode === 'exam' && (
                        <div style={{ display: 'flex', gap: '2px' }}>
                            {[...Array(5)].map((_, i) => (
                                <span key={i} style={{ fontSize: '1.2rem', opacity: i < lives ? 1 : 0.2, transition: 'opacity 0.3s ease' }}>❤️</span>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={handleQuit} style={{ border: 'none', background: 'transparent', color: '#999' }}><X size={20} /></button>
            </div>

            <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden', marginTop: '0.4rem', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{
                    width: `${(timeLeft / maxTime) * 100}%`,
                    height: '100%',
                    background: timeLeft < 3 ? '#ff4757' : '#3b82f6',
                    transition: 'width 0.1s linear',
                    boxShadow: timeLeft < 3 ? '0 0 10px #ff4757' : 'none',
                    animation: timeLeft < 3 ? 'pulse 0.5s infinite alternate' : 'none'
                }} />
            </div>

            <div style={{ minHeight: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
                {combo > 1 && !feedback && <span style={{ color: '#ff4757', fontWeight: 'bold' }}>🔥 {combo}연속!</span>}
                {feedback === 'wrong' && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>땡! 정답: {currentProblem.a * currentProblem.b}</span>}
                {feedback === 'correct' && <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>정답! ✨</span>}
            </div>

            <div style={{ fontSize: '3.5rem', textAlign: 'center', fontWeight: 'bold', margin: '0.2rem 0' }}>
                {currentProblem.a} × {currentProblem.b} = <span style={{ color: feedback === 'wrong' ? '#ef4444' : 'inherit' }}>{inputValue || '?'}</span>
            </div>

            {settings.inputMethod === 'choice' ? (
                <MultipleChoice
                    key={currentIndex} // Force re-render to reset button states
                    options={options}
                    onSelect={(val) => {
                        if (feedback || gameOver) return; // Prevent multiple clicks
                        setInputValue(String(val));
                        handleAnswer(val);
                    }}
                    disabled={!!feedback || gameOver}
                    selectedAnswer={feedback ? parseInt(inputValue) : null}
                    correctAnswer={feedback ? currentProblem.a * currentProblem.b : null}
                />
            ) : (
                !feedback && (
                    <NumericKeypad
                        onPress={handleKeypress}
                        onBackspace={handleBackspace}
                        onSubmit={() => handleAnswer()}
                        value={inputValue}
                    />
                )
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
