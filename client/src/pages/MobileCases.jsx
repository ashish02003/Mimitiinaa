import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronRight, FaMobileAlt } from 'react-icons/fa';

const MobileCases = () => {
    const [step, setStep] = useState(1); // 1: Brand, 2: Model, 3: Case Type
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/templates/brands`);
            setBrands(data);
        } catch (error) {
            console.error('Error fetching brands:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchModels = async (brand) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/templates/models/${brand}`);
            setModels(data);
            setStep(2);
        } catch (error) {
            console.error('Error fetching models:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async (brand, model) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/templates?category=Mobile Cover&brand=${brand}&modelName=${model}`);
            setTemplates(data);
            setStep(3);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBrandSelect = (brand) => {
        setSelectedBrand(brand);
        fetchModels(brand);
    };

    const handleModelSelect = (model) => {
        setSelectedModel(model);
        fetchTemplates(selectedBrand, model);
    };

    const brandLogos = {
        'Apple': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
        'Samsung': 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
        'OnePlus': 'https://upload.wikimedia.org/wikipedia/commons/2/29/OnePlus_logo.svg',
        'Redmi': 'https://upload.wikimedia.org/wikipedia/commons/d/da/Xiaomi_logo.svg',
        'Mi': 'https://upload.wikimedia.org/wikipedia/commons/d/da/Xiaomi_logo.svg',
        'Poco': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Poco_Logo.svg',
        'Xiaomi': 'https://upload.wikimedia.org/wikipedia/commons/d/da/Xiaomi_logo.svg',
        'Google': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
        'Realme': 'https://upload.wikimedia.org/wikipedia/commons/d/df/Realme_logo.svg',
        'Oppo': 'https://upload.wikimedia.org/wikipedia/commons/1/13/OPPO_Logo.svg',
        'Vivo': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Vivo_Logo.svg',
        'Nothing': 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Nothing_Logo_2021.svg',
        'Motorola': 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Motorola_logo.svg',
        'iQOO': 'https://res.cloudinary.com/ashishga2003/image/upload/v1/logos/iqoo_logo.png', // Fallback or placeholder
        'Infinix': 'https://upload.wikimedia.org/wikipedia/commons/6/69/Infinix_Logo.svg',
        'Tecno': 'https://upload.wikimedia.org/wikipedia/commons/9/90/TECNO_Mobile_logo.svg',
        'Reno': 'https://upload.wikimedia.org/wikipedia/commons/1/13/OPPO_Logo.svg',
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Search Area */}
            <div className="bg-white border-b py-10 px-4 shadow-sm">
                <div className="container mx-auto max-w-4xl text-center">
                    <h1 className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-wider">
                        Search Your Smart Phone Model
                    </h1>
                    <div className="relative max-w-2xl mx-auto group">
                        <input
                            type="text"
                            placeholder="Search in Mobile Cases (e.g. iPhone 17)"
                            className="w-full bg-white border-2 border-blue-400 rounded-lg py-4 px-6 text-lg focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold placeholder:text-gray-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-500 p-2.5 rounded-md text-white shadow-lg">
                            <FaSearch size={22} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-6xl">
                {/* Step Indicators */}
                <div className="flex justify-center mb-16">
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        <span className={step >= 1 ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : ''}>1. Brand</span>
                        <FaChevronRight className="opacity-30" />
                        <span className={step >= 2 ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : ''}>2. Model</span>
                        <FaChevronRight className="opacity-30" />
                        <span className={step >= 3 ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : ''}>3. Style</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-l-4 border-blue-600 mb-4"></div>
                        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Models...</p>
                    </div>
                ) : (
                    <>
                        {/* STEP 1: SELECT BRAND */}
                        {step === 1 && (
                            <div className="space-y-12 animate-fadeIn">
                                <h2 className="text-center text-xl font-black text-gray-400 uppercase tracking-[0.3em] mb-12">Select Brand</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                    {brands.map((brand) => (
                                        <button
                                            key={brand}
                                            onClick={() => handleBrandSelect(brand)}
                                            className="bg-white p-8 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-400 hover:shadow-2xl transition-all flex flex-col items-center justify-center group active:scale-95 bg-gradient-to-b from-white to-gray-50"
                                        >
                                            <div className="h-12 w-full flex items-center justify-center mb-4">
                                                {brandLogos[brand] ? (
                                                    <img src={brandLogos[brand]} alt={brand} className="max-h-full max-w-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110" />
                                                ) : (
                                                    <FaMobileAlt size={32} className="text-gray-200 group-hover:text-blue-500 transition-all" />
                                                )}
                                            </div>
                                            <span className="font-black text-gray-400 group-hover:text-blue-600 uppercase text-[10px] tracking-widest mt-2">{brand}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: SELECT MODEL */}
                        {step === 2 && (
                            <div className="space-y-12 animate-fadeIn">
                                <div className="flex items-center justify-between mb-8 border-b pb-4">
                                    <button onClick={() => setStep(1)} className="text-gray-400 font-black hover:text-blue-600 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest">
                                        ‹ Back to Brands
                                    </button>
                                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-[0.2em]">{selectedBrand}</h2>
                                    <div className="w-20"></div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {models.filter(m => m.toLowerCase().includes(searchTerm.toLowerCase())).map((model) => (
                                        <button
                                            key={model}
                                            onClick={() => handleModelSelect(model)}
                                            className="bg-white py-5 px-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all font-black text-gray-500 uppercase text-[11px] tracking-widest text-center hover:text-blue-600 active:scale-95 transform"
                                        >
                                            {model}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 3: SELECT CASE TYPE / DESIGN */}
                        {step === 3 && (
                            <div className="space-y-12 animate-fadeIn">
                                <div className="flex items-center justify-between mb-8 border-b pb-6">
                                    <button onClick={() => setStep(2)} className="text-gray-400 font-black hover:text-blue-600 transition-all flex items-center gap-2 uppercase text-[10px] tracking-[0.2em]">
                                        ‹ Back to Models
                                    </button>
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-[0.1em]">{selectedModel}</h2>
                                    <div className="w-20"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {templates.map((template) => (
                                        <div key={template._id} className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-gray-100 group hover:shadow-2xl transition-all flex flex-col md:flex-row items-center p-6 gap-8">
                                            {/* Left side: Case Image */}
                                            <div className="w-full md:w-1/2 aspect-[4/5] bg-gray-50 rounded-[30px] p-4 flex items-center justify-center relative overflow-hidden">
                                                <img
                                                    src={template.previewImage}
                                                    alt={template.name}
                                                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out z-10"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `https://placehold.co/400x800/f8fafc/64748b?text=${template.caseType}+Case`;
                                                    }}
                                                />
                                                <div className="absolute top-4 left-4 z-20">
                                                    <span className="bg-blue-600/90 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg border border-white/20">
                                                        {template.caseType} Grip
                                                    </span>
                                                </div>
                                                {/* Ambient Glow */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>

                                            {/* Right side: Info and Action */}
                                            <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                                                <div>
                                                    <h3 className="text-lg font-black text-gray-800 uppercase leading-none tracking-tight mb-1">
                                                        {template.caseType} PHONE CASES
                                                    </h3>
                                                    <p className="text-blue-500 font-black text-lg">@ Just ₹{template.basePrice}/-</p>
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/customize/${template._id}`)}
                                                    className="bg-[#f0643b] text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#d9532d] transition-all shadow-lg shadow-orange-200 active:scale-95 flex items-center gap-3 group/btn"
                                                >
                                                    SELECT DESIGN
                                                    <span className="transform group-hover/btn:translate-x-1 transition-transform">›</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {templates.length === 0 && (
                                    <div className="text-center py-40 bg-white rounded-[50px] border-4 border-dashed border-gray-100">
                                        <div className="text-6xl mb-6 opacity-20">🔍</div>
                                        <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-sm">No designs discovered for this model yet.</p>
                                        <button onClick={() => setStep(2)} className="mt-8 text-blue-500 font-black uppercase text-[10px] tracking-widest border-b-2 border-blue-500 pb-1">Request a Design</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MobileCases;
