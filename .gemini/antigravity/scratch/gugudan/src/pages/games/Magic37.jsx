import { useState } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ChevronRight, CornerDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function Magic37() {
    const navigate = useNavigate();
    const [tab, setTab] = useState(3); // 3 or 7
    const [grid, setGrid] = useState(Array(9).fill(null));
    const [phase, setPhase] = useState(1); // 1: Ones Digit, 2: Tens Digit (Only for 7-dan currently requested)
    // 3-dan tens: Not explicitly requested as interactive relay, but we show result.

    const reset = (newTab) => {
        setTab(newTab);
        setGrid(Array(9).fill(null));
        setPhase(1);
    };

    const handleCellClick = (idx) => {
        if (phase === 2) return; // Locked during phase 2 animation/view

        const currentCount = grid.filter(x => x !== null).length;
        const nextNum = currentCount + 1;

        let targetIdx = -1;
        if (tab === 3) {
            // 3-Dan: Bottom-Left start, Up
            // Col 1 (up): indices 6, 3, 0
            // Col 2 (up): indices 7, 4, 1
            // Col 3 (up): indices 8, 5, 2
            const map3 = [6, 3, 0, 7, 4, 1, 8, 5, 2];
            targetIdx = map3[nextNum - 1];
        } else {
            // 7-Dan: Top-Right start, Down
            // Col 3 (down): indices 2, 5, 8
            // Col 2 (down): indices 1, 4, 7
            // Col 1 (down): indices 0, 3, 6
            const map7 = [2, 5, 8, 1, 4, 7, 0, 3, 6];
            targetIdx = map7[nextNum - 1];
        }

        if (idx === targetIdx) {
            const newGrid = [...grid];
            newGrid[idx] = nextNum;
            setGrid(newGrid);

            if (nextNum === 9) {
                if (tab === 7) {
                    setTimeout(() => setPhase(2), 500);
                    confetti({ particleCount: 50, spread: 50 });
                } else {
                    confetti();
                }
            }
        }
    };

    const getTargetHint = () => {
        if (phase === 2) return "십의 자리가 이어달리기를 해요!";
        const nextNum = grid.filter(x => x !== null).length + 1;
        if (nextNum > 9) return "완성!";
        return nextNum;
    };

    return (
        <div className="card animate-pop" style={{ maxWidth: '600px', width: '95%', margin: '0 auto', minHeight: '80vh' }}>
            <button onClick={() => navigate('/practice')} className="btn-outline" style={{ position: 'absolute', left: '1rem', top: '1rem', padding: '0.5rem', border: 'none', background: 'transparent', color: '#666' }}>
                <ArrowLeft />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '2rem' }}>
                <button className={`btn ${tab === 3 ? 'btn-primary' : 'btn-outline'}`} onClick={() => reset(3)} style={{ flex: 1, color: tab === 3 ? 'white' : '#555' }}>3단 (엘리베이터)</button>
                <button className={`btn ${tab === 7 ? 'btn-primary' : 'btn-outline'}`} onClick={() => reset(7)} style={{ flex: 1, color: tab === 7 ? 'white' : '#555' }}>7단 (미끄럼틀)</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                {phase === 1 && (
                    <div style={{
                        background: 'rgba(0,0,0,0.6)',
                        padding: '0.8rem',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        {tab === 3 ? (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <ArrowUp size={32} className="animate-float" />
                                    <span style={{ fontSize: '0.8rem' }}>위로!</span>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div>왼쪽 아래칸부터</div>
                                    <div style={{ color: 'var(--accent)' }}>1, 2, 3... 올라가세요!</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <ArrowDown size={32} className="animate-float" />
                                    <span style={{ fontSize: '0.8rem' }}>아래로!</span>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div>오른쪽 위칸부터</div>
                                    <div style={{ color: 'var(--accent)' }}>1, 2, 3... 내려오세요!</div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: '900', marginTop: '1rem' }}>
                    {phase === 1 ? `다음 숫자: ${getTargetHint()}` : '십의 자리 이어달리기!'}
                </div>
            </div>

            <div style={{ position: 'relative', maxWidth: '360px', margin: '0 auto' }}>

                {/* Phase 2 Row Hints (Left Side) - Only for 7-dan */}
                {phase === 2 && tab === 7 && (
                    <div style={{ position: 'absolute', left: '-5px', top: '0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                        {/* Row 1 Hint */}
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>0, 1, 2</div>

                        {/* Row 2 Hint */}
                        <div className="animate-pop" style={{ background: 'var(--accent)', padding: '2px 8px', borderRadius: '10px', color: 'var(--dark)', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            2로 시작! <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
                        </div>

                        {/* Row 3 Hint */}
                        <div className="animate-pop" style={{ background: 'var(--accent)', padding: '2px 8px', borderRadius: '10px', color: 'var(--dark)', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            4로 시작! <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
                        </div>
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    background: 'rgba(255,255,255,0.3)',
                    padding: '15px',
                    borderRadius: '16px',
                    marginLeft: (phase === 2 && tab === 7) ? '80px' : '0' // Make space for hints
                }}>
                    {grid.map((val, idx) => {
                        let tens = null;
                        if (phase === 2 && tab === 7) {
                            const row = Math.floor(idx / 3);
                            const col = idx % 3;
                            if (row === 0) tens = col;
                            if (row === 1) tens = 2 + col;
                            if (row === 2) tens = 4 + col;
                        } else if (tab === 3 && grid.every(x => x)) {
                            // Simple 3-dan tens
                            const row = Math.floor(idx / 3);
                            tens = row;
                        }

                        return (
                            <div
                                key={idx}
                                onClick={() => handleCellClick(idx)}
                                style={{
                                    height: '70px',
                                    background: val ? 'white' : 'rgba(255,255,255,0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    boxShadow: val ? '0 4px 0 rgba(0,0,0,0.1)' : 'none',
                                    color: val ? 'var(--dark)' : 'transparent',
                                    border: '2px solid rgba(0,0,0,0.05)',
                                    position: 'relative'
                                }}
                            >
                                {/* Direction Arrow Hints inside empty cells */}
                                {!val && phase === 1 && (
                                    <div style={{ opacity: 0.2, color: '#000' }}>
                                        {tab === 3 ? <ArrowUp size={24} /> : <ArrowDown size={24} />}
                                    </div>
                                )}

                                {/* Tens Digit */}
                                {(phase === 2 || (tab === 3 && grid.every(x => x))) && (
                                    <span className="animate-pop" style={{ color: '#666', marginRight: '3px', fontSize: '1.4rem', fontWeight: '500' }}>
                                        {tens}
                                    </span>
                                )}

                                {/* Ones Digit */}
                                <span style={{ fontSize: '2rem', fontWeight: '900', color: val ? 'var(--dark)' : 'transparent' }}>{val}</span>

                                {/* Relay Arcs - Visualizing the "End to Start" jump */}
                                {phase === 2 && tab === 7 && (idx === 2 || idx === 5) && (
                                    <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', zIndex: 10, color: 'var(--error)' }}>
                                        <CornerDownLeft size={32} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {phase === 2 && tab === 7 && (
                <div className="animate-pop" style={{ marginTop: '1.5rem', background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'left', fontSize: '1rem', border: '2px solid var(--accent)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--dark)' }}>🏃 이어달리기 비법</div>
                    <div style={{ color: '#666' }}>1. 앞 줄이 <strong>2</strong>로 끝났으니, 다음 줄은 <strong>2</strong>로 시작!</div>
                    <div style={{ color: '#666' }}>2. 그 다음 줄이 <strong>4</strong>로 끝났으니, <strong>4</strong>로 시작!</div>
                </div>
            )}

            {grid.every(x => x !== null) && (phase === 1 && tab !== 7 || phase === 2 || tab === 3) && (
                <div className="animate-pop" style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '2rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>🎉 {tab}단 완성!</h3>
                </div>
            )}
        </div>
    );
}
