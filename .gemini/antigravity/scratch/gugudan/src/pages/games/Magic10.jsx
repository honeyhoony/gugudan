import { useState } from 'react';
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function Magic10() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [showMagic, setShowMagic] = useState(false);

    const handleNext = () => {
        if (step < 9) {
            setStep(prev => prev + 1);
            setShowMagic(false);
        } else {
            setStep(1);
            setShowMagic(false);
        }
    };

    const triggerMagic = () => {
        setShowMagic(true);
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
        });
    };

    return (
        <div className="card animate-pop" style={{ maxWidth: '600px', width: '95%', margin: '0 auto', minHeight: '50vh', position: 'relative', backgroundColor: '#2c3e50', color: '#ecf0f1' }}>
            <button onClick={() => navigate('/practice')} className="btn-outline" style={{ position: 'absolute', left: '1rem', top: '1rem', padding: '0.5rem', border: 'none', background: 'transparent', color: '#ecf0f1' }}>
                <ArrowLeft />
            </button>

            <h2 style={{ marginTop: '3rem', color: '#f1c40f' }}>🛡️ 10단 우주 헬멧</h2>
            <p style={{ color: '#ecf0f1' }}>숫자가 우주에 나가면 0 헬멧이 필요해요!</p>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                fontSize: '5rem',
                fontWeight: 'bold',
                margin: '3rem 0',
                position: 'relative'
            }}>
                {/* Multiplier */}
                <div style={{ color: '#f39c12' }}>{step}</div>

                <div style={{ color: '#bdc3c7' }}>×</div>
                <div style={{ color: '#bdc3c7' }}>10</div>

                <div style={{ color: '#bdc3c7' }}>=</div>

                {/* Result + Helmet */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ color: '#f39c12' }}>{step}</div>

                    {/* The "0" Helmet */}
                    <div
                        className={showMagic ? 'animate-pop' : ''}
                        style={{
                            color: '#f1c40f',
                            opacity: showMagic ? 1 : 0.1,
                            transform: showMagic ? 'scale(1.2)' : 'none',
                            transition: 'all 0.5s'
                        }}
                    >
                        0
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                {!showMagic ? (
                    <button className="btn btn-primary animate-float" onClick={triggerMagic} style={{ background: '#f39c12', color: 'black' }}>
                        <Shield style={{ verticalAlign: 'middle' }} /> 헬멧 씌우기!
                    </button>
                ) : (
                    <button className="btn btn-outline" onClick={handleNext} style={{ color: '#ecf0f1', borderColor: '#ecf0f1' }}>
                        다음 숫자 ({step >= 9 ? 1 : step + 1}) <ArrowRight style={{ verticalAlign: 'middle' }} />
                    </button>
                )}
            </div>
        </div>
    );
}
