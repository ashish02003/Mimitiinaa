import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import AdminCategories from './pages/AdminCategories';
import CreateTemplate from './pages/CreateTemplate';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import CustomizeProduct from './pages/CustomizeProduct';
import MobileCases from './pages/MobileCases';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import ProductCategory from './pages/ProductCategory';
import TemplateDetails from './pages/TemplateDetails';
import { FaShoppingCart, FaUser, FaChevronDown, FaChevronUp, FaSignOutAlt, FaUserCircle, FaTimes } from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import { CartProvider, useCart } from './context/CartContext';
import Logo from './components/Logo';
import TopInfoBar from './components/TopInfoBar';

// Logout Confirmation Modal
const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-fadeIn text-center">
                <button onClick={onCancel} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100">
                    <FaTimes className="text-gray-400 text-sm" />
                </button>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <FaSignOutAlt size={24} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Logout?</h3>
                <p className="text-gray-500 font-medium mb-8">
                    Are you sure you want to end your session? You'll need to log in again to access your account.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Stay In
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3.5 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        Yes, Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

// Navigation Component
const Navigation = () => {
    const { user, logout } = useAuth();
    const { cartItems } = useCart();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogoutClick = () => {
        setIsProfileOpen(false);
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = () => {
        setShowLogoutModal(false);
        logout();
    };

    return (
        <>
            <LogoutModal
                isOpen={showLogoutModal}
                onConfirm={handleConfirmLogout}
                onCancel={() => setShowLogoutModal(false)}
            />
            <header className="w-full bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm font-sans">
                <nav className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-8">
                    {/* Left: Logo */}
                    <Link to="/" className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
                        <Logo />
                    </Link>

                    {/* Right: Nav links + Cart + Account */}
                    <div className="flex items-center gap-4">
                        {/* Nav Links inline with actions */}
                        <div className="hidden lg:flex items-center gap-6 border-r border-gray-100 pr-4 mr-1">
                            <Link to="/" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-wider relative group">
                                Home
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 rounded-full"></span>
                            </Link>
                            {user && user.role === 'admin' && (
                                <>
                                    <Link to="/admin" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-wider relative group">
                                        Dashboard
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 rounded-full"></span>
                                    </Link>
                                    <Link to="/admin/orders" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-wider relative group">
                                        Orders
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 rounded-full"></span>
                                    </Link>
                                    <Link to="/admin/users" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-wider relative group">
                                        Users
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 rounded-full"></span>
                                    </Link>
                                </>
                            )}
                        </div>
                        {/* Cart icon (shown for non-admin users) */}
                        {(!user || user.role !== 'admin') && (
                            <Link to="/cart" className="relative p-3 rounded-2xl bg-gray-50 hover:bg-blue-600 hover:text-white transition-all group shadow-sm border border-gray-100">
                                <FaShoppingCart className="text-lg text-gray-600 group-hover:text-white transition-colors" />
                                {cartItems.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black min-w-[20px] h-5 flex items-center justify-center rounded-full border-2 border-white shadow-md">
                                        {cartItems.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-100 group"
                                >
                                    <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-md flex-shrink-0">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-sm font-black">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-start hidden sm:flex">
                                        <span className="text-[9px] font-black text-gray-400 uppercase leading-none tracking-wider">Account</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-black text-gray-800 leading-none">{user.name.split(' ')[0]}</span>
                                            {isProfileOpen
                                                ? <FaChevronUp className="text-[10px] text-blue-600" />
                                                : <FaChevronDown className="text-[10px] text-gray-400 group-hover:text-blue-600 transition-colors" />
                                            }
                                        </div>
                                    </div>
                                    {/* Mobile: just show chevron */}
                                    <span className="sm:hidden">
                                        {isProfileOpen
                                            ? <FaChevronUp className="text-[10px] text-blue-600" />
                                            : <FaChevronDown className="text-[10px] text-gray-400" />
                                        }
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                        <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-gray-100 py-2 z-50 animate-fadeIn">
                                            <div className="px-5 py-3.5 border-b border-gray-50">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Signed in as</p>
                                                <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                                                <p className="text-xs text-gray-400 font-medium truncate">{user.email}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                >
                                                    <FaUserCircle className="text-base text-gray-400" />
                                                    My Dashboard
                                                </Link>
                                                {user.role !== 'admin' && (
                                                    <Link
                                                        to="/cart"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                    >
                                                        <FaShoppingCart className="text-base text-gray-400" />
                                                        My Cart
                                                        {cartItems.length > 0 && (
                                                            <span className="ml-auto bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">{cartItems.length}</span>
                                                        )}
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="border-t border-gray-50 py-1">
                                                <button
                                                    onClick={handleLogoutClick}
                                                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-black text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                                                >
                                                    <FaSignOutAlt className="text-base" />
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="px-5 py-2.5 rounded-2xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:scale-105">
                                Sign In
                            </Link>
                        )}
                    </div>
                </nav>
            </header>
        </>
    );
};

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
                        <Toaster position="top-center" reverseOrder={false} />
                        <Navigation />
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/admin/login" element={<AdminLogin />} />
                            <Route path="/register" element={<Register />} />

                            <Route path="/mobile-cases" element={<MobileCases />} />
                            <Route path="/category/:categoryName" element={<ProductCategory />} />
                            <Route path="/product/:id" element={<TemplateDetails />} />
                            <Route path="/customize/:id" element={<CustomizeProduct />} />
                            <Route path="/profile" element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            } />
                            <Route path="/cart" element={
                                <ProtectedRoute>
                                    <Cart />
                                </ProtectedRoute>
                            } />

                            {/* Admin Routes */}
                            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="/admin/dashboard" element={
                                <ProtectedRoute adminOnly={true}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin/create-template" element={
                                <ProtectedRoute adminOnly={true}>
                                    <CreateTemplate />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin/orders" element={
                                <ProtectedRoute adminOnly={true}>
                                    <AdminOrders />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin/categories" element={
                                <ProtectedRoute adminOnly={true}>
                                    <AdminCategories />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin/users" element={
                                <ProtectedRoute adminOnly={true}>
                                    <AdminUsers />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin/edit-template/:id" element={
                                <ProtectedRoute adminOnly={true}>
                                    <CreateTemplate />
                                </ProtectedRoute>
                            } />
                        </Routes>
                    </div>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
