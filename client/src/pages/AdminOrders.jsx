import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                };
                const { data } = await axios.get('http://localhost:5000/api/orders', config);
                setOrders(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchOrders();
    }, [user.token]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">All Orders</h1>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="py-3 px-4 text-left">Order ID</th>
                            <th className="py-3 px-4 text-left">User</th>
                            <th className="py-3 px-4 text-left">Date</th>
                            <th className="py-3 px-4 text-left">Total</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Design</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {orders.map(order => (
                            <tr key={order._id} className="hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm font-medium text-gray-900">{order._id}</td>
                                <td className="py-3 px-4 text-sm text-gray-500">{order.user?.name || 'Unknown'}</td>
                                <td className="py-3 px-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="py-3 px-4 text-sm font-semibold text-green-600">${order.totalPrice}</td>
                                <td className="py-3 px-4 text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm">
                                    {order.orderItems.map((item, index) => (
                                        <a key={index} href={item.finalImageUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline block">
                                            View Design
                                        </a>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {orders.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                    <p>No orders found.</p>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
