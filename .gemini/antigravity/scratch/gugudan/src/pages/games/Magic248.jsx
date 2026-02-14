import { useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function Magic248() {
    const navigate = useNavigate();
    const [tab, setTab] = useState(2); // 2, 4, or 8
    const [step, setStep] = useState(1); // multiplier 1-9
    const [showAnimation, setShowAnimation] = useState(false);

    const reset = (newTab) => {
        setTab(newTab);
        setStep(1);
        setShowAnimation(false);
    };

    const handleNext = () => {
        if (step < 9) {
            setStep(prev => prev + 1);
            setShowAnimation(false);
        } else {
            confetti();
            setStep(1);
        }
    };

    const triggerMagic = () => {
        setShowAnimation(true);
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
        });
    };

    const renderVisual = () => {
        if (tab === 2) {
            return (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {Array.from({ length: step }).map((_, i) => (
                        <div key={i} className={`animate-pop`} style={{ background: '#FF6B6B', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold', boxShadow: '0 4px 0 #c0392b' }}>
                            2
                        </div>
                    ))}
                    <div style={{ width: '100%', marginTop: '1rem', fontSize: '1.2rem', color: 'var(--dark)' }}>
                        2를 {step}번 더하면? <strong style={{ fontSize: '2rem', color: 'var(--primary)' }}>{2 * step}</strong>
                    </div>
                </div>
            );
        } else if (tab === 4) {
            const base = 2 * step;
            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
                        {/* Use darker text for yellow background */}
                        <div className="card" style={{ padding: '1rem', background: '#ffeaa7', color: '#663300', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            2 × {step} = <strong style={{ fontSize: '1.5rem' }}>{base}</strong>
                        </div>
                        {showAnimation && (
                            <div className="card animate-pop" style={{ padding: '1rem', background: '#ffeaa7', color: '#663300', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                2 × {step} = <strong style={{ fontSize: '1.5rem' }}>{base}</strong>
                            </div>
                        )}
                    </div>
                    <div style={{ fontSize: '1.2rem', color: 'var(--dark)' }}>
                        {base} + {base} = <strong style={{ fontSize: '2rem', color: 'var(--primary)' }}>{showAnimation ? base * 2 : '?'}</strong>
                    </div>
                    {!showAnimation && (
                        <button className="btn btn-primary animate-float" onClick={triggerMagic} style={{ marginTop: '1rem' }}>
                            <Copy size={20} style={{ verticalAlign: 'middle' }} /> 두 배로 복사하기!
                        </button>
                    )}
                </div>
            );
        } else if (tab === 8) {
            const base4 = 4 * step;
            const onesDigit = (8 * step) % 10;

            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
                        {/* Darker text for cyan background */}
                        <div className="card" style={{ padding: '0.5rem 1rem', background: '#81ecec', color: '#006666' }}>
                            4 × {step} = <strong>{base4}</strong>
                        </div>
                        <Plus color="var(--dark)" />
                        <div className="card" style={{ padding: '0.5rem 1rem', background: '#81ecec', color: '#006666' }}>
                            4 × {step} = <strong>{base4}</strong>
                        </div>
                    </div>

                    <div style={{ margin: '1rem 0', fontSize: '2rem', fontWeight: 'bold', color: 'var(--dark)' }}>
                        8 × {step} = {base4 * 2}
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <div style={{ color: 'var(--dark)', fontWeight: 'bold' }}>🚀 1의 자리 카운트다운!</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '0.5rem' }}>
                            {[8, 6, 4, 2, 0].map(n => (
                                <div key={n} style={{
                                    width: '30px', height: '30px', borderRadius: '50%',
                                    background: onesDigit === n ? 'var(--primary)' : '#e0e0e0',
                                    color: onesDigit === n ? 'white' : '#888',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold',
                                    transform: onesDigit === n ? 'scale(1.3)' : 'scale(1)',
                                    transition: 'all 0.3s'
                                }}>
                                    {n}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="card animate-pop" style={{ maxWidth: '600px', width: '95%', margin: '0 auto', minHeight: '80vh' }}>
            <button onClick={() => navigate('/practice')} className="btn-outline" style={{ position: 'absolute', left: '1rem', top: '1rem', padding: '0.5rem', border: 'none', background: 'transparent', color: '#666' }}>
                <ArrowLeft />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '2rem' }}>
                <button className={`btn ${tab === 2 ? 'btn-primary' : 'btn-outline'}`} onClick={() => reset(2)} style={{ flex: 1, color: tab === 2 ? 'white' : '#555' }}>2단</button>
                <button className={`btn ${tab === 4 ? 'btn-primary' : 'btn-outline'}`} onClick={() => reset(4)} style={{ flex: 1, color: tab === 4 ? 'white' : '#555' }}>4단</button>
                <button className={`btn ${tab === 8 ? 'btn-primary' : 'btn-outline'}`} onClick={() => reset(8)} style={{ flex: 1, color: tab === 8 ? 'white' : '#555' }}>8단</button>
            </div>

            <h2 style={{ fontSize: '3rem', margin: '1rem 0', color: 'var(--dark)' }}>
                {tab} × {step} = ?
            </h2>

            <div style={{ minHeight: '200px' }}>
                {renderVisual()}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn-outline" disabled={step <= 1} onClick={() => { setStep(s => s - 1); setShowAnimation(false) }} style={{ width: 'auto', color: '#555' }}>
                    <ArrowLeft /> 이전
                </button>
                <button className="btn btn-primary" onClick={handleNext} style={{ width: 'auto' }}>
                    다음 <ArrowRight />
                </button>
            </div>
        </div>
    );
}
