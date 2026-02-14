import { useState } from 'react';
import { ArrowLeft, ArrowRight, Zap, Rocket, Scissors } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function Magic6() {
    const navigate = useNavigate();
    // We will iterate 2, 3, 4, 5, 6, 7, 8
    const [step, setStep] = useState(2);
    const [showMagic, setShowMagic] = useState(false);
    const [phase, setPhase] = useState(1); // 1: Initial, 2: Booster/Spy animation

    const isEven = step % 2 === 0;

    const handleNext = () => {
        if (step < 8) {
            setStep(prev => prev + 1);
            setShowMagic(false);
            setPhase(1);
        } else {
            setStep(2);
            setShowMagic(false);
            setPhase(1);
        }
    };

    const triggerMagic = () => {
        setShowMagic(true);
        if (!isEven) {
            // Odd numbers need time to animate booster
            setTimeout(() => setPhase(2), 500);
        } else {
            // Even numbers: Spy Tail + Half Split
            setTimeout(() => setPhase(2), 800);
        }
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
        });
    };

    return (
        <div className="card animate-pop" style={{ maxWidth: '600px', width: '95%', margin: '0 auto', minHeight: '80vh', position: 'relative' }}>
            <button onClick={() => navigate('/practice')} className="btn-outline" style={{ position: 'absolute', left: '1rem', top: '1rem', padding: '0.5rem', border: 'none', background: 'transparent', color: '#666' }}>
                <ArrowLeft />
            </button>

            <h2 style={{ marginTop: '3rem', color: isEven ? '#8e44ad' : '#e67e22' }}>
                {isEven ? '✂️ 6단 짝수 반반 마법!' : '🚀 6단 홀수 5단 부스터!'}
            </h2>
            <p>
                {isEven ? '짝수를 반으로 뚝! 자르면 십의 자리가 돼요.' : '홀수랑 만나면 5단 로켓 발사!'}
            </p>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                fontSize: '3.5rem',
                fontWeight: 'bold',
                margin: '2rem 0',
                position: 'relative',
                flexWrap: 'wrap'
            }}>
                <div style={{ color: 'var(--dark)' }}>6</div>
                <div style={{ color: '#ccc' }}>×</div>

                {/* Multiplier */}
                <div
                    className="animate-float"
                    style={{
                        color: 'var(--primary)',
                        position: 'relative',
                        zIndex: 10,
                        transform: showMagic ? 'scale(1.2)' : 'none',
                        transition: 'all 0.5s'
                    }}
                >
                    {step}
                </div>

                <div style={{ color: '#ccc' }}>=</div>

                {/* Result Area */}
                <div style={{ display: 'flex', minWidth: '120px', justifyContent: 'center', alignItems: 'center' }}>
                    {isEven ? (
                        // Even Logic: Half Split + Spy Tail
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {/* Tens Digit: Half of Step */}
                            <div style={{ position: 'relative', marginRight: '5px' }}>
                                <span style={{ color: showMagic && phase >= 2 ? 'var(--secondary)' : 'transparent', transition: 'all 0.5s' }}>
                                    {step / 2}
                                </span>

                                {/* Visualization of Splitting */}
                                {showMagic && phase < 2 && (
                                    <div className="animate-pop" style={{ position: 'absolute', top: '-40px', left: '-10px', fontSize: '1rem', color: 'var(--secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Scissors size={24} />
                                        <span>반으로 뚝!</span>
                                    </div>
                                )}
                            </div>

                            {/* Ones Digit: The Step itself */}
                            <div className={showMagic ? 'animate-pop' : ''} style={{ color: showMagic ? 'var(--primary)' : 'rgba(0,0,0,0.1)' }}>
                                {step}
                            </div>
                        </div>
                    ) : (
                        // Odd Logic remains same
                        <div style={{ fontSize: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {showMagic && phase >= 1 && (
                                <div className="animate-pop" style={{ color: '#f39c12' }}>
                                    (5 × {step}) = <strong>{5 * step}</strong>
                                </div>
                            )}
                            {showMagic && phase >= 2 && (
                                <div className="animate-pop" style={{ color: 'var(--success)', marginTop: '0.5rem' }}>
                                    + {step} (한 번 더!)
                                </div>
                            )}
                            {showMagic && phase >= 2 && (
                                <div className="animate-pop" style={{ borderTop: '2px solid #ccc', marginTop: '0.5rem', paddingTop: '0.5rem', color: 'var(--dark)', fontSize: '3rem' }}>
                                    = {6 * step}
                                </div>
                            )}
                            {!showMagic && <span style={{ color: '#ccc' }}>?</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Visual Explanation Area */}
            <div style={{ minHeight: '120px' }}>
                {showMagic ? (
                    <div className="animate-pop" style={{ background: isEven ? '#f3e5f5' : '#fff3e0', padding: '1rem', borderRadius: '12px', color: isEven ? '#8e44ad' : '#e67e22' }}>
                        {isEven ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ background: 'white', padding: '5px 10px', borderRadius: '8px' }}>
                                        1️⃣ <strong>{step}</strong>을 반으로 자르면? 👉 <strong style={{ color: 'var(--secondary)', fontSize: '1.5rem' }}>{step / 2}</strong> (십의 자리)
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ background: 'white', padding: '5px 10px', borderRadius: '8px' }}>
                                        2️⃣ <strong>{step}</strong>이 그대로 뒤로 가서 👉 <strong style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>{step}</strong> (일의 자리)
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <span>5단 로켓 <strong>{5 * step}</strong>에서 <strong>{step}</strong>만큼 더 점프! 🚀</span>
                        )}
                    </div>
                ) : (
                    <p>
                        {isEven ? `짝수 ${step}에게 마법을 걸어볼까요?` : `홀수 ${step}은 5단 로켓을 불러요!`}
                    </p>
                )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                {!showMagic ? (
                    <button className="btn btn-primary animate-pop" onClick={triggerMagic} style={{ background: isEven ? '#8e44ad' : '#e67e22' }}>
                        {isEven ? <Scissors style={{ verticalAlign: 'middle' }} /> : <Rocket style={{ verticalAlign: 'middle' }} />}
                        {isEven ? ' 반으로 자르기!' : ' 부스터 점화!'}
                    </button>
                ) : (
                    <button className="btn btn-outline" onClick={handleNext} style={{ color: '#555', borderColor: '#ccc' }}>
                        다음 숫자 ({step >= 8 ? 2 : step + 1}) <ArrowRight style={{ verticalAlign: 'middle' }} />
                    </button>
                )}
            </div>
        </div>
    );
}
