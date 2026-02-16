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
        const defaultSettings = {
            micEnabled: false,
            ttsEnabled: true,
            sfxEnabled: true,
            inputMethod: 'keypad'
        };
        if (!saved) return defaultSettings;

        const parsed = JSON.parse(saved);
        // Ensure new fields are present
        return { ...defaultSettings, ...parsed };
    });

    useEffect(() => {
        localStorage.setItem('gugudan_settings', JSON.stringify(settings));
    }, [settings]);

    const toggleSetting = async (key) => {
        const nextState = !settings[key];

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

    const setSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <UserContext.Provider value={{ user, login, logout, updateStats, settings, toggleSetting, setSetting }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
