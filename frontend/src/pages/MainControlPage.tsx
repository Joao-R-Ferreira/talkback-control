import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../services/socket';
import clsx from 'clsx';

const MainControlPage: React.FC = () => {
    const { config, currentMusician, selectMusician, meters, talkbackStates, isConnected } = useApp();
    const navigate = useNavigate();

    // Derived state from context
    const currentTalkbackId = currentMusician?.talkbackId;
    const remoteState = currentTalkbackId ? talkbackStates[currentTalkbackId] : undefined;

    // We use local state for gain to ensure smooth dragging, but sync with remote
    const [localGain, setLocalGain] = useState<number | null>(null);

    // Sync local gain with remote when not dragging (or simplified: just sync always if difference is significant)
    // For MVP, let's just use remote state priority unless we are actively interacting?
    // actually, let's just use a useEffect to update local gain when remote changes
    React.useEffect(() => {
        if (remoteState?.gain !== undefined) {
            setLocalGain(remoteState.gain);
        }
    }, [remoteState?.gain]);

    // If localGain is null (init), default to 0.75
    const displayGain = localGain ?? 0.75;

    // Talk state is direct from remote
    const isTalking = remoteState?.isMuted || false; // isMuted name in context is confusing, let's assume isMuted=true means ACTIVE/TALKING based on backend logic

    const getMeterColor = (level: number) => {
        if (level > 0.9) return 'from-red-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
        if (level > 0.7) return 'from-yellow-400 to-yellow-500';
        return 'from-emerald-500 to-emerald-600';
    };

    const handleTalkDown = () => {
        if (currentMusician) {
            // Optimistic update not strictly needed if latency is low, but good validation
            socketService.sendMute(currentMusician.talkbackId, true);
        }
    };

    const handleTalkUp = () => {
        if (currentMusician) {
            socketService.sendMute(currentMusician.talkbackId, false);
        }
    };

    const handleGainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setLocalGain(val); // Update local immediately
        if (currentMusician) {
            socketService.sendGain(currentMusician.talkbackId, val);
        }
    };

    if (!config) return <div className="flex items-center justify-center h-screen text-zinc-500">Connecting...</div>;

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-zinc-50 overflow-hidden relative selection:bg-blue-500/30">
            {/* Background Gradient Mesh (Subtle) */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 pointer-events-none z-0" />

            {/* 1) Header (10% height) - Glassmorphism */}
            <header className="relative z-20 h-[10vh] flex items-center px-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
                <div className="flex-shrink-0 mr-0 h-[75%] flex items-center">
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
                </div>

                <div className="w-56 mx-4 flex-shrink-0">
                    <div className="relative group w-full">
                        <select
                            value={currentMusician?.id || ''}
                            onChange={(e) => selectMusician(e.target.value)}
                            className="w-full bg-zinc-900/50 text-zinc-100 p-3 pl-4 rounded-xl border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none appearance-none transition-all cursor-pointer font-medium"
                        >
                            <option value="" disabled>Select Musician</option>
                            {config.musicians.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                            ▼
                        </div>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-4">
                    <div className={clsx("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] transition-colors duration-500", isConnected ? "bg-emerald-500 text-emerald-500" : "bg-red-500 text-red-500")} />
                    <button
                        onClick={() => navigate('/settings')}
                        className="h-[80%] aspect-square flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full transition-all active:scale-95"
                    >
                        <span className="sr-only">Settings</span>
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* 2) Meter Row (10% height) - Minimalist */}
            <div className="relative z-10 h-[10vh] flex border-b border-zinc-800/50 bg-zinc-950">
                {config.talkbacks.map(tb => {
                    const level = meters[tb.id] || 0;
                    return (
                        <div key={tb.id} className="flex-1 flex flex-col justify-end relative last:border-0 border-r border-zinc-900 group">
                            {/* Background Track */}
                            <div className="absolute inset-0 bg-zinc-900/30" />
                            {/* Meter Bar */}
                            <div
                                className={clsx("absolute bottom-0 left-0 right-0 transition-all duration-150 ease-out bg-gradient-to-t opacity-90", getMeterColor(level))}
                                style={{ height: `${Math.max(level * 100, 2)}%` }} // Always show at least 2% hint
                            />
                            {/* Scanline Effect */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />

                            {/* Label */}
                            <div className="relative z-10 pb-2 px-1 text-center">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold group-hover:text-zinc-300 transition-colors">
                                    {tb.name}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 3) Main Control Area (80% height) */}
            <div className="relative z-10 flex-1 flex overflow-hidden">
                {/* Left: Vertical Gain Slider (20% width) */}
                <div className="w-[20%] border-r border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm flex items-center justify-center relative">
                    {/* Track Graphic */}
                    <div className="absolute h-3/4 w-2 bg-zinc-800 rounded-full" />

                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={displayGain}
                        onChange={handleGainChange}
                        disabled={!currentMusician}
                        className="absolute -rotate-90 w-[50vh] h-20 opacity-90 cursor-grab active:cursor-grabbing z-20"
                    />

                    <div className="absolute bottom-8 font-mono text-zinc-600 text-xs tracking-widest font-bold">GAIN</div>
                </div>

                {/* Right: Talk Button (80% width) */}
                <div className="w-[80%] p-6 md:p-12 flex items-center justify-center">
                    <button
                        onMouseDown={handleTalkDown}
                        onMouseUp={handleTalkUp}
                        onMouseLeave={handleTalkUp}
                        onTouchStart={handleTalkDown}
                        onTouchEnd={handleTalkUp}
                        disabled={!currentMusician}
                        className={clsx(
                            "w-full h-full rounded-[2rem] text-5xl md:text-7xl font-black tracking-widest transition-all duration-100 flex items-center justify-center relative overflow-hidden ring-1 ring-white/10 group select-none touch-manipulation",
                            !currentMusician ? "bg-zinc-900 text-zinc-700 cursor-not-allowed shadow-none" :
                                isTalking
                                    ? "bg-gradient-to-br from-red-600 to-red-700 text-white shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] scale-[0.99]"
                                    : "bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.1)] active:scale-[0.99]"
                        )}
                    >
                        {/* Shine Effect */}
                        {!isTalking && currentMusician && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] animate-[shimmer_3s_infinite_2s] pointer-events-none" />
                        )}
                        <span className={clsx("relative z-10 drop-shadow-sm", isTalking && "text-red-100")}>TALK</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MainControlPage;
