import { createContext, useContext, useState, useEffect } from 'react';
import { StorageService } from '../lib/storage.js';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Load last user or ask for login
    useEffect(() => {
        const stored = localStorage.getItem('gugudan_currentUser');
        if (stored) {
            const u = StorageService.getUser(stored);
            setUser(u);
        }
    }, []);

    const login = (name) => {
        if (!name) return;
        const u = StorageService.getUser(name);
        setUser(u);
        localStorage.setItem('gugudan_currentUser', name);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('gugudan_currentUser');
    };

    const updateStats = (a, b, isCorrect) => {
        if (!user) return;
        StorageService.updateStats(user.name, a, b, isCorrect);
        setUser(StorageService.getUser(user.name));
    };

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('gugudan_settings');
        return saved ? JSON.parse(saved) : {
            micEnabled: false,  // 사용자 마이크 입력
            ttsEnabled: true,   // 성우 문제 읽기
            sfxEnabled: true    // 효과음 및 BGM
        };
    });

    useEffect(() => {
        localStorage.setItem('gugudan_settings', JSON.stringify(settings));
    }, [settings]);

    const toggleSetting = async (key) => {
        const nextState = !settings[key];

        // Handle microphone permission when turning MIC on
        if (key === 'micEnabled' && nextState) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.error("Microphone permission denied:", err);
                alert("마이크 권한이 필요합니다. 설정에서 허용해주세요.");
                return;
            }
        }

        setSettings(prev => ({ ...prev, [key]: nextState }));
    };

    return (
        <UserContext.Provider value={{ user, login, logout, updateStats, settings, toggleSetting }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
