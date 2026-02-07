import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { login, updateConfig, uploadImage, getImages, deleteImage, startLogging, stopLogging, getLogStatus } from '../services/api';
import type { AppConfig } from '../types';
import type { LogStats } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { HeaderItems } from '../context/HeaderContext';
import clsx from 'clsx';

const SettingsPage: React.FC = () => {
    const { config, refreshConfig, wingStatus, testConnection } = useApp();
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [availableImages, setAvailableImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [logStats, setLogStats] = useState<LogStats | null>(null);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [mode, setMode] = useState<'mock' | 'production'>(config?.mode || 'production');
    const [isTestingWing, setIsTestingWing] = useState(false);

    // Fetch images when authenticated
    React.useEffect(() => {
        if (isAuthenticated && token) {
            getImages(token).then(setAvailableImages).catch(console.error);
        }
    }, [isAuthenticated, token]);

    // Fetch log status when authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            const fetchLogStatus = async () => {
                try {
                    const stats = await getLogStatus();
                    setLogStats(stats);
                } catch (error) {
                    console.error('Failed to fetch log status', error);
                }
            };
            fetchLogStatus();
            const interval = setInterval(fetchLogStatus, 1000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    // Update mode when config changes
    React.useEffect(() => {
        if (config?.mode) {
            setMode(config.mode as 'mock' | 'production');
        }
    }, [config?.mode]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await login(username, password);
            setToken(res.token);
            setIsAuthenticated(true);
            setError('');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    const handleSave = async (newConfig: Partial<AppConfig>) => {
        try {
            await updateConfig(newConfig, token);
            await refreshConfig();
        } catch (err) {
            alert('Failed to save settings');
        }
    };

    const handleToggleLogging = async () => {
        setIsLoadingLogs(true);
        try {
            if (logStats?.isLogging) {
                await stopLogging();
            } else {
                await startLogging();
            }
            const stats = await getLogStatus();
            setLogStats(stats);
        } catch (error) {
            console.error('Failed to toggle logging', error);
            alert('Failed to toggle logging');
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleViewLogs = () => {
        navigate('/logs');
    };

    const handleTestWingConnection = async () => {
        setIsTestingWing(true);
        try {
            await testConnection();
        } finally {
            setIsTestingWing(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            try {
                const res = await uploadImage(e.target.files[0], token);
                // Refresh list
                const imgs = await getImages(token);
                setAvailableImages(imgs);
                // Auto-select new image
                handleSave({ logoPath: res.url });
            } catch (err) {
                alert('Upload failed');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const usernameInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!isAuthenticated) {
            usernameInputRef.current?.focus();
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white p-4">
                <HeaderItems hidden={true}>
                    {null}
                </HeaderItems>
                <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
                    <h1 className="text-2xl font-bold mb-6 text-center tracking-tight uppercase">Admin Access</h1>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 ml-1">Username</label>
                            <input
                                ref={usernameInputRef}
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin(e)}
                                className="w-full bg-zinc-950 text-white p-3 rounded-lg border border-zinc-800 focus:border-blue-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin(e)}
                                className="w-full bg-zinc-950 text-white p-3 rounded-lg border border-zinc-800 focus:border-blue-500 outline-none transition-colors"
                            />
                        </div>
                        <button type="submit" className="mt-2 w-full p-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all active:scale-[0.98] uppercase tracking-widest text-sm">
                            Continue
                        </button>
                        {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
                    </form>
                    <div className="mt-8 text-center">
                        <button onClick={() => navigate('/')} className="text-zinc-500 text-sm hover:text-white transition-colors uppercase tracking-widest font-bold">← Back to Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!config) return <div className="p-8 text-zinc-500">Loading config...</div>;

    return (
        <div className="h-full overflow-y-auto pb-20">
            <HeaderItems>
                <h1 className="text-xl font-bold">Settings</h1>
                <button
                    onClick={() => navigate('/')}
                    className="text-sm font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-lg transition-colors border border-zinc-800 ml-auto"
                >
                    Done
                </button>
            </HeaderItems>


            <div className="max-w-3xl mx-auto p-6 space-y-8">
                {/* Appearance */}
                <section>
                    <h2 className="text-sm font-bold text-pink-500 uppercase tracking-wider mb-4 px-1">Appearance</h2>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">Logo</label>
                            <div className="flex gap-4 items-end">
                                {/* Logo Preview / Selection */}
                                <div className="flex-grow space-y-2">
                                    <div className="flex gap-2">
                                        <select
                                            value={config.logoPath || ''}
                                            onChange={(e) => handleSave({ logoPath: e.target.value })}
                                            className="w-full bg-zinc-950 p-3 rounded-lg border border-zinc-800 focus:border-pink-500 outline-none text-sm"
                                        >
                                            <option value="">Default (TB)</option>
                                            {availableImages.map(img => (
                                                <option key={img} value={img}>{img.split('/').pop()}</option>
                                            ))}
                                        </select>

                                        {config.logoPath && config.logoPath.startsWith('/uploads/') && (
                                            <button
                                                onClick={async () => {
                                                    if (!config.logoPath) return;
                                                    const filename = config.logoPath.split('/').pop();
                                                    if (!filename) return;

                                                    if (confirm('Are you sure you want to delete this logo?')) {
                                                        try {
                                                            await deleteImage(filename, token);
                                                            // Refresh list
                                                            const imgs = await getImages(token);
                                                            setAvailableImages(imgs);
                                                            // Reset to default if current was deleted
                                                            handleSave({ logoPath: '' });
                                                        } catch (err) {
                                                            alert('Failed to delete image');
                                                        }
                                                    }
                                                }}
                                                className="p-3 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-lg border border-red-900/50 transition-colors"
                                                title="Delete selected logo"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* Upload Area */}
                                    {isUploading ? (
                                        <div className="text-xs text-pink-500 animate-pulse">Uploading...</div>
                                    ) : (
                                        <label className="block w-full border border-dashed border-zinc-700 hover:border-pink-500 rounded-lg p-2 text-center cursor-pointer transition-colors group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleUpload}
                                            />
                                            <span className="text-zinc-500 text-xs group-hover:text-pink-500">
                                                + Upload New Logo
                                            </span>
                                        </label>
                                    )}
                                </div>

                                {/* Preview Box */}
                                <div className="w-24 h-24 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {config.logoPath ? (
                                        <img
                                            src={`http://${window.location.hostname}:3001${config.logoPath}`}
                                            alt="Logo"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/20 text-white">
                                            TB
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Network */}
                <section>
                    <h2 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-4 px-1">Network</h2>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">WING IP Address</label>
                            <input
                                type="text"
                                defaultValue={config.wing.ip}
                                onBlur={(e) => handleSave({ wing: { ...config.wing, ip: e.target.value } })}
                                className="w-full bg-zinc-950 p-3 rounded-lg border border-zinc-800 focus:border-blue-500 outline-none text-sm transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">OSC Port</label>
                            <input
                                type="number"
                                defaultValue={config.wing.port}
                                onBlur={(e) => handleSave({ wing: { ...config.wing, port: parseInt(e.target.value) } })}
                                className="w-full bg-zinc-950 p-3 rounded-lg border border-zinc-800 focus:border-blue-500 outline-none text-sm transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">Mode</label>
                            <button
                                onClick={() => {
                                    const newMode = mode === 'mock' ? 'production' : 'mock';
                                    setMode(newMode);
                                    handleSave({ mode: newMode });
                                }}
                                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${mode === 'production'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                                    }`}
                            >
                                {mode === 'production' ? '🟢 PRODUCTION MODE (Active)' : '🟡 DEMO MODE'}
                            </button>
                            <p className="text-xs text-zinc-500 mt-2">
                                {mode === 'production' ? 'Production mode: Connected to Wing console' : 'Demo mode: Mock data for testing'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">Wing Console Connection</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleTestWingConnection}
                                    disabled={isTestingWing || mode === 'mock'}
                                    className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${mode === 'mock'
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                                        }`}
                                >
                                    {isTestingWing ? 'Testing...' : 'Check Connection'}
                                </button>
                                <div className={clsx(
                                    "w-3 h-3 rounded-full shadow-[0_0_12px_currentColor] transition-colors flex-shrink-0",
                                    mode === 'mock' ? 'bg-gray-500 text-gray-500' :
                                        wingStatus === 'connected' ? 'bg-emerald-500 text-emerald-500' :
                                            wingStatus === 'disconnected' ? 'bg-red-500 text-red-500 animate-pulse' :
                                                'bg-gray-400 text-gray-400'
                                )} />
                            </div>
                            <p className="text-xs text-zinc-500 mt-2">
                                {mode === 'mock' ? 'Demo mode - connection check disabled' :
                                    wingStatus === 'connected' ? '🟢 Connected to Wing console' :
                                        wingStatus === 'disconnected' ? '🔴 Console not found' :
                                            '⚫ Status unknown - click "Check Connection"'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Logging */}
                <section>
                    <h2 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-4 px-1">Logging</h2>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2">OSC Command Log</label>
                                <p className="text-xs text-zinc-500">Record all OSC commands sent to the Wing console for debugging and monitoring.</p>
                            </div>
                            <button
                                onClick={handleToggleLogging}
                                disabled={isLoadingLogs}
                                className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${logStats?.isLogging
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isLoadingLogs ? 'Loading...' : logStats?.isLogging ? 'Stop Logging' : 'Start Logging'}
                            </button>
                        </div>

                        {logStats && (
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-700">
                                <div>
                                    <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Status</div>
                                    <div className={`text-sm font-bold ${logStats.isLogging ? 'text-red-500' : 'text-zinc-500'}`}>
                                        {logStats.isLogging ? '🔴 Recording' : '⚫ Stopped'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Logged Entries</div>
                                    <div className="text-sm font-bold text-blue-500">{logStats.count}</div>
                                </div>
                            </div>
                        )}

                        {logStats && logStats.count > 0 && (
                            <button
                                onClick={handleViewLogs}
                                className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                View Logs
                            </button>
                        )}
                    </div>
                </section>

                {/* Talkbacks */}
                <section>
                    <div className="flex justify-between items-end mb-4 px-1">
                        <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-wider">Talkbacks</h2>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
                        {config.talkbacks.map((tb, idx) => (
                            <div key={tb.id} className="p-4 flex gap-4 items-end group">
                                <div className="flex-grow">
                                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Label</label>
                                    <input
                                        type="text"
                                        defaultValue={tb.name}
                                        className="w-full bg-transparent border-none p-0 text-white font-medium focus:ring-0 placeholder-zinc-700"
                                        placeholder="Name"
                                        onBlur={(e) => {
                                            const newTbs = [...config.talkbacks];
                                            newTbs[idx].name = e.target.value;
                                            handleSave({ talkbacks: newTbs });
                                        }}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Type</label>
                                    <select
                                        defaultValue={tb.channelType}
                                        className="w-full bg-zinc-950 p-2 rounded border border-zinc-800 text-sm focus:border-emerald-500 outline-none"
                                        onChange={(e) => {
                                            const newTbs = [...config.talkbacks];
                                            newTbs[idx].channelType = e.target.value as 'ch' | 'aux';
                                            handleSave({ talkbacks: newTbs });
                                        }}
                                    >
                                        <option value="ch">CH</option>
                                        <option value="aux">AUX</option>
                                    </select>
                                </div>
                                <div className="w-20">
                                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">#</label>
                                    <input
                                        type="number"
                                        defaultValue={tb.channelNumber}
                                        className="w-full bg-zinc-950 p-2 rounded border border-zinc-800 text-sm focus:border-emerald-500 outline-none"
                                        onBlur={(e) => {
                                            const newTbs = [...config.talkbacks];
                                            newTbs[idx].channelNumber = parseInt(e.target.value);
                                            handleSave({ talkbacks: newTbs });
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (config.talkbacks.length <= 1) {
                                            alert("You must have at least one talkback channel.");
                                            return;
                                        }
                                        if (confirm(`Are you sure you want to delete "${tb.name}"? This will affect musicians assigned to it.`)) {
                                            const newTbs = config.talkbacks.filter(t => t.id !== tb.id);
                                            // Handle musicians assigned to this talkback
                                            const nextTbId = newTbs[0]?.id || '';
                                            const newMusicians = config.musicians.map(m =>
                                                m.talkbackId === tb.id ? { ...m, talkbackId: nextTbId } : m
                                            );
                                            handleSave({ talkbacks: newTbs, musicians: newMusicians });
                                        }
                                    }}
                                    className="p-2 text-zinc-500 hover:text-red-500 transition-colors mb-0.5"
                                    title="Delete Talkback"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            const newId = `tb${Date.now()}`;
                            handleSave({ talkbacks: [...config.talkbacks, { id: newId, name: 'New Talkback', channelType: 'ch', channelNumber: 1 }] });
                        }}
                        className="mt-3 w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-500 text-sm hover:text-white hover:border-zinc-500 transition-all font-medium"
                    >
                        + Add Talkback Channel
                    </button>
                </section>

                {/* Musicians */}
                <section>
                    <h2 className="text-sm font-bold text-violet-500 uppercase tracking-wider mb-4 px-1">Musicians</h2>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
                        {config.musicians.map((m, idx) => (
                            <div key={m.id} className="p-4 flex gap-4 items-end group">
                                <div className="flex-grow">
                                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Musician Name</label>
                                    <input
                                        type="text"
                                        defaultValue={m.name}
                                        className="w-full bg-transparent border-none p-0 text-white font-medium focus:ring-0 placeholder-zinc-700"
                                        placeholder="Name"
                                        onBlur={(e) => {
                                            const newMusicians = [...config.musicians];
                                            newMusicians[idx].name = e.target.value;
                                            handleSave({ musicians: newMusicians });
                                        }}
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Assign Talkback</label>
                                    <select
                                        defaultValue={m.talkbackId}
                                        className="w-full bg-zinc-950 p-2 rounded border border-zinc-800 text-sm focus:border-violet-500 outline-none"
                                        onChange={(e) => {
                                            const newMusicians = [...config.musicians];
                                            newMusicians[idx].talkbackId = e.target.value;
                                            handleSave({ musicians: newMusicians });
                                        }}
                                    >
                                        {config.talkbacks.map(tb => (
                                            <option key={tb.id} value={tb.id}>{tb.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm(`Are you sure you want to delete "${m.name}"?`)) {
                                            const newMusicians = config.musicians.filter(rm => rm.id !== m.id);
                                            handleSave({ musicians: newMusicians });
                                        }
                                    }}
                                    className="p-2 text-zinc-500 hover:text-red-500 transition-colors mb-0.5"
                                    title="Delete Musician"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            const newId = `m${Date.now()}`;
                            handleSave({ musicians: [...config.musicians, { id: newId, name: 'New Musician', talkbackId: config.talkbacks[0]?.id || '' }] });
                        }}
                        className="mt-3 w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-500 text-sm hover:text-white hover:border-zinc-500 transition-all font-medium"
                    >
                        + Add Musician Role
                    </button>
                </section>
            </div>
        </div>
    );
};

export default SettingsPage;
