import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function Home() {
    const { login } = useUser();
    const navigate = useNavigate();
    const mounted = useRef(false);
    const [start, setStart] = useState(false);

    useEffect(() => {
        // Fallback for strict mode / fast refresh on iOS
        // Give a slight delay before attempting logic
        const timer = setTimeout(() => {
            login('구구단마스터');
            setStart(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [login]);

    useEffect(() => {
        if (start) {
            navigate('/dashboard', { replace: true });
        }
    }, [start, navigate]);

    // Fallback button if auto-redirect fails (common on some mobile browsers blocking auto-nav)
    return (
        <div className="card animate-pop" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚀 구구단 마스터</h1>
            <div style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>로딩 중...</div>

            {/* Manual Start Button as backup */}
            <button
                className="btn btn-primary"
                onClick={() => { login('구구단마스터'); navigate('/dashboard'); }}
                style={{ marginTop: '20px' }}
            >
                혹시 안 넘어가나요? (클릭)
            </button>
        </div>
    );
}
