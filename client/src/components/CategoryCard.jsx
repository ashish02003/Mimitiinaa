import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ title, image, link, bgClass = "bg-gray-50", className = "" }) => {
    return (
        <Link
            to={link}
            className={`flex flex-col items-center group cursor-pointer ${className}`}
        >
            <div className={`w-full aspect-square md:aspect-[4/5] rounded-[1.8rem] overflow-hidden relative border border-black/5 shadow-sm group-hover:shadow-md transition-all duration-300 ${bgClass} flex items-center justify-center p-3 md:p-5`}>

                <div className="absolute inset-2 bg-white/40 rounded-[1.2rem] backdrop-blur-sm shadow-inner"></div>
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 relative z-10"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/400x500/f3f4f6/6366f1?text=${title.replace(' ', '+')}`;
                    }}
                />
            </div>

            <h3 className="mt-4 text-[12px] md:text-[13px] font-bold text-gray-800 tracking-wider group-hover:text-blue-600 transition-colors uppercase text-center font-heading">
                {title}
            </h3>
        </Link >
    );
};






export default CategoryCard;
