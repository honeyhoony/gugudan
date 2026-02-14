import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function Home() {
    const [name, setName] = useState('');
    const { login } = useUser();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            login(name.trim());
            navigate('/dashboard');
        }
    };

    return (
        <div className="card animate-pop">
            <h1>🚀 구구단 마스터</h1>
            <p>구구단 영웅이 될 준비 됐나요?</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="input-field"
                    placeholder="이름을 입력하세요 (예: 민지)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
                <button type="submit" className="btn btn-primary animate-float">
                    시작하기
                </button>
            </form>
        </div>
    );
}
