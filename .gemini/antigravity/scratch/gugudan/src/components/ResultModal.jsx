import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Brain } from 'lucide-react';
import { AudioService } from '../lib/audioService';
import { useUser } from '../context/UserContext';

export default function ResultModal({ stats, maxCombo, wrongProblems = [], onHome, onRetry }) {
    const { settings } = useUser();
    const mounted = useRef(false);
    const navigate = useNavigate();

    const total = stats.correct + stats.wrong;
    const score = Math.round((stats.correct / total) * 100) || 0;

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;

            // Celebratory effects for high scores (90+)
            if (score >= 90) {
                if (settings.sfxEnabled) AudioService.playPerfectSound();

                const duration = 5000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
                const randomInRange = (min, max) => Math.random() * (max - min) + min;

                const interval = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();
                    if (timeLeft <= 0) return clearInterval(interval);
                    const particleCount = 50 * (timeLeft / duration);
                    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
                }, 250);
            }
        }
    }, [score]);

    const handleRetryWrong = () => {
        if (wrongProblems.length > 0) {
            navigate('/practice', {
                state: {
                    mode: 'retry-wrong',
                    wrongProblems: wrongProblems
                }
            });
            window.location.reload();
        }
    };

    const getEvaluation = (s) => {
        if (s >= 90) return { text: "축하해요! 최고예요! 🥳", color: "#3b82f6" };
        if (s >= 80) return { text: "훌륭해요! 조금만 더! 🌟", color: "#10b981" };
        if (s >= 70) return { text: "잘했어요! 실력이 쑥쑥! 👍", color: "#f59e0b" };
        if (s >= 60) return { text: "고생했어요! 포기하지 마요! 👏", color: "#6366f1" };
        if (s >= 50) return { text: "화이팅! 다시 도전해볼까요? 💪", color: "#8b5cf6" };
        return { text: "더 연습해볼까요? 할 수 있어요! 🌱", color: "#ef4444" };
    };

    const evalResult = getEvaluation(score);

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="modal-content animate-pop" style={{
                textAlign: 'center', maxWidth: '400px', width: '90%',
                background: 'white', padding: '2rem', borderRadius: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                margin: 'auto'
            }}>
                <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem', color: evalResult.color }}>{score >= 90 ? '🏆 대단해요!' : '🎮 경기 종료!'}</h1>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: evalResult.color }}>
                    {evalResult.text}
                </p>

                <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                    점수: <strong style={{ color: evalResult.color, fontSize: '2.5rem' }}>{score}점</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="dan-column" style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>맞은 개수</h3>
                        <p style={{ fontSize: '1.5rem', color: 'green', margin: 0 }}>{stats.correct}</p>
                    </div>
                    <div className="dan-column" style={{ background: '#fef2f2', padding: '1rem', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>틀린 개수</h3>
                        <p style={{ fontSize: '1.5rem', color: 'red', margin: 0 }}>{stats.wrong}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fffbeb', borderRadius: '12px', border: '2px solid #fcd34d' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>🔥 최대 연속 정답 🔥</h3>
                    <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 'bold', color: '#d97706' }}>{maxCombo} 콤보!</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {wrongProblems.length > 0 && (
                        <button className="btn btn-secondary" onClick={handleRetryWrong} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Brain size={20} /> 틀린 문제만 다시 풀기
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={onRetry} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <RotateCcw size={20} /> 처음부터 다시하기
                    </button>
                    <button className="btn btn-outline" onClick={onHome} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderColor: '#ddd', color: '#666' }}>
                        <Home size={20} /> 홈으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
}
