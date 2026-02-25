import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    // helper to persist user
    const persistUser = (data) => {
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
    };

    const login = async (email, password) => {
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            persistUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
            persistUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
    };

    const updateProfile = async (name, email) => {
        try {
            const { data } = await axios.put(
                'http://localhost:5000/api/auth/profile',
                { name, email },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            const updatedUser = { ...data, token: user.token };
            persistUser(updatedUser);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Profile update failed'
            };
        }
    };

    const updateAvatar = async (file) => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const { data } = await axios.put(
                'http://localhost:5000/api/auth/avatar',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            const updatedUser = { ...data, token: user.token };
            persistUser(updatedUser);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Avatar upload failed'
            };
        }
    };

    const deleteAvatar = async () => {
        try {
            const { data } = await axios.delete(
                'http://localhost:5000/api/auth/avatar',
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            const updatedUser = { ...data, token: user.token };
            persistUser(updatedUser);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Avatar delete failed'
            };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateProfile, updateAvatar, deleteAvatar, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
