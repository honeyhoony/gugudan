import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { BookOpen, Target, Brain, Mic, MicOff, List, RotateCcw, Shuffle, Trophy } from 'lucide-react';

export default function Dashboard() {
    const { user, settings, toggleSetting } = useUser();
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

    const handlePractice = (mode) => {
        if (examDans.length === 0) {
            alert('최소 하나 이상의 단을 선택해주세요!');
            return;
        }

        navigate('/practice', {
            state: {
                mode: mode,
                dans: examDans,
                voiceEnabled: settings.voiceEnabled
            }
        });
    };

    return (
        <div className="card animate-pop" style={{ maxWidth: '600px', width: '95%', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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

            {/* 2. 설정 */}
            <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                        <Brain size={24} color="var(--secondary)" /> 2. 오디오 설정
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        <button
                            onClick={() => toggleSetting('micEnabled')}
                            className={`btn ${settings.micEnabled ? 'btn-secondary' : 'btn-outline'}`}
                            style={{ padding: '0.6rem 0.2rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}
                        >
                            {settings.micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                            마이크 {settings.micEnabled ? 'ON' : 'OFF'}
                        </button>

                        <button
                            onClick={() => toggleSetting('ttsEnabled')}
                            className={`btn ${settings.ttsEnabled ? 'btn-secondary' : 'btn-outline'}`}
                            style={{ padding: '0.6rem 0.2rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}
                        >
                            <Brain size={20} />
                            성우 {settings.ttsEnabled ? 'ON' : 'OFF'}
                        </button>

                        <button
                            onClick={() => toggleSetting('sfxEnabled')}
                            className={`btn ${settings.sfxEnabled ? 'btn-secondary' : 'btn-outline'}`}
                            style={{ padding: '0.6rem 0.2rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}
                        >
                            <Trophy size={20} />
                            효과음 {settings.sfxEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                {/* Range Selection Shared */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>연습할 단을 선택하세요</h4>
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
                                style={{ fontSize: '1rem', padding: '0.6rem', margin: 0, opacity: examDans.includes(num) ? 1 : 0.4 }}
                                onClick={() => toggleExamDan(num)}
                            >
                                {num}단
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
                    <button className="btn btn-outline" onClick={() => handlePractice('order')} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <List size={24} /> <span style={{ fontSize: '0.9rem' }}>차례대로</span>
                    </button>
                    <button className="btn btn-outline" onClick={() => handlePractice('reverse')} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <RotateCcw size={24} /> <span style={{ fontSize: '0.9rem' }}>거꾸로</span>
                    </button>
                    <button className="btn btn-outline" onClick={() => handlePractice('random')} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', gridColumn: 'span 2' }}>
                        <Shuffle size={24} /> <span style={{ fontSize: '0.9rem' }}>랜덤 섞어서 풀기</span>
                    </button>
                </div>
            </section>

            {/* 3. 실력 점검 */}
            <section>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <Trophy size={24} color="#FFD700" /> 3. 실력 점검 (게임)
                </h3>

                <button
                    className="btn btn-primary"
                    onClick={() => handlePractice('exam')}
                    style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}
                >
                    <Target size={24} style={{ marginRight: '10px' }} /> 20문제 실전 테스트!
                </button>
            </section>
        </div>
    );
}

