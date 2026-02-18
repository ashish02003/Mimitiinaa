import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const [templates, setTemplates] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/templates');
                setTemplates(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchTemplates();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                };
                await axios.delete(`http://localhost:5000/api/templates/${id}`, config);
                setTemplates(templates.filter(t => t._id !== id));
            } catch (error) {
                console.error(error);
                alert('Error deleting template');
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <div className="mb-4 flex gap-4">
                <Link to="/admin/create-template" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold">
                    Create New Template
                </Link>
                <Link to="/admin/orders" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-semibold">
                    View Orders
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.length === 0 ? (
                    <p className="col-span-3 text-center text-gray-500 py-10">No templates created yet.</p>
                ) : (
                    templates.map(template => (
                        <div key={template._id} className="bg-white p-4 shadow-lg rounded-xl border border-gray-100 flex flex-col">
                            <img src={template.previewImage} alt={template.name} className="w-full h-48 object-cover mb-4 rounded-lg" />
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{template.name}</h3>
                                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase tracking-tighter">{template.category}</span>
                            </div>
                            <p className="text-gray-600 font-semibold mb-4 text-xl">${template.basePrice}</p>

                            <div className="mt-auto flex gap-2 pt-4 border-t border-gray-50">
                                <Link
                                    to={`/admin/edit-template/${template._id}`}
                                    className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
                                >
                                    ✏️ Edit
                                </Link>
                                <button
                                    onClick={() => handleDelete(template._id)}
                                    className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 text-sm font-bold transition-colors"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
