import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function Home() {
    const { login } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        // Automatically login with a default name and redirect
        login('구구단마스터');
        navigate('/dashboard');
    }, [login, navigate]);

    return (
        <div className="card animate-pop">
            <h1>🚀 구구단 마스터</h1>
            <p>로딩 중...</p>
        </div>
    );
}
