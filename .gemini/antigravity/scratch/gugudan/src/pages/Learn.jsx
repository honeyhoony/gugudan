import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Eye, EyeOff } from 'lucide-react';

export default function Learn() {
    const { dan } = useParams();
    const navigate = useNavigate();
    const danNum = parseInt(dan);

    // Simplified state
    const [direction, setDirection] = useState('asc'); // 'asc' or 'desc'
    const [hideAnswers, setHideAnswers] = useState(false);
    const [revealed, setRevealed] = useState({}); // { 1: true, 2: false ... }

    // Safety check
    if (isNaN(danNum) || danNum < 2 || danNum > 9) {
        return <div style={{ padding: '2rem' }}>잘못된 접근입니다.</div>;
    }

    // Toggle logic
    const toggleDirection = () => {
        setDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        setRevealed({}); // Reset revealed on sort change? Optional. Let's reset to be clean.
    };

    const toggleHideAnswers = () => {
        setHideAnswers(prev => !prev);
        setRevealed({}); // Reset individual reveals when toggling mode
    };

    const toggleReveal = (step) => {
        if (!hideAnswers) return;
        setRevealed(prev => ({ ...prev, [step]: !prev[step] }));
    };

    // Calculate steps
    const steps = direction === 'asc' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1];

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0.8rem', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem' }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ width: '40px' }}></div>
            </div>

            <h2 style={{ textAlign: 'center', margin: '0 0 1rem', fontSize: '1.4rem', fontWeight: 'bold' }}>
                {danNum}단 공부하기
            </h2>

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                <button
                    className="btn btn-outline"
                    onClick={toggleDirection}
                    style={{ padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem' }}
                >
                    <RefreshCcw size={16} />
                    {direction === 'asc' ? '순서대로' : '거꾸로'}
                </button>
                <button
                    className={`btn ${hideAnswers ? 'btn-secondary' : 'btn-outline'}`}
                    onClick={toggleHideAnswers}
                    style={{ padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem' }}
                >
                    {hideAnswers ? <EyeOff size={16} /> : <Eye size={16} />}
                    {hideAnswers ? '정답 가리기 ON' : '정답 가리기 OFF'}
                </button>
            </div>

            {/* List - Single Column Layout - Compact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem', flex: 1 }}>
                {steps.map((step) => {
                    // Determine if answer should be shown
                    // If hideAnswers is true, only show if revealed[step] is true
                    const showAnswer = !hideAnswers || revealed[step];

                    return (
                        <div
                            key={step}
                            onClick={() => toggleReveal(step)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.8rem 1.2rem',
                                background: showAnswer ? '#fff' : '#f8fafc',
                                color: '#1e293b',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                cursor: hideAnswers ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                                boxShadow: showAnswer ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {danNum} × {step}
                            </span>
                            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: showAnswer ? '#3b82f6' : 'transparent', minWidth: '2em', textAlign: 'right' }}>
                                {showAnswer ? danNum * step : '?'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {hideAnswers && (
                <p style={{ textAlign: 'center', marginTop: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                    카드를 누르면 정답을 볼 수 있어요!
                </p>
            )}
        </div>
    );
}
