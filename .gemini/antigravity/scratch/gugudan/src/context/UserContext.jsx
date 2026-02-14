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

    return (
        <UserContext.Provider value={{ user, login, logout, updateStats }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
