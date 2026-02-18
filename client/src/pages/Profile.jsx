import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaUserCircle, FaBoxOpen, FaHistory } from 'react-icons/fa';

const Profile = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/orders/myorders', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setOrders(data);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchOrders();
    }, [user]);

    return (
        <div className="container mx-auto p-4 lg:p-12 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Info Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4 ring-4 ring-blue-100">
                                <FaUserCircle size={60} className="text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{user.name}</h2>
                            <p className="text-gray-500 font-medium mb-6">{user.email}</p>

                            <div className="w-full space-y-3 pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Role</span>
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase">{user.role}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Status</span>
                                    <span className="text-green-600 font-black">ACTIVE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders History Column */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                        <FaHistory className="text-blue-600" />
                        My Order History
                    </h3>

                    {loading ? (
                        <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">Loading history...</div>
                    ) : orders.length === 0 ? (
                        <div className="bg-white p-16 rounded-3xl text-center shadow-sm border border-dashed border-gray-200">
                            <FaBoxOpen size={50} className="mx-auto text-gray-300 mb-6" />
                            <p className="text-gray-500 font-bold text-lg">You haven't placed any orders yet.</p>
                            <p className="text-gray-400 text-sm mt-1">Your custom creations will appear here!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(order => (
                                <div key={order._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:border-blue-200 transition-colors">
                                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-gray-400 tracking-tighter uppercase leading-none block">Order<br />ID</span>
                                            <span className="font-mono text-xs font-bold text-gray-600">#{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-0.5">Date</span>
                                                <span className="text-xs font-bold text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[10px] font-black uppercase tracking-widest block mb-0.5 ${order.status === 'Delivered' ? 'text-green-500' : 'text-orange-500'}`}>Status</span>
                                                <span className="text-xs font-bold">{order.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        {order.orderItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-6 items-center mb-6 last:mb-0">
                                                <img src={item.finalImageUrl} alt="Order Item" className="w-16 h-16 object-contain rounded-xl bg-gray-50 p-1" />
                                                <div className="flex-1">
                                                    <span className="text-xs font-bold text-blue-600 block mb-1">QTY: {item.qty}</span>
                                                    <p className="text-xl font-black text-gray-800 leading-none">₹{item.price}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-end">
                                            <div>
                                                <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Total Paid</span>
                                                <span className="text-2xl font-black text-blue-600">₹{order.totalPrice}</span>
                                            </div>
                                            <button className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest bg-blue-50 px-5 py-2 rounded-full transition-colors">
                                                Track Order
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
