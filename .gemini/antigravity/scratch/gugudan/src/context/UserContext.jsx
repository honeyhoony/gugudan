import { createContext, useContext, useState, useEffect } from 'react';
import { StorageService } from '../lib/storage.js';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Load last user or ask for login
    useEffect(() => {
        // Check if 'currentUser' exists in localStorage separate from 'users'
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
        // Refresh user state
        setUser(StorageService.getUser(user.name));
    };

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('gugudan_settings');
        return saved ? JSON.parse(saved) : { voiceEnabled: false };
    });

    useEffect(() => {
        localStorage.setItem('gugudan_settings', JSON.stringify(settings));
    }, [settings]);

    const toggleVoice = async () => {
        const nextState = !settings.voiceEnabled;

        if (nextState) {
            try {
                // Request microphone permission ONLY when turning voice ON in main dashboard
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Stop it immediately, we just wanted to trigger the permission prompt
                stream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.error("Microphone permission denied:", err);
                alert("마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요.");
                return;
            }
        }

        setSettings(prev => ({ ...prev, voiceEnabled: nextState }));
    };

    return (
        <UserContext.Provider value={{ user, login, logout, updateStats, settings, toggleVoice }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
