import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useHeader } from '../context/HeaderContext';

const Header: React.FC = () => {
    const { config } = useApp();
    const { headerItems, isHeaderVisible } = useHeader();

    if (!config || !isHeaderVisible) return null;

    return (
        <header className="relative z-20 h-[10vh] flex items-center px-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 w-full">
            {/* Shared Logo Section - Clickable to Dashboard */}
            <Link to="/" className="flex-shrink-0 mr-4 h-[75%] flex items-center hover:opacity-80 transition-opacity">
                {config.logoPath ? (
                    <img
                        src={`http://${window.location.hostname}:3001${config.logoPath}`}
                        alt="Logo"
                        className="h-full w-auto object-contain"
                    />
                ) : (
                    <div className="h-full aspect-square rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/20">
                        TB
                    </div>
                )}
            </Link>

            {/* Managed Page-Specific Items */}
            <div className="flex-grow flex items-center h-full">
                {headerItems}
            </div>
        </header>
    );
};

export default Header;
