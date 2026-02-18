import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronRight, FaShoppingCart, FaMagic } from 'react-icons/fa';

const ProductCategory = () => {
    const { categoryName } = useParams();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const displayCategory = categoryName === 'mugs' ? 'Mug' :
        categoryName === 'sippers' ? 'Sippers / Bottles' :
            categoryName;

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`http://localhost:5000/api/templates?category=${displayCategory}`);
                setTemplates(data);
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, [displayCategory]);

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.variantNo && t.variantNo.includes(searchTerm))
    );

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header Section */}
            <div className="bg-[#f8fafc] py-12 px-4 border-b border-gray-100">
                <div className="container mx-auto text-center">
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">
                        {displayCategory} Collection
                    </h1>
                    <p className="text-gray-500 font-medium max-w-2xl mx-auto mb-8">
                        Customize your {displayCategory} with your favorite photos and designs. High-quality printing with worldwide shipping.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto relative group">
                        <input
                            type="text"
                            placeholder={`Search ${displayCategory}...`}
                            className="w-full bg-white border-2 border-gray-100 rounded-full py-4 px-6 pr-14 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors">
                            <FaSearch size={20} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-l-4 border-blue-600 mb-4"></div>
                        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading {displayCategory}...</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">No {displayCategory} found for your search.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-3xl shadow-2xl border border-gray-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                    <th className="py-5 px-6 font-black uppercase text-[10px] tracking-widest rounded-tl-3xl">SI No.</th>
                                    <th className="py-5 px-6 font-black uppercase text-[10px] tracking-widest">Variant No</th>
                                    <th className="py-5 px-6 font-black uppercase text-[10px] tracking-widest">Item Name</th>
                                    <th className="py-5 px-6 font-black uppercase text-[10px] tracking-widest">Product Size</th>
                                    <th className="py-5 px-6 font-black uppercase text-[10px] tracking-widest">Print Size</th>
                                    <th className="py-5 px-6 font-black uppercase text-[10px] tracking-widest">MOQ</th>
                                    <th className="py-5 px-6 font-black uppercase text-[10px] tracking-widest rounded-tr-3xl text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTemplates.map((template, index) => (
                                    <tr key={template._id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group">
                                        <td className="py-6 px-6 font-bold text-gray-400">{index + 1}</td>
                                        <td className="py-6 px-6">
                                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md font-black text-[11px] group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                {template.variantNo || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-6 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden p-2 flex-shrink-0">
                                                    <img
                                                        src={template.previewImage}
                                                        alt={template.name}
                                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{template.name}</p>
                                                    <p className="text-[10px] font-bold text-blue-500 uppercase">₹{template.basePrice}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-6 font-bold text-gray-600">{template.productSize || '-'}</td>
                                        <td className="py-6 px-6 font-bold text-gray-600">{template.printSize || '-'}</td>
                                        <td className="py-6 px-6 font-black text-gray-900">{template.moq || 1}</td>
                                        <td className="py-6 px-6 text-center">
                                            <button
                                                onClick={() => navigate(`/customize/${template._id}`)}
                                                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2 mx-auto justify-center"
                                            >
                                                <FaMagic className="text-xs" />
                                                Customize
                                            </button>
                                        </td>
                                    </tr>
                                )).reverse()}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCategory;
