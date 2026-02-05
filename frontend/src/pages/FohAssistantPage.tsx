import React from 'react';
import { useApp } from '../context/AppContext';
import { HeaderItems } from '../context/HeaderContext';
import clsx from 'clsx';

const FohAssistantPage: React.FC = () => {
    const { fohCallQueue, dismissFohCall } = useApp();

    return (
        <div className="h-full overflow-y-auto pb-20">
            <HeaderItems>
                <h1 className="text-xl font-bold">FOH Assistant</h1>
            </HeaderItems>

            <div className="h-full flex items-center justify-center p-8 relative">
                {fohCallQueue.length === 0 && (
                    <div className="max-w-xl w-full bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 rounded-2xl p-10 text-center">
                        <h2 className="text-2xl font-black text-white mb-4">FOH Assistant</h2>
                        <p className="text-zinc-400">Waiting for calls</p>
                    </div>
                )}

                {fohCallQueue.length > 0 && (
                    <div className="fixed inset-0 flex items-center justify-center flex-wrap gap-8 p-8">
                        {fohCallQueue.map(call => (
                            <button
                                key={call.musicianId}
                                onClick={() => dismissFohCall(call.musicianId)}
                                className={clsx(
                                    "w-80 h-80 rounded-full flex flex-col items-center justify-center text-white font-black shadow-2xl transform-gpu transition-all duration-300 animate-pulse hover:scale-110",
                                    "bg-gradient-to-br from-red-600 to-red-700"
                                )}
                            >
                                <span className="text-6xl mb-4">📞</span>
                                <span className="text-center line-clamp-2">{call.musicianName}</span>
                                <span className="text-sm font-bold mt-2 opacity-80">{call.talkbackLabel}</span>
                                <span className="text-lg font-bold mt-4 opacity-80">CALLING</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FohAssistantPage;
