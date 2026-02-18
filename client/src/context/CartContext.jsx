import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const API_URL = 'http://localhost:5000/api/cart';

    const fetchCartItems = async () => {
        if (!user) return;
        try {
            const { data } = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCartItems(data);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCartItems();
        } else {
            setCartItems([]);
            setLoading(false);
        }
    }, [user]);

    const addToCart = async (itemData) => {
        if (!user) {
            toast.error('Please login to add to cart');
            return false;
        }

        try {
            const { data } = await axios.post(API_URL, itemData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCartItems([...cartItems, data]);
            toast.success('Added to cart!');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error adding to cart');
            return false;
        }
    };

    const removeFromCart = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCartItems(cartItems.filter(item => item._id !== id));
            toast.success('Removed from cart');
        } catch (error) {
            toast.error('Error removing item');
        }
    };

    const clearCart = async () => {
        try {
            await axios.delete(API_URL, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCartItems([]);
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    };

    return (
        <CartContext.Provider value={{ cartItems, loading, addToCart, removeFromCart, clearCart, fetchCartItems }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
