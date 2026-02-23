import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaSearch, FaChevronRight } from 'react-icons/fa';
import CategoryCard from '../components/CategoryCard';

const Home = () => {
    const [templates, setTemplates] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templatesRes, categoriesRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/templates'),
                    axios.get('http://localhost:5000/api/categories')
                ]);
                setTemplates(templatesRes.data);
                setCategories(categoriesRes.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
        
        // Refresh every 5 seconds to catch new categories/templates
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Group templates by category
    const templatesByCategory = categories.reduce((acc, category) => {
        const categoryTemplates = templates.filter(t => t.category === category.name);
        if (categoryTemplates.length > 0) {
            acc[category.name] = categoryTemplates;
        }
        return acc;
    }, {});

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
                            placeholder="Search for Mugs, T-Shirts, Keychains etc."
                            className="w-full bg-[#f0f7ff] border-none py-4 px-6 pr-14 rounded-full text-gray-700 font-medium focus:ring-2 focus:ring-blue-400 transition-all outline-none"
                        />
                        <button className="absolute right-0 top-0 bottom-0 bg-transparent text-gray-400 px-6 group-hover:text-blue-600 transition-colors">
                            <FaSearch className="text-xl" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Popular Categories Section */}
            <div className="bg-[#fffdf2] py-12 border-y border-yellow-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black text-[#5c4a30] uppercase tracking-widest relative inline-block">
                            Shop by Category
                            <span className="absolute -bottom-2 left-0 right-0 h-1 bg-yellow-400/30 rounded-full"></span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8">
                        {categories.map((cat) => (
                            <CategoryCard
                                key={cat._id}
                                title={cat.name}
                                image={cat.image || 'https://via.placeholder.com/150'}
                                link={`/category/${cat.name}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Category-wise Template Sections */}
            {Object.entries(templatesByCategory).map(([categoryName, categoryTemplates]) => (
                <div key={categoryName} className="container mx-auto px-4 py-16 ">
                    <div className="flex justify-between items-end mb-10 border-b-2  border-gray-100 pb-4">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{categoryName}</h2>
                            <div className="h-1 w-20 bg-blue-600 mt-1 rounded-full"></div>
                        </div>
                        <Link 
                            to={`/category/${categoryName}`} 
                            className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            VIEW ALL <FaChevronRight className="text-xs" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {categoryTemplates.slice(0, 5).map(template => (
                            <div key={template._id} className="group relative">
                                {/* Product Card */}
                                <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1">
                                    <div className="aspect-square overflow-hidden relative bg-gray-50">
                                        <img
                                            src={template.demoImageUrl || template.previewImage || template.backgroundImageUrl}
                                            alt={template.name}
                                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/400x400/f8fafc/6366f1?text=' + template.name.replace(' ', '+');
                                            }}
                                        />
                                    </div>

                                    <div className="p-4 text-center">
                                        <h3 className="text-sm font-bold text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem]">{template.name}</h3>
                                        <p className="text-lg font-black text-green-600 mb-3">From ₹{template.basePrice}</p>
                                        <Link
                                            to={`/product/${template._id}`}
                                            className="block w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-blue-700 transition-all"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )            )}

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
