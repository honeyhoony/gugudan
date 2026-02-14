import { useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function ResultModal({ stats, maxCombo, onHome, onRetry }) {
    const mounted = useRef(false);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
        }
    }, []);

    const total = stats.correct + stats.wrong;
    const score = Math.round((stats.correct / total) * 100) || 0;

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-pop" style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', margin: '0 0 1rem' }}>🎉 끝! 🎉</h1>

                <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                    점수: <strong style={{ color: 'var(--primary)', fontSize: '2rem' }}>{score}점</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="dan-column" style={{ background: '#f0fdf4' }}>
                        <h3>맞은 개수</h3>
                        <p style={{ fontSize: '1.5rem', color: 'green' }}>{stats.correct}</p>
                    </div>
                    <div className="dan-column" style={{ background: '#fef2f2' }}>
                        <h3>틀린 개수</h3>
                        <p style={{ fontSize: '1.5rem', color: 'red' }}>{stats.wrong}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fffbeb', borderRadius: '12px', border: '2px solid #fcd34d' }}>
                    <h3>🔥 최대 연속 정답 🔥</h3>
                    <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 'bold', color: '#d97706' }}>{maxCombo} 콤보!</p>
                </div>

                <button className="btn btn-primary" onClick={onRetry}>다시하기</button>
                <button className="btn btn-outline" style={{ borderColor: '#ddd', color: '#666' }} onClick={onHome}>홈으로</button>
            </div>
        </div>
    );
}
