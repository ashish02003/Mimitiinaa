import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaChevronLeft } from 'react-icons/fa';

const TemplateDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTemplate = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axios.get(`http://localhost:5000/api/templates/${id}`);
                setTemplate(data);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Product not found');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchTemplate();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-l-4 border-blue-600"></div>
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
                <p className="text-gray-500 font-bold mb-4">{error || 'Product not found'}</p>
                <Link to="/" className="text-blue-600 font-bold hover:underline">← Back to Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Back link */}
            <div className="border-b bg-gray-50">
                <div className="container mx-auto px-4 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold text-sm uppercase tracking-wide"
                    >
                        <FaChevronLeft className="text-sm" />
                        Back
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                    {/* Left: Sample Preview */}
                    <div>
                        <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">Sample Preview</h2>
                        <div className="bg-gray-100 rounded-2xl p-6 md:p-8 aspect-square flex items-center justify-center border border-gray-200">
                            <img
                                src={template.demoImageUrl || template.previewImage || template.backgroundImageUrl}
                                alt={template.name}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/500x500/f8fafc/6366f1?text=' + template.name.replace(/ /g, '+');
                                }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-4 text-center italic">
                            This is how your design will look when you upload your photo
                        </p>
                    </div>

                    {/* Right: Product Details */}
                    <div>
                        <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">Product Details</h2>
                        
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{template.name}</h1>
                            <p className="text-sm text-blue-600 font-bold uppercase tracking-wide">{template.category}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="font-semibold text-gray-600">Price</span>
                                <span className="text-green-600 font-black text-2xl">₹{template.basePrice}</span>
                            </div>
                            {template.brand && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-semibold text-gray-600">Brand</span>
                                    <span className="text-gray-800">{template.brand}</span>
                                </div>
                            )}
                            {template.modelName && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-semibold text-gray-600">Model</span>
                                    <span className="text-gray-800">{template.modelName}</span>
                                </div>
                            )}
                            {template.caseType && template.caseType !== 'None' && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-semibold text-gray-600">Case Type</span>
                                    <span className="text-gray-800">{template.caseType}</span>
                                </div>
                            )}
                            {template.variantNo && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-semibold text-gray-600">Variant No</span>
                                    <span className="text-gray-800">{template.variantNo}</span>
                                </div>
                            )}
                            {template.productSize && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-semibold text-gray-600">Product Size</span>
                                    <span className="text-gray-800">{template.productSize}</span>
                                </div>
                            )}
                            {template.printSize && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-semibold text-gray-600">Print Size</span>
                                    <span className="text-gray-800">{template.printSize}</span>
                                </div>
                            )}
                            {template.moq != null && (
                                <div className="flex justify-between py-2">
                                    <span className="font-semibold text-gray-600">MOQ</span>
                                    <span className="text-gray-800">{template.moq}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 space-y-3">
                            <button
                                onClick={() => navigate(`/customize/${template._id}`)}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98]"
                            >
                                Customize Now
                            </button>
                            <Link
                                to={`/category/${template.category}`}
                                className="block w-full text-center py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all"
                            >
                                View more in {template.category}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateDetails;
