import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaShoppingBag } from 'react-icons/fa';

const Cart = () => {
    const { cartItems, removeFromCart, loading } = useCart();
    const navigate = useNavigate();

    const totalPrice = cartItems.reduce((acc, item) => acc + item.price, 0);

    if (loading) return <div className="p-10 text-center">Loading cart...</div>;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-4xl">
            <h1 className="text-3xl font-extrabold mb-8 flex items-center gap-3">
                <FaShoppingBag className="text-blue-600" />
                Shopping Cart
            </h1>

            {cartItems.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm text-center border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 mb-6 text-lg font-medium">Your cart is currently empty</p>
                    <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
                        Start Customizing Products
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map((item) => (
                            <div key={item._id} className="bg-white p-5 rounded-2xl shadow-sm flex gap-5 items-center border border-gray-100 group">
                                <img src={item.finalImageUrl} alt="Custom Design" className="w-24 h-24 object-contain rounded-lg bg-gray-50 group-hover:scale-105 transition-transform" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{item.template?.name || 'Custom Product'}</h3>
                                    <p className="text-blue-600 font-extrabold mt-1 text-xl leading-none">₹{item.price}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                        <button
                                            onClick={() => navigate(`/customize/${item.template?._id || item.template}`)}
                                            className="text-xs font-semibold text-gray-500 hover:text-blue-600 uppercase tracking-wider"
                                        >
                                            Edit Design
                                        </button>
                                        <button
                                            onClick={() => removeFromCart(item._id)}
                                            className="text-xs font-semibold text-red-400 hover:text-red-600 flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            <FaTrash size={10} /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm h-fit border border-gray-100 sticky top-24">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">Order Summary</h2>
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-gray-600 font-medium">
                                <span>Subtotal ({cartItems.length} items)</span>
                                <span>₹{totalPrice}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 font-medium">
                                <span>Shipping</span>
                                <span className="text-green-600">FREE</span>
                            </div>
                            <div className="border-t pt-4 flex justify-between">
                                <span className="text-lg font-bold text-gray-800">Total</span>
                                <span className="text-2xl font-black text-blue-600">₹{totalPrice}</span>
                            </div>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 mb-4">
                            Proceed to Checkout
                        </button>
                        <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">Secure Checkout Powered by PrintShoppy</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
