import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import clsx from 'clsx';

const Dashboard: React.FC = () => {
    const { config } = useApp();
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-zinc-950 flex items-center justify-center relative">
            {/* Settings button - upper right */}
            <button
                onClick={() => navigate('/settings')}
                className="absolute top-6 right-6 h-10 aspect-square flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full transition-all active:scale-95 z-10"
            >
                <span className="sr-only">Settings</span>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
            <div className="w-full max-w-4xl mx-4 p-8 rounded-2xl bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/40 shadow-lg">
                <div className="flex flex-col items-center text-center gap-8">
                    <div className="flex flex-col items-center gap-4">
                        {config?.logoPath ? (
                            <img
                                src={`http://${window.location.hostname}:3001${config.logoPath}`}
                                alt="Logo"
                                className="w-32 h-32 object-contain"
                            />
                        ) : (
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center font-bold text-4xl shadow-lg shadow-blue-900/20">TB</div>
                        )}
                        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent uppercase">Audio Tools</h1>
                    </div>

                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link
                            to="/talkback"
                            className={clsx(
                                "h-48 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-2xl transform-gpu transition-all duration-200 hover:scale-[1.02]",
                                "bg-gradient-to-br from-emerald-600 to-emerald-700"
                            )}
                        >
                            <span className="text-3xl mr-3">🎤</span>
                            <span className="uppercase">Stage Talkback</span>
                        </Link>

                        <Link
                            to="/foh-assistant"
                            className={clsx(
                                "h-48 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-2xl transform-gpu transition-all duration-200 hover:scale-[1.02]",
                                "bg-gradient-to-br from-purple-600 to-purple-700"
                            )}
                        >
                            <span className="text-3xl mr-3">🎛️</span>
                            <span className="uppercase">FOH Assistant</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
