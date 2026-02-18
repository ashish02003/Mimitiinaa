import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaSearch, FaChevronRight } from 'react-icons/fa';
import CategoryCard from '../components/CategoryCard';

const Home = () => {
    const [templates, setTemplates] = useState([]);

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

    return (
        <div className="bg-white min-h-screen">
            {/* 1. Main Tagline */}
            <div className="py-10 text-center">
                <h1 className="text-3xl md:text-4xl font-black text-[#2e82f7] mb-6 tracking-tight animate-fadeIn" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Life’s Moments, Beautifully Printed
                </h1>

                {/* 2. Search Bar */}
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="relative group shadow-xl shadow-blue-50/50">
                        <input
                            type="text"
                            placeholder="Search for Mobile Cases, Tshirts, Mugs etc."
                            className="w-full bg-[#f0f7ff] border-none py-4 px-6 pr-14 rounded-full text-gray-700 font-medium focus:ring-2 focus:ring-blue-400 transition-all outline-none"
                        />
                        <button className="absolute right-0 top-0 bottom-0 bg-transparent text-gray-400 px-6 group-hover:text-blue-600 transition-colors">
                            <FaSearch className="text-xl" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Popular Products Section */}
            <div className="bg-[#fffdf2] py-12 border-y border-yellow-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black text-[#5c4a30] uppercase tracking-widest relative inline-block">
                            Popular Products
                            <span className="absolute -bottom-2 left-0 right-0 h-1 bg-yellow-400/30 rounded-full"></span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8">
                        <CategoryCard title="Photo Albums" image="https://images.unsplash.com/photo-1544273677-277914c9ad3a?w=400" link="/photo-albums" />
                        <CategoryCard title="Name Pencils" image="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400" link="/pencils" />

                        <CategoryCard title="Fridge Magnets" image="https://images.unsplash.com/photo-1618220179428-22790b461013?w=400" link="/magnets" />
                        <CategoryCard title="Mugs" image="https://img.freepik.com/premium-psd/white-mug-mockup_1310-721.jpg" link="/category/mugs" />
                        <CategoryCard title="Sippers / Bottles" image="https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=400" link="/category/sippers" />
                        <CategoryCard title="Metal Name" image="https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?w=400" link="/metal-names" />
                    </div>
                </div>
            </div>

            {/* 4. New In Section (Existing Templates) */}
            <div className="container mx-auto px-4 py-16">
                <div className="flex justify-between items-end mb-10 border-b-2 border-gray-100 pb-4">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">New In</h2>
                        <div className="h-1 w-20 bg-blue-600 mt-1 rounded-full"></div>
                    </div>
                    <Link to="/templates" className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                        VIEW ALL <FaChevronRight className="text-xs" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {templates.map(template => (
                        <div key={template._id} className="group relative">
                            {/* Product Card */}
                            <div className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:border-blue-100">
                                <div className="aspect-[3/4] overflow-hidden relative">
                                    <img
                                        src={template.previewImage}
                                        alt={template.name}
                                        className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/400x600/f8fafc/6366f1?text=' + template.name.replace(' ', '+');
                                        }}
                                    />
                                    {/* Quick Access Overlay */}
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest text-blue-600 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                            Quick Customize
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">{template.category}</p>
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 truncate px-2">{template.name}</h3>

                                    <div className="flex flex-col gap-3">
                                        <span className="text-2xl font-black text-gray-900">₹{template.basePrice}</span>
                                        <Link
                                            to={`/customize/${template._id}`}
                                            className="bg-blue-600 text-white py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-blue-200 active:scale-95"
                                        >
                                            Customize Now
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {templates.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">No product templates found. Stay tuned!</p>
                    </div>
                )}
            </div>

            {/* 5. Site Footer */}
            <footer className="bg-gray-50 border-t py-12 mt-12">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} PrintShoppy - Custom Online Gifting Shop
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
