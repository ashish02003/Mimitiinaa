import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaTrash, FaShoppingBag, FaPlus, FaMinus, FaTag,
    FaTruck, FaShieldAlt, FaPencilAlt, FaArrowLeft, FaTimes, FaExclamationTriangle
} from 'react-icons/fa';

// Confirmation Popup Modal
const ConfirmModal = ({ isOpen, onConfirm, onCancel, itemName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-fadeIn">
                <button onClick={onCancel} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <FaTimes className="text-gray-400" />
                </button>
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <FaExclamationTriangle size={28} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Remove Item?</h3>
                    <p className="text-gray-500 font-medium mb-6">
                        Are you sure you want to remove <span className="font-black text-gray-800">"{itemName}"</span> from your cart?
                    </p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Keep Item
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                        >
                            Yes, Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, loading } = useCart();
    const navigate = useNavigate();
    const [removeModal, setRemoveModal] = useState({ isOpen: false, itemId: null, itemName: '' });

    const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
    const totalItems = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

    const handleRemoveClick = (item) => {
        setRemoveModal({
            isOpen: true,
            itemId: item._id,
            itemName: item.template?.name || 'Custom Product'
        });
    };

    const handleConfirmRemove = () => {
        removeFromCart(removeModal.itemId);
        setRemoveModal({ isOpen: false, itemId: null, itemName: '' });
    };

    const handleCancelRemove = () => {
        setRemoveModal({ isOpen: false, itemId: null, itemName: '' });
    };

    const handleQtyChange = (item, delta) => {
        const newQty = (item.quantity || 1) + delta;
        if (newQty >= 1) {
            updateQuantity(item._id, newQty);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading your cart...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/60 py-10">
            <ConfirmModal
                isOpen={removeModal.isOpen}
                onConfirm={handleConfirmRemove}
                onCancel={handleCancelRemove}
                itemName={removeModal.itemName}
            />

            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition-all"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">Shopping Cart</h1>
                        <p className="text-gray-400 font-medium mt-1">{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
                    </div>
                </div>

                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <FaShoppingBag size={40} className="text-blue-300" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">Your cart is empty</h2>
                        <p className="text-gray-400 font-medium mb-8">Start customizing products to add them here</p>
                        <Link
                            to="/"
                            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <div
                                    key={item._id}
                                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all overflow-hidden"
                                >
                                    <div className="p-5 flex gap-5 items-start">
                                        {/* Product Image */}
                                        <div className="w-28 h-28 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                                            {item.finalDesignUrl ? (
                                                <img
                                                    src={item.finalDesignUrl}
                                                    alt={item.template?.name || 'Custom Design'}
                                                    className="w-full h-full object-contain p-1"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center text-gray-300">
                                                    <FaShoppingBag size={28} />
                                                    <span className="text-[10px] font-bold mt-1">No Preview</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div>
                                                    <h3 className="font-black text-gray-900 text-lg leading-tight truncate">
                                                        {item.template?.name || 'Custom Product'}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                            <FaTag size={8} /> Custom Design
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-2xl font-black text-gray-900 whitespace-nowrap">
                                                    ₹{(item.price * (item.quantity || 1)).toLocaleString()}
                                                </p>
                                            </div>

                                            <p className="text-sm text-gray-400 font-medium mb-4">
                                                Unit price: <span className="text-gray-600 font-bold">₹{item.price}</span>
                                            </p>

                                            {/* Quantity & Actions Row */}
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-0 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                                    <button
                                                        onClick={() => handleQtyChange(item, -1)}
                                                        disabled={(item.quantity || 1) <= 1}
                                                        className="px-3 py-2 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <FaMinus size={11} />
                                                    </button>
                                                    <span className="w-10 text-center font-black text-gray-900 text-sm">
                                                        {item.quantity || 1}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQtyChange(item, 1)}
                                                        className="px-3 py-2 text-gray-500 hover:bg-gray-200 transition-colors"
                                                    >
                                                        <FaPlus size={11} />
                                                    </button>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => navigate(`/customize/${item.template?._id || item.template}`)}
                                                        className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                                                    >
                                                        <FaPencilAlt size={10} /> Edit Design
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveClick(item)}
                                                        className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
                                                    >
                                                        <FaTrash size={10} /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm sticky top-24 overflow-hidden">
                                <div className="p-6 border-b border-gray-50">
                                    <h2 className="text-xl font-black text-gray-900">Order Summary</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Subtotal ({totalItems} items)</span>
                                        <span className="font-black text-gray-800">₹{totalPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                                            <FaTruck size={12} />
                                            Shipping
                                        </div>
                                        <span className="text-green-600 font-black">FREE</span>
                                    </div>
                                    <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                        <span className="text-lg font-black text-gray-900">Total</span>
                                        <span className="text-2xl font-black text-blue-600">₹{totalPrice.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 space-y-3">
                                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:scale-[1.02] transition-all tracking-wide">
                                        Proceed to Checkout
                                    </button>
                                    <Link
                                        to="/"
                                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-all text-sm"
                                    >
                                        <FaShoppingBag size={13} /> Continue Shopping
                                    </Link>
                                </div>

                                {/* Trust Badges */}
                                <div className="mx-6 mb-6 p-4 bg-green-50 rounded-2xl border border-green-100">
                                    <div className="flex items-start gap-3">
                                        <FaShieldAlt className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-black text-green-800 uppercase tracking-wider mb-0.5">Secure Checkout</p>
                                            <p className="text-xs text-green-600 font-medium leading-snug">
                                                Your payment info is encrypted and never stored. Powered by Mimitiinaa.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
