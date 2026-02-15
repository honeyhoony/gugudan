import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { BookOpen, Target, Brain, Mic, MicOff, List, RotateCcw, Shuffle, Trophy } from 'lucide-react';

export default function Dashboard() {
    const { user, settings, toggleVoice } = useUser();
    const navigate = useNavigate();
    const [selectedDan, setSelectedDan] = useState(null);
    const [showSelection, setShowSelection] = useState(false);
    const [examDans, setExamDans] = useState([2, 3, 4, 5, 6, 7, 8, 9]);

    if (!user) {
        navigate('/');
        return null;
    }

    const toggleExamDan = (dan) => {
        setExamDans(prev => {
            if (prev.includes(dan)) {
                return prev.filter(d => d !== dan);
            } else {
                return [...prev, dan].sort((a, b) => a - b);
            }
        });
    };

    const handlePractice = (mode, dan = null) => {
        if ((mode === 'exam' || mode === 'random') && examDans.length === 0) {
            alert('최소 하나 이상의 단을 선택해주세요!');
            return;
        }

        navigate('/practice', {
            state: {
                mode: mode, // 'order', 'reverse', 'random', 'exam'
                dan: dan,
                dans: (mode === 'exam' || mode === 'random') ? examDans : [dan],
                voiceEnabled: settings.voiceEnabled
            }
        });
    };

    return (
        <div className="card animate-pop" style={{ maxWidth: '600px', width: '95%', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>🎯 구구단 마스터</h1>
                <p style={{ opacity: 0.8 }}>반가워요, {user.name}!</p>
            </div>

            {/* 1. 전체 구구단 표 */}
            <section style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <BookOpen size={24} color="var(--primary)" /> 1. 전체 구구단 표
                </h3>

                {!showSelection ? (
                    <button className="btn btn-outline" onClick={() => setShowSelection(true)}>
                        구구단 전체 표 보기
                    </button>
                ) : (
                    <div className="animate-pop">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
                            {[2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    className={`btn ${selectedDan === num ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ fontSize: '1.1rem', padding: '0.8rem 0', margin: 0 }}
                                    onClick={() => setSelectedDan(selectedDan === num ? null : num)}
                                >
                                    {num}단
                                </button>
                            ))}
                        </div>

                        {selectedDan && (
                            <div className="animate-pop" style={{
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.5rem',
                                border: '1px solid rgba(0,0,0,0.1)'
                            }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                    <div key={i} style={{ fontSize: '1.1rem', textAlign: 'center' }}>
                                        {selectedDan} × {i} = <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{selectedDan * i}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button className="btn-outline" onClick={() => { setShowSelection(false); setSelectedDan(null); }} style={{ marginTop: '1rem', border: 'none', fontSize: '0.9rem', opacity: 0.6 }}>
                            접기
                        </button>
                    </div>
                )}
            </section>

            {/* 2. 연습하기 */}
            <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <Brain size={24} color="var(--secondary)" /> 2. 연습하기
                    </h3>
                    <button
                        onClick={toggleVoice}
                        className={`btn ${settings.voiceEnabled ? 'btn-secondary' : 'btn-outline'}`}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        {settings.voiceEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                        음성인식 {settings.voiceEnabled ? 'ON' : 'OFF'}
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <button className="btn btn-secondary" onClick={() => handlePractice('order')} style={{ justifyContent: 'flex-start', padding: '1rem' }}>
                        <List size={20} style={{ marginRight: '12px' }} /> 차례대로 풀기
                    </button>
                    <button className="btn btn-secondary" onClick={() => handlePractice('reverse')} style={{ justifyContent: 'flex-start', padding: '1rem' }}>
                        <RotateCcw size={20} style={{ marginRight: '12px' }} /> 거꾸로 풀기
                    </button>
                    <button className="btn btn-secondary" onClick={() => handlePractice('random')} style={{ justifyContent: 'flex-start', padding: '1rem' }}>
                        <Shuffle size={20} style={{ marginRight: '12px' }} /> 랜덤으로 풀기
                    </button>
                </div>
            </section>

            {/* 3. 실력 점검 */}
            <section>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <Trophy size={24} color="#FFD700" /> 3. 실력 점검 (게임)
                </h3>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <h4 style={{ margin: 0 }}>출제 범위 선택</h4>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }} onClick={() => setExamDans([2, 3, 4, 5, 6, 7, 8, 9])}>전체 선택</button>
                            <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }} onClick={() => setExamDans([])}>전체 취소</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                        {[2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                className={`btn ${examDans.includes(num) ? 'btn-secondary' : 'btn-outline'}`}
                                style={{ fontSize: '1rem', padding: '0.5rem', margin: 0, opacity: examDans.includes(num) ? 1 : 0.4 }}
                                onClick={() => toggleExamDan(num)}
                            >
                                {num}단
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => handlePractice('exam')}
                    style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)' }}
                >
                    <Target size={24} style={{ marginRight: '10px' }} /> 20문제 실전 테스트 시작!
                </button>
            </section>
        </div>
    );
}

