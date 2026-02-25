import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/auth/users', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setUsers(data);
            } catch (error) {
                console.error('Failed to fetch users', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchUsers();
    }, [user]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">All Users</h1>

            {loading ? (
                <p>Loading users...</p>
            ) : users.length === 0 ? (
                <p>No users found.</p>
            ) : (
                <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 px-2">Name</th>
                                <th className="text-left py-2 px-2">Email</th>
                                <th className="text-left py-2 px-2">Role</th>
                                <th className="text-left py-2 px-2">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id} className="border-b last:border-none">
                                    <td className="py-2 px-2">{u.name}</td>
                                    <td className="py-2 px-2">{u.email}</td>
                                    <td className="py-2 px-2 uppercase font-semibold">{u.role}</td>
                                    <td className="py-2 px-2">{new Date(u.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;

