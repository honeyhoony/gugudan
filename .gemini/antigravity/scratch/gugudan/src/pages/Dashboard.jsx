import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { BookOpen, Target, Brain, Mic, MicOff, List, RotateCcw, Shuffle, Trophy } from 'lucide-react';

export default function Dashboard() {
    const { user, settings, toggleSetting, setSetting } = useUser();
    const navigate = useNavigate();
    const [selectedDan, setSelectedDan] = useState(null);
    const [showSelection, setShowSelection] = useState(false);
    const [examDans, setExamDans] = useState([2, 3, 4, 5, 6, 7, 8, 9]);

    const toggleExamDan = (num) => {
        setExamDans(prev =>
            prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
        );
    };

    const handlePractice = (mode) => {
        if (examDans.length === 0) {
            alert('최소 하나 이상의 단을 선택해주세요!');
            return;
        }
        navigate('/practice', { state: { mode, dans: examDans } });
    };

    if (!user) return null;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.2rem', margin: 0 }}>안녕하세요, {user.name} 👋</h1>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>오늘도 즐겁게 구구단을 배워봐요!</p>
                </div>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Lv.{Math.floor((user.stats?.totalCorrect || 0) / 50) + 1}
                </div>
            </div>

            {/* 1. 학습 */}
            <section style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <BookOpen size={24} color="var(--primary)" /> 1. 구구단 학습
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {[2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            className="btn btn-outline"
                            style={{ fontSize: '1.1rem', padding: '0.8rem 0' }}
                            onClick={() => navigate(`/learn/${num}`)}
                        >
                            {num}단
                        </button>
                    ))}
                </div>
            </section>

            {/* 2. 설정 */}
            <section style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                    <Brain size={24} color="var(--secondary)" /> 2. 설정
                </h3>

                <div style={{ marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.8rem', opacity: 0.9 }}>📢 오디오 설정</p>
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

                <div style={{ marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.8rem', opacity: 0.9 }}>🔢 입력 방식 설정</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                            onClick={() => setSetting('inputMethod', 'keypad')}
                            className={`btn ${settings.inputMethod === 'keypad' ? 'btn-secondary' : 'btn-outline'}`}
                            style={{ padding: '0.8rem', fontSize: '0.9rem' }}
                        >
                            계산기 키패드
                        </button>
                        <button
                            onClick={() => setSetting('inputMethod', 'choice')}
                            className={`btn ${settings.inputMethod === 'choice' ? 'btn-secondary' : 'btn-outline'}`}
                            style={{ padding: '0.8rem', fontSize: '0.9rem' }}
                        >
                            4지선다 선택지
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
