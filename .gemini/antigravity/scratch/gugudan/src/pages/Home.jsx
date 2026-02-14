import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function Home() {
    const { login } = useUser();
    const navigate = useNavigate();
    const mounted = useRef(false);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            // Force login synchronously immediately or use a very short timeout
            // to ensure state updates happen
            login('구구단마스터');
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 100);
        }
    }, [login, navigate]);

    return (
        <div className="card animate-pop" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <div style={{ fontSize: '2rem' }}>🚀 로딩 중...</div>
        </div>
    );
}
