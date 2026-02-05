import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-zinc-50 overflow-hidden relative">
            <Header />
            <main className="flex-1 overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
