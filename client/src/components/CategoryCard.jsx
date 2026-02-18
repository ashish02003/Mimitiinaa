import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ title, image, link, className = "" }) => {
    return (
        <Link
            to={link}
            className={`flex flex-col items-center group cursor-pointer transition-transform hover:-translate-y-1 ${className}`}
        >
            <div className="w-full aspect-[4/5] bg-gray-100 rounded-[2rem] overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/400x500/f3f4f6/6366f1?text=${title.replace(' ', '+')}`;
                    }}
                />
            </div>
            <h3 className="mt-4 text-[15px] font-bold text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors">
                {title}
            </h3>
        </Link>
    );
};

export default CategoryCard;
