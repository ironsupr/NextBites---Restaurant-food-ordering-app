import { createContext, useContext, useState, useEffect } from 'react';
import api, { setLastLoginTime } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored token and user on mount
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token, user } = response.data;

            // Set login time to prevent 401 redirect race condition
            setLastLoginTime();
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed'
            };
        }
    };

    const register = async (email, password, country) => {
        try {
            const response = await api.post('/auth/register', {
                email,
                password,
                country
            });
            const { access_token, user } = response.data;

            // Set login time to prevent 401 redirect race condition
            setLastLoginTime();
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        // Optional: Call backend logout endpoint
        try {
            api.post('/auth/logout');
        } catch (e) {
            // Ignore error on logout
        }
    };

    const hasPermission = (permission) => {
        // Simple role-based check for frontend UI logic
        // Real enforcement happens on backend
        if (!user) return false;

        const role = user.role;

        if (role === 'admin') return true;

        if (role === 'manager') {
            return ['view_menu', 'create_order', 'checkout', 'cancel_order'].includes(permission);
        }

        if (role === 'team_member') {
            return ['view_menu', 'create_order'].includes(permission);
        }

        return false;
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
