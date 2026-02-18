import React from "react";
import mylogo from "./Mimitiinaa_Logo.svg";

const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img
        src={mylogo}
        alt="PrintShoppy Logo"
        className="h-10 md:h-12 w-auto object-contain transition-all"
      />
      <span className="text-2xl font-black bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent hidden sm:block tracking-tight">
        Mimitiinaa
      </span>
    </div>
  );
};

export default Logo;
