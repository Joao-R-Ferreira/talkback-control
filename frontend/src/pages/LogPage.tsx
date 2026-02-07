import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeaderItems } from '../context/HeaderContext';
import { getLogs, getLogStatus, clearLogs } from '../services/api';
import type { LogEntry, LogStats } from '../services/api';

const LogPage: React.FC = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<LogStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch logs and stats
    const fetchLogs = async () => {
        try {
            const [logsData, statsData] = await Promise.all([getLogs(), getLogStatus()]);
            setLogs(logsData.entries);
            setStats(statsData);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch logs', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        
        // Auto-refresh every 500ms if logging is active
        const interval = setInterval(fetchLogs, 500);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

    const handleClearLogs = async () => {
        if (confirm('Are you sure you want to clear all logs?')) {
            try {
                await clearLogs();
                setLogs([]);
                setStats(null);
            } catch (error) {
                console.error('Failed to clear logs', error);
            }
        }
    };

    const formatTime = (isoString: string): string => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    };

    return (
        <div className="h-full overflow-hidden flex flex-col relative selection:bg-blue-500/30">
            <HeaderItems>
                <h1 className="text-xl font-bold">Log</h1>
                <div className="ml-auto flex items-center gap-3">
                    <button
                        onClick={handleClearLogs}
                        disabled={logs.length === 0}
                        className="text-sm font-medium text-red-500 hover:text-red-400 disabled:text-zinc-600 disabled:cursor-not-allowed bg-red-900/20 hover:bg-red-900/40 disabled:bg-zinc-900/20 px-4 py-2 rounded-lg transition-colors border border-red-900/50 disabled:border-zinc-800"
                    >
                        Clear Logs
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className="text-sm font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-lg transition-colors border border-zinc-800 ml-auto"
                    >
                        Back to Settings
                    </button>
                </div>
            </HeaderItems>

            {/* Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 pointer-events-none z-0" />

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
                {/* Stats Bar */}
                {stats && (
                    <div className="bg-zinc-900/50 border-b border-zinc-800 px-6 py-3 flex gap-6 items-center">
                        <div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Status</div>
                            <div className={`text-sm font-bold ${stats.isLogging ? 'text-red-500' : 'text-zinc-500'}`}>
                                {stats.isLogging ? '🔴 Recording' : '⚫ Stopped'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Entries</div>
                            <div className="text-sm font-bold text-blue-500">{stats.count}</div>
                        </div>
                        {stats.startTime && (
                            <div>
                                <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Started</div>
                                <div className="text-sm font-mono text-zinc-400">{formatTime(stats.startTime)}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Logs Container */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-6 text-center text-zinc-500">Loading logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 italic">
                            {stats?.isLogging ? 'No logs yet. Send OSC commands to see them here.' : 'No logs recorded. Turn on logging in Settings.'}
                        </div>
                    ) : (
                        <div className="p-6 space-y-2">
                            {logs.map((log, idx) => (
                                <div
                                    key={idx}
                                    className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900/70 hover:border-zinc-700 transition-colors font-mono text-xs"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-shrink-0">
                                            <span className="text-zinc-600">{formatTime(log.timestamp)}</span>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-emerald-400">{log.address}</span>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <span className="text-blue-400">
                                                {typeof log.value === 'boolean' ? (log.value ? '1' : '0') : log.value}
                                            </span>
                                            <span className="text-zinc-600 ml-2">
                                                ({log.valueType})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogPage;
