import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
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
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import { CartProvider, useCart } from './context/CartContext';
import Logo from './components/Logo';
import TopInfoBar from './components/TopInfoBar';

// Navigation Component
const Navigation = () => {
    const { user, logout } = useAuth();
    const { cartItems } = useCart();

    return (
        <header className="w-full bg-white z-40">
            <nav className="p-4 border-b">
                <div className="container mx-auto flex justify-between items-center gap-4">
                    {/* Left: Logo */}
                    <Link to="/" className="flex items-center transform hover:scale-105 transition-transform">
                        <Logo />
                    </Link>

                    {/* Right: Auth & Cart */}
                    <div className="flex items-center space-x-6">
                        <div className="hidden lg:flex items-center space-x-6 text-[14px] font-bold text-gray-700 uppercase mr-4 border-r pr-6 border-gray-100">
                            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
                            {user && user.role === 'admin' && (
                                <>
                                    <Link to="/admin/dashboard" className="hover:text-blue-600 transition-colors">Admin Dashboard</Link>
                                    <Link to="/admin/orders" className="hover:text-blue-600 transition-colors">Orders</Link>
                                </>
                            )}
                        </div>
                        {user ? (
                            <>
                                <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 group font-bold text-sm uppercase">
                                    <FaUser className="text-lg" />
                                    <span className="hidden sm:inline">Profile</span>
                                </Link>

                                <Link to="/cart" className="relative group text-gray-700 hover:text-blue-600">
                                    <FaShoppingCart className="text-2xl" />
                                    {cartItems.length > 0 && (
                                        <span className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                            {cartItems.length}
                                        </span>
                                    )}
                                </Link>

                                <button onClick={logout} className="text-xs font-bold text-red-500 hover:text-red-700 uppercase border-l pl-4">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center space-x-4 text-sm font-bold uppercase">
                                <Link to="/login" className="text-gray-600 hover:text-blue-600">Login / Register</Link>
                                <Link to="/cart" className="relative group text-gray-700 hover:text-blue-600 px-2">
                                    <FaShoppingCart className="text-2xl" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
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
