import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameLogic } from '../lib/gameLogic';
import { StorageService } from '../lib/storage';
import { getMathTip } from '../lib/tips';
import { useUser } from '../context/UserContext';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import ResultModal from '../components/ResultModal';

export default function Practice() {
    const { state } = useLocation();
    const { user, updateStats } = useUser();
    const navigate = useNavigate();

    const [problem, setProblem] = useState(null);
    const [choices, setChoices] = useState([]);
    const [selected, setSelected] = useState(null);
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong'
    const [stats, setStats] = useState({ correct: 0, wrong: 0 });
    const [tip, setTip] = useState(null);

    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const limit = state?.limit || 30;

    useEffect(() => {
        if (!user) navigate('/');
        if (!state) navigate('/dashboard');
        nextProblem();
    }, []);

    const nextProblem = () => {
        if (currentProblemIndex >= limit) {
            setGameOver(true);
            return;
        }

        let newProblem;
        // Mode logic
        if (state.mode === 'weak') {
            const weak = StorageService.getWeakProblems(user.name);
            if (weak.length === 0) {
                alert("와우! 약점 문제가 없어요! 대단해요!");
                navigate('/dashboard');
                return;
            }
            const item = weak[Math.floor(Math.random() * weak.length)];
            newProblem = { a: item.a, b: item.b };
        } else {
            // Custom dans
            newProblem = GameLogic.getRandomProblemFromDans(state.dans || [2, 3, 4, 5, 6, 7, 8, 9]);
        }

        setProblem(newProblem);

        // Custom choices logic based on user request "19단은 끝자리가 모두 같은 보기로"
        // Only apply this strictly if it's a 19-dan problem (a >= 10) to make it harder?
        // User said: "19단 문제 풀때 끝자리가 6인거는 쉽게 알아서... 끝자리가 모두 6인 사지선다로 해줘"
        // Let's modify generateChoices in GameLogic or override here.
        // Overriding here specifically for this request.

        const answer = newProblem.a * newProblem.b;
        const opts = new Set();
        opts.add(answer);

        // If it's a 2-digit multiplication (likely 19-dan context or result > 100), make it harder
        const makeHard = newProblem.a >= 10 || newProblem.b >= 10;

        let attempts = 0;
        while (opts.size < 4 && attempts < 20) {
            attempts++;
            let wrong;

            if (makeHard) {
                // Hard mode: Change by 10s or 20s so last digit remains same
                const offset = (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 4 + 1) * 10;
                wrong = answer + offset;
            } else {
                // Normal mode
                wrong = answer + (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 5 + 1);
            }

            if (wrong > 0 && wrong !== answer) opts.add(wrong);
        }
        // Fallback
        while (opts.size < 4) opts.add(answer + ((opts.size + 1) * 10));

        setChoices(Array.from(opts).sort(() => Math.random() - 0.5));

        setSelected(null);
        setFeedback(null);
        setTip(null); // Reset tip
        setCurrentProblemIndex(prev => prev + 1);
    };

    const handleQuit = () => {
        if (confirm("정말 그만하고 채점하러 갈까요?")) {
            setGameOver(true);
        }
    };

    const handleChoice = (choice) => {
        if (selected !== null) return; // Prevent double clicks
        setSelected(choice);

        const isCorrect = choice === (problem.a * problem.b);
        updateStats(problem.a, problem.b, isCorrect);

        if (isCorrect) {
            setFeedback('correct');
            setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
            setCombo(prev => {
                const newCombo = prev + 1;
                if (newCombo > maxCombo) setMaxCombo(newCombo);
                return newCombo;
            });

            // Different confetti based on combo
            const particleCount = combo > 5 ? 150 : 50;
            confetti({
                particleCount,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Quick next problem for correct answer
            setTimeout(nextProblem, 800);
        } else {
            setFeedback('wrong');
            setStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
            setCombo(0); // Reset combo

            // Show tip if available
            const generatedTip = getMathTip(problem.a, problem.b);
            setTip(generatedTip);
        }
    };

    if (gameOver) {
        return <ResultModal
            stats={stats}
            maxCombo={maxCombo}
            onHome={() => navigate('/dashboard')}
            onRetry={() => window.location.reload()}
        />;
    }

    if (!problem) return <div className="animate-spin">로딩중...</div>;

    return (
        <div className="card animate-pop" style={{ maxWidth: '500px', width: '95%', margin: '0 auto', position: 'relative' }}>
            <button onClick={handleQuit} className="btn-outline" style={{ position: 'absolute', right: '1rem', top: '1rem', padding: '0.5rem', border: 'none', background: 'transparent', color: '#666' }}>
                <X size={24} />
            </button>

            <div className="stats-badge" style={{ top: '1rem', left: '1rem', background: '#333', color: '#fff' }}>
                {currentProblemIndex} / {limit}
            </div>
            <div style={{ position: 'absolute', top: '3rem', right: '1rem', fontSize: '0.8rem', color: '#666' }}>
                O: {stats.correct} X: {stats.wrong}
            </div>

            <div style={{ marginTop: '3rem', marginBottom: '1rem', minHeight: '30px' }}>
                {combo > 1 && (
                    <div className="animate-pop" style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '1.5rem' }}>
                        🔥 {combo} 연속 정답! 🔥
                    </div>
                )}
            </div>

            <div className={`problem-display ${feedback === 'correct' ? 'animate-pop' : ''}`} style={{ fontSize: '5rem' }}>
                {problem.a} × {problem.b} = ?
            </div>

            <div className="choice-grid">
                {choices.map((choice, i) => {
                    let extraClass = '';
                    if (selected !== null) {
                        if (choice === (problem.a * problem.b)) extraClass = 'correct';
                        else if (choice === selected) extraClass = 'wrong';
                    }

                    return (
                        <button
                            key={i}
                            className={`choice-btn ${extraClass}`}
                            onClick={() => handleChoice(choice)}
                            disabled={selected !== null}
                        >
                            {choice}
                        </button>
                    );
                })}
            </div>

            {feedback === 'wrong' && (
                <div className="animate-pop" style={{ marginTop: '1rem' }}>
                    <div style={{ color: 'var(--error)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        땡! 정답은 {problem.a * problem.b} 입니다!
                    </div>

                    {tip}

                    <button
                        className="btn btn-primary animate-float"
                        onClick={nextProblem}
                        style={{ marginTop: '1rem' }}
                    >
                        다음 문제 <ArrowRight size={20} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
                    </button>
                </div>
            )}
        </div>
    );
}
