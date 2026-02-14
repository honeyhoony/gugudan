import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameLogic } from '../lib/gameLogic';

export default function VedicPractice() {
    const navigate = useNavigate();

    const [problem, setProblem] = useState(GameLogic.getVedicProblem());
    const [step, setStep] = useState(1); // 1: sum, 2: sum10, 3: prod, 4: result
    const [history, setHistory] = useState({ sum: null, sum10: null, prod: null });
    const [stats, setStats] = useState({ correct: 0, wrong: 0 });
    const [choices, setChoices] = useState([]);
    const [feedback, setFeedback] = useState('');

    // Re-generate choices when step or problem changes
    useEffect(() => {
        generateChoicesForStep();
    }, [step, problem]);

    const generateChoicesForStep = () => {
        let target;
        const b_ones = problem.b % 10;
        const a_ones = problem.a % 10;
        const tail_sum_val = problem.a + b_ones;
        const tail_sum10_val = tail_sum_val * 10;
        const tail_prod_val = a_ones * b_ones;
        const final_val = tail_sum10_val + tail_prod_val;

        if (step === 1) target = tail_sum_val;
        else if (step === 2) target = tail_sum10_val;
        else if (step === 3) target = tail_prod_val;
        else if (step === 4) target = final_val;
        else return;

        const opts = new Set();
        opts.add(target);

        // Generating "smart" distractors based on user request
        let attempts = 0;
        while (opts.size < 4 && attempts < 20) {
            attempts++;
            let wrong;

            if (step === 4) {
                // Final: Distractors must end in same digit (diff by 10, 20..)
                // e.g. 156 -> 146, 166, 176...
                const offset = (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 3 + 1) * 10;
                wrong = target + offset;
            } else if (step === 2) {
                // Sum10: Must end in 0 (diff by 10, 20..)
                const offset = (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 3 + 1) * 10;
                wrong = target + offset;
            } else {
                // Normal steps: small random variance
                wrong = target + (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 4 + 1);
            }

            if (wrong > 0 && wrong !== target) opts.add(wrong);
        }

        // Fallback if not enough unique logic found (rare)
        while (opts.size < 4) {
            opts.add(target + opts.size + 1);
        }

        setChoices(Array.from(opts).sort(() => Math.random() - 0.5));
    };

    const handleNext = () => {
        setProblem(GameLogic.getVedicProblem());
        setStep(1);
        setHistory({ sum: null, sum10: null, prod: null });
        setFeedback('');
    };

    const handleChoice = (val) => {
        const b_ones = problem.b % 10;
        const a_ones = problem.a % 10;
        const tail_sum_val = problem.a + b_ones;
        const tail_sum10_val = tail_sum_val * 10;
        const tail_prod_val = a_ones * b_ones;
        const final_val = tail_sum10_val + tail_prod_val;

        let isCorrect = false;
        let target = 0;
        if (step === 1) target = tail_sum_val;
        else if (step === 2) target = tail_sum10_val;
        else if (step === 3) target = tail_prod_val;
        else if (step === 4) target = final_val;

        if (val === target) {
            isCorrect = true;
            if (step === 1) setHistory(prev => ({ ...prev, sum: val }));
            if (step === 2) setHistory(prev => ({ ...prev, sum10: val }));
            if (step === 3) setHistory(prev => ({ ...prev, prod: val }));

            if (step === 4) {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                setStep(5);
            } else {
                setStep(prev => prev + 1);
            }

            setStats(p => ({ ...p, correct: p.correct + 1 }));
            setFeedback('정답! 🎉');
            setTimeout(() => setFeedback(''), 1000);
        } else {
            setStats(p => ({ ...p, wrong: p.wrong + 1 }));
            setFeedback('틀렸어요, 다시 해볼까요? 🤔');
        }
    };

    return (
        <div className="card animate-pop" style={{ maxWidth: '500px', width: '95%', margin: '0 auto', position: 'relative' }}>
            <button onClick={() => navigate('/dashboard')} className="btn-outline" style={{ position: 'absolute', right: '1rem', top: '1rem', padding: '0.5rem', border: 'none', background: 'transparent', color: '#666' }}>
                <X size={24} />
            </button>

            <div style={{ position: 'absolute', left: '1rem', top: '1rem', fontSize: '0.9rem', color: '#666' }}>
                맞음: <span style={{ color: 'green', fontWeight: 'bold' }}>{stats.correct}</span> | 틀림: <span style={{ color: 'red', fontWeight: 'bold' }}>{stats.wrong}</span>
            </div>

            <h3 style={{ color: 'var(--primary)', marginTop: '2rem', marginBottom: '1rem' }}>👳 인도 베다 수학 연습</h3>

            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '1rem' }}>
                {problem.a} × {problem.b}
            </div>

            {/* Process Visualizer */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{ opacity: step >= 1 ? 1 : 0.3, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>1. 앞 수+뒷 꼬리 ({problem.a}+{problem.b % 10})</span>
                    {step > 1 ? <strong style={{ color: 'var(--success)', fontSize: '1.2rem' }}>{history.sum}</strong> : <span>?</span>}
                </div>
                <div style={{ opacity: step >= 2 ? 1 : 0.3, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>2. 0 붙이기 (×10)</span>
                    {step > 2 ? <strong style={{ color: 'var(--success)', fontSize: '1.2rem' }}>{history.sum10}</strong> : <span>?</span>}
                </div>
                <div style={{ opacity: step >= 3 ? 1 : 0.3, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>3. 꼬리 곱셈 ({problem.a % 10}×{problem.b % 10})</span>
                    {step > 3 ? <strong style={{ color: 'var(--success)', fontSize: '1.2rem' }}>{history.prod}</strong> : <span>?</span>}
                </div>
                <div style={{ opacity: step >= 4 ? 1 : 0.3, paddingTop: '0.5rem', borderTop: '2px dashed rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>4. 합치기 ({history.sum10 || '?'}+{history.prod || '?'})</span>
                    {step > 4 ? <strong style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>{history.sum10 + history.prod}</strong> : <span>?</span>}
                </div>
            </div>

            {step <= 4 ? (
                <div>
                    <div style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold', minHeight: '30px' }}>
                        {step === 1 && `👉 ${problem.a} 더하기 ${problem.b % 10} 은?`}
                        {step === 2 && `👉 ${history.sum} 뒤에 0을 붙이면?`}
                        {step === 3 && `👉 꼬리끼리 곱하면? (${problem.a % 10} × ${problem.b % 10})`}
                        {step === 4 && `👉 마지막! ${history.sum10} 더하기 ${history.prod} 은?`}
                    </div>

                    <div className="choice-grid" style={{ marginTop: '0.5rem' }}>
                        {choices.map((c, i) => (
                            <button key={i} className="choice-btn" onClick={() => handleChoice(c)} style={{ fontSize: '1.5rem', padding: '1rem' }}>
                                {c}
                            </button>
                        ))}
                    </div>
                    <div style={{ height: '20px', color: 'var(--error)', marginTop: '0.5rem', fontWeight: 'bold' }}>{feedback}</div>
                </div>
            ) : (
                <div>
                    <h2 style={{ color: 'var(--success)', marginTop: 0 }}>정답입니다! 🎉</h2>
                    <button className="btn btn-primary animate-pop" onClick={handleNext}>
                        다음 문제 <ArrowRight size={20} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
                    </button>
                </div>
            )}
        </div>
    );
}
