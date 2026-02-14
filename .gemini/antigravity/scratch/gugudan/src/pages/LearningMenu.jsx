import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, LayoutGrid, Rocket, Shield } from 'lucide-react';

export default function LearningMenu() {
    const navigate = useNavigate();

    return (
        <div className="card animate-pop" style={{ maxWidth: '600px', width: '100%' }}>
            <button onClick={() => navigate('/dashboard')} className="btn-outline" style={{ position: 'absolute', left: '1rem', top: '1rem', padding: '0.5rem', border: 'none', background: 'transparent', color: 'var(--dark)' }}>
                <ArrowLeft />
            </button>

            <h2>✨ 마법 구구단 연습실 ✨</h2>
            <p>스스로 만져보며 원리를 깨달아요!</p>

            <div className="choice-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>

                <button className="btn btn-primary" onClick={() => navigate('/practice/magic-248')} style={{ background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', color: 'var(--dark)', textAlign: 'left', padding: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <Sparkles size={32} style={{ marginRight: '1rem' }} />
                    <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>2단, 4단, 8단: 복제 마법</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>두 배씩 커지는 쌍둥이 숫자들!</div>
                    </div>
                </button>

                <button className="btn btn-primary" onClick={() => navigate('/practice/magic-37')} style={{ background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', color: 'var(--dark)', textAlign: 'left', padding: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <LayoutGrid size={32} style={{ marginRight: '1rem' }} />
                    <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>3단, 7단: 3x3 격자 마법</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>핸드폰 키패드처럼 숫자를 채워요!</div>
                    </div>
                </button>

                <button className="btn btn-primary" onClick={() => navigate('/practice/magic-6')} style={{ background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', color: 'var(--dark)', textAlign: 'left', padding: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <Rocket size={32} style={{ marginRight: '1rem' }} />
                    <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>6단: 반반 마법 & 로켓</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>짝수는 반으로, 홀수는 로켓으로!</div>
                    </div>
                </button>

                <button className="btn btn-primary" onClick={() => navigate('/practice/magic-10')} style={{ background: 'linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)', color: 'var(--dark)', textAlign: 'left', padding: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <Shield size={32} style={{ marginRight: '1rem' }} />
                    <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>10단: 우주 헬멧 (0)</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>숫자 뒤에 0만 붙여주세요!</div>
                    </div>
                </button>

            </div>
        </div>
    );
}
