import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaSearch, FaChevronRight, FaFacebookF, FaTwitter, FaInstagram, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';
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
            {/* 1. Hero Section */}
            <div className="container mx-auto px-4 md:px-8 max-w-7xl py-12 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tighter uppercase leading-tight">
                    Life’s Moments, <span className="text-blue-600">Beautifully Printed</span>
                </h1>

                {/* 2. Search Bar - Cleaner Style */}
                <div className="max-w-3xl mx-auto mt-8 relative group">
                    <div className="flex items-center bg-gray-50 border-2 border-gray-100 rounded-2xl overflow-hidden focus-within:border-blue-400 focus-within:bg-white transition-all shadow-sm">
                        <div className="pl-6 pr-2 text-gray-400">
                            <FaSearch />
                        </div>
                        <input
                            type="text"
                            placeholder="Search for Mugs, T-Shirts, Keychains etc."
                            className="w-full bg-transparent py-5 px-4 text-gray-700 font-medium outline-none"
                        />
                        <button className="bg-blue-600 text-white px-10 py-5 font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all">
                            Search
                        </button>
                    </div>
                </div>
            </div>


            {/* 3. Popular Categories Section - Contained & Rounded with Bottom Margin */}
            <div className="container mx-auto px-4 md:px-12 max-w-7xl mb-16">
                <div className="bg-[#fff9f5] py-10 rounded-[2.5rem] border border-gray-100 shadow-sm">

                    <div className="flex flex-col items-center mb-10">

                        <h2 className="text-[16px] md:text-[18px] font-black text-gray-800 uppercase tracking-[0.2em] font-heading relative inline-block text-center mb-0">
                            SHOP BY CATEGORY
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-blue-600"></div>
                        </h2>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 md:gap-8">
                        {categories.map((cat, idx) => {
                            const bgColors = ['bg-white', 'bg-white/80', 'bg-white/60', 'bg-white/90'];
                            return (
                                <CategoryCard
                                    key={cat._id}
                                    title={cat.name}
                                    image={cat.image || 'https://via.placeholder.com/150'}
                                    link={`/category/${cat.name}`}
                                    bgClass={bgColors[idx % bgColors.length]}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>






            {/* 4. Category-wise Template Sections - Premium Gradient Browse Experience */}
            <div className="container mx-auto px-4 md:px-12 max-w-7xl pb-16 space-y-16">
                {Object.entries(templatesByCategory).map(([categoryName, categoryTemplates], index) => {
                    const colors = [
                        { section: 'bg-gradient-to-br from-[#fff7ed] to-[#ffedd5]', card: 'bg-[#ffedd5]', text: 'text-[#9a3412]', border: 'border-[#fdba74]', icon: 'text-orange-500' },
                        { section: 'bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe]', card: 'bg-[#e0f2fe]', text: 'text-[#075985]', border: 'border-[#7dd3fc]', icon: 'text-blue-500' },
                        { section: 'bg-gradient-to-br from-[#fefce8] to-[#fef08a]', card: 'bg-[#fef08a]', text: 'text-[#854d0e]', border: 'border-[#fde047]', icon: 'text-yellow-600' },
                        { section: 'bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff]', card: 'bg-[#f3e8ff]', text: 'text-[#6b21a8]', border: 'border-[#d8b4fe]', icon: 'text-purple-600' }
                    ];

                    const color = colors[index % colors.length];

                    return (
                        <div key={categoryName} className={`${color.section} rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden border border-white shadow-[0_20px_40px_rgba(0,0,0,0.02)]`}>
                            {/* Heading & View All on the same line - Removed left arrow */}
                            <div className="flex justify-between items-center mb-10">
                                <div className="flex items-center gap-4">
                                    <h2 className={`text-2xl md:text-3xl font-black uppercase tracking-[0.1em] ${color.text} font-heading`}>
                                        {categoryName}
                                    </h2>
                                </div>

                                <Link
                                    to={`/category/${categoryName}`}
                                    className={`bg-white/60 backdrop-blur-md ${color.text} px-6 py-2.5 rounded-full font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-white hover:scale-105 transition-all shadow-sm active:scale-95`}
                                >
                                    Browse all <FaChevronRight className="text-[7px]" />
                                </Link>
                            </div>

                            {/* Product Row: Dynamic Background Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                                {categoryTemplates.slice(0, 6).map((template, tIndex) => {
                                    return (
                                        <Link
                                            key={template._id}
                                            to={`/product/${template._id}`}
                                            className="group block"
                                        >
                                            {/* Image Container: Themed background for integration */}
                                            <div className={`aspect-square ${color.card} rounded-3xl overflow-hidden shadow-sm transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] group-hover:-translate-y-2 relative border-4 border-white`}>
                                                <img
                                                    src={template.demoImageUrl || template.previewImage || template.backgroundImageUrl}
                                                    alt={template.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://placehold.co/400x400/f8fafc/6366f1?text=' + template.name.replace(' ', '+');
                                                    }}
                                                />
                                            </div>


                                            {/* Product Title: Compact and Bold */}
                                            <div className="mt-4 text-center">
                                                <h3 className="text-[13px] font-extrabold text-[#1f2937] group-hover:text-blue-600 transition-colors tracking-tight leading-tight line-clamp-1 px-1 font-sans">
                                                    {template.name}
                                                </h3>
                                                <div className="mt-2 flex items-center justify-center gap-1.5">
                                                    <span className={`text-[11px] font-black uppercase ${color.text} bg-white/40 px-2 py-0.5 rounded-md`}>
                                                        ₹{template.basePrice + (template.packingCharges || 0)}/-
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>






            {/* 5. Site Footer - Modern Redesign */}
            <footer className="bg-gray-900 text-white pt-20 pb-10 mt-20">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        {/* Brand Column */}
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black tracking-tighter">Mimitiinaa</h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Bringing your memories to life with high-quality custom prints. From mugs to t-shirts, we make gifting personal and special.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-all"><FaFacebookF /></a>
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-all"><FaTwitter /></a>
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-all"><FaInstagram /></a>
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-all"><FaWhatsapp /></a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-black mb-6 uppercase tracking-widest text-red-400">Quick Links</h3>
                            <ul className="space-y-4 text-gray-400 text-sm">
                                <li><Link to="/" className="hover:text-white transition-colors">Home Page</Link></li>
                                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                                <li><Link to="/profile" className="hover:text-white transition-colors">My Account</Link></li>
                            </ul>
                        </div>

                        {/* Top Categories */}
                        <div>
                            <h3 className="text-lg font-black mb-6 uppercase tracking-widest text-red-400">Categories</h3>
                            <ul className="space-y-4 text-gray-400 text-sm">
                                {categories.slice(0, 4).map(cat => (
                                    <li key={cat._id}><Link to={`/category/${cat.name}`} className="hover:text-white transition-colors">{cat.name}</Link></li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="text-lg font-black mb-6 uppercase tracking-widest text-red-400">Connect</h3>
                            <ul className="space-y-4 text-gray-400 text-sm">
                                <li className="flex items-start gap-3">
                                    <FaMapMarkerAlt className="mt-1 text-red-400" />
                                    <span>123 Print Street, Creative City, India</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <FaPhoneAlt className="text-red-400" />
                                    <span>+91 98765 43210</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <FaEnvelope className="text-red-400" />
                                    <span>hello@mimitiinaa.com</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-10 border-t border-gray-800 text-center">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                            © {new Date().getFullYear()} Mimitiinaa - Custom Gifting Shop
                        </p>
                        <div className="flex justify-center gap-6 text-gray-600 text-[10px] font-black uppercase tracking-widest">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default Home;
