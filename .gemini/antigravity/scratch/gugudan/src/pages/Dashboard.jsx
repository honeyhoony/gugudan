import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { StorageService } from '../lib/storage';
import { BookOpen, Target, Brain, LogOut, CheckSquare, Sparkles, LayoutGrid } from 'lucide-react';
import GugudanTable from '../components/GugudanTable';

export default function Dashboard() {
    const { user, logout } = useUser();
    const navigate = useNavigate();
    const [showTable, setShowTable] = useState(false);
    const [basicDans, setBasicDans] = useState([2, 3, 4, 5, 6, 7, 8, 9]);
    const [advancedDans, setAdvancedDans] = useState([]);
    const [problemCount, setProblemCount] = useState(30);

    const weakCount = user ? StorageService.getWeakProblems(user.name).length : 0;

    if (!user) {
        navigate('/');
        return null;
    }

    const toggleBasic = (dan) => {
        setBasicDans(prev => {
            if (prev.includes(dan)) {
                if (prev.length === 1 && advancedDans.length === 0) return prev; // Prevent completely empty
                return prev.filter(d => d !== dan);
            } else {
                return [...prev, dan].sort((a, b) => a - b);
            }
        });
    };

    const toggleAdvanced = (dan) => {
        setAdvancedDans(prev => {
            if (prev.includes(dan)) {
                if (prev.length === 1 && basicDans.length === 0) return prev;
                return prev.filter(d => d !== dan);
            } else {
                return [...prev, dan].sort((a, b) => a - b);
            }
        });
    };

    const handlePractice = () => {
        const allDans = [...basicDans, ...advancedDans];
        if (allDans.length === 0) return;

        navigate('/practice', {
            state: {
                mode: 'custom',
                dans: allDans,
                limit: problemCount
            }
        });
    };

    const handleWeakPractice = () => {
        navigate('/practice', {
            state: {
                mode: 'weak',
                limit: problemCount
            }
        });
    };

    return (
        <div className="card animate-pop" style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>안녕, {user.name}! 👋</h2>
                <button onClick={logout} className="btn-outline" style={{ padding: '0.5rem', width: 'auto' }}>
                    <LogOut size={20} />
                </button>
            </div>

            {/* --- New Practice Mode Buttons --- */}
            <h3 style={{ textAlign: 'left', marginBottom: '0.5rem' }}>학습 모드 선택</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>

                {/* Magic Practice */}
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/learning')}
                    style={{ background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', color: 'var(--dark)' }}
                >
                    <Sparkles size={24} style={{ marginBottom: '5px' }} />
                    <span>마법 구구단 연습실</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 'normal' }}>원리부터 재미있게!</span>
                </button>

                {/* Vedic Math */}
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/vedic-practice')}
                    style={{ background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', color: '#333' }}
                >
                    <LayoutGrid size={24} style={{ marginBottom: '5px' }} />
                    <span>19단 비법 연습</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 'normal' }}>인도 베다 수학 (12~19단)</span>
                </button>
            </div>

            <hr style={{ opacity: 0.2, margin: '1.5rem 0' }} />

            <h3 style={{ textAlign: 'left', marginBottom: '0.5rem' }}>실전 모의고사 (퀴즈)</h3>

            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0 }}>1. 구구단 (2~9단)</h4>
                    <div>
                        <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', marginRight: '5px' }} onClick={() => setBasicDans([2, 3, 4, 5, 6, 7, 8, 9])}>전체 선택</button>
                        <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => setBasicDans([])}>전체 취소</button>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {[2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            className={`btn ${basicDans.includes(num) ? 'btn-secondary' : 'btn-outline'}`}
                            style={{ fontSize: '1rem', padding: '0.5rem', opacity: basicDans.includes(num) ? 1 : 0.6 }}
                            onClick={() => toggleBasic(num)}
                        >
                            {num}단 {basicDans.includes(num) && <CheckSquare size={16} style={{ marginLeft: 4 }} />}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0 }}>2. 19단 (10~19단)</h4>
                    <div>
                        <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', marginRight: '5px' }} onClick={() => setAdvancedDans([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])}>전체 선택</button>
                        <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => setAdvancedDans([])}>전체 취소</button>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                    {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(num => (
                        <button
                            key={num}
                            className={`btn ${advancedDans.includes(num) ? 'btn-primary' : 'btn-outline'}`}
                            style={{ fontSize: '0.9rem', padding: '0.4rem', opacity: advancedDans.includes(num) ? 1 : 0.6 }}
                            onClick={() => toggleAdvanced(num)}
                        >
                            {num}단 {advancedDans.includes(num) && <CheckSquare size={16} style={{ marginLeft: 4 }} />}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>3. 문제 개수 설정</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[10, 20, 30, 40, 50].map(p => (
                        <button
                            key={p}
                            className={`btn ${problemCount === p ? 'btn-secondary' : 'btn-outline'}`}
                            onClick={() => setProblemCount(p)}
                            style={{ flex: 1, padding: '0.5rem', minWidth: '50px' }}
                        >
                            {p}문제
                        </button>
                    ))}
                </div>
            </div>

            <button className="btn btn-primary" onClick={handlePractice}>
                <Target style={{ marginRight: '8px' }} /> 실전 모의고사 시작!
            </button>

            {weakCount > 0 && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1rem' }}>
                    <p>틀린 문제가 {weakCount}개 있어요!</p>
                    <button className="btn btn-secondary" onClick={handleWeakPractice}>
                        <Brain style={{ marginRight: '8px' }} /> 약점 집중 공략!
                    </button>
                </div>
            )}

            <button className="btn btn-outline" onClick={() => setShowTable(true)} style={{ marginTop: '2rem', width: 'auto', padding: '0.5rem 1rem' }}>
                <BookOpen size={16} style={{ marginRight: '5px' }} /> 표 참고하기
            </button>

            {showTable && <GugudanTable onClose={() => setShowTable(false)} />}
        </div>
    );
}
