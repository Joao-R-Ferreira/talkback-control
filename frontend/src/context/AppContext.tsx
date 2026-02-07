import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppConfig, MeterUpdate, Musician } from '../types';
import { getConfig, testWingConnection } from '../services/api';
import { socketService } from '../services/socket';

interface AppContextType {
    config: AppConfig | null;
    currentMusician: Musician | null;
    selectMusician: (musicianId: string) => void;
    meters: Record<string, number>;
    talkbackStates: Record<string, { gain: number; isMuted: boolean }>;
    isConnected: boolean;
    wingStatus: 'unknown' | 'connected' | 'disconnected';
    testConnection: () => Promise<void>;
    refreshConfig: () => Promise<void>;
    fohCallQueue: Array<{ musicianId: string; musicianName: string; talkbackId: string; talkbackLabel: string }>;
    triggerFohCall: (musician: Musician) => void;
    dismissFohCall: (musicianId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [currentMusician, setCurrentMusician] = useState<Musician | null>(null);
    const [meters, setMeters] = useState<Record<string, number>>({});
    const [talkbackStates, setTalkbackStates] = useState<Record<string, { gain: number; isMuted: boolean }>>({});
    const [isConnected, setIsConnected] = useState(false);
    const [wingStatus, setWingStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
    const [fohCallQueue, setFohCallQueue] = useState<Array<{ musicianId: string; musicianName: string; talkbackId: string; talkbackLabel: string }>>([]);

    const refreshConfig = async () => {
        try {
            const data = await getConfig();
            const prevMode = config?.mode;
            setConfig(data);

            // Reset wing status when switching modes
            if (prevMode && data.mode !== prevMode) {
                setWingStatus('unknown');
            }
        } catch (error) {
            console.error('Failed to load config', error);
        }
    };

    const testConnection = async () => {
        try {
            const result = await testWingConnection();
            setWingStatus(result.connected ? 'connected' : 'disconnected');
        } catch (error) {
            console.error('Failed to test wing connection', error);
            setWingStatus('disconnected');
        }
    };

    useEffect(() => {
        refreshConfig();
        socketService.connect();

        const unsubscribe = socketService.subscribe((data) => {
            if (data.type === 'INITIAL_STATE') {
                // Initialize talkback states from backend
                const states = data.payload as Array<{ talkbackId: string; gain: number; isMuted: boolean }>;
                const statesMap: Record<string, { gain: number; isMuted: boolean }> = {};
                states.forEach(s => {
                    statesMap[s.talkbackId] = { gain: s.gain, isMuted: s.isMuted };
                });
                setTalkbackStates(statesMap);
            } else if (data.type === 'METERS') {
                const updates = data.payload as MeterUpdate[];
                setMeters(prev => {
                    const next = { ...prev };
                    updates.forEach(u => next[u.talkbackId] = u.level);
                    return next;
                });
                setIsConnected(true);
            } else if (data.type === 'CONNECTION_STATUS') {
                const { connected } = data.payload;
                setWingStatus(connected ? 'connected' : 'disconnected');
                setIsConnected(connected);
            } else if (data.type === 'GAIN_UPDATE') {
                const { talkbackId, level } = data.payload;
                setTalkbackStates(prev => ({
                    ...prev,
                    [talkbackId]: { ...prev[talkbackId], gain: level }
                }));
            } else if (data.type === 'MUTE_UPDATE') {
                const { talkbackId, active } = data.payload;
                setTalkbackStates(prev => ({
                    ...prev,
                    [talkbackId]: { ...prev[talkbackId], isMuted: active }
                }));
            } else if (data.type === 'FOH_CALL') {
                // Broadcast received: add to call queue
                setFohCallQueue(prev => {
                    if (prev.find(call => call.musicianId === data.musicianId)) {
                        return prev; // Already in queue
                    }
                    return [...prev, {
                        musicianId: data.musicianId,
                        musicianName: data.musicianName,
                        talkbackId: data.talkbackId,
                        talkbackLabel: data.talkbackLabel || ''
                    }];
                });
            } else if (data.type === 'FOH_DISMISS') {
                // Call dismissed: remove from queue
                setFohCallQueue(prev => prev.filter(call => call.musicianId !== data.musicianId));
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Load saved musician from local storage
    useEffect(() => {
        if (config && !currentMusician) {
            const savedId = localStorage.getItem('selectedMusicianId');
            if (savedId) {
                const found = config.musicians.find(m => m.id === savedId);
                if (found) setCurrentMusician(found);
            }
        }
    }, [config]);

    const selectMusician = (musicianId: string) => {
        const found = config?.musicians.find(m => m.id === musicianId);
        if (found) {
            setCurrentMusician(found);
            localStorage.setItem('selectedMusicianId', musicianId);
        }
    };

    const triggerFohCall = (musician: Musician) => {
        setFohCallQueue(prev => {
            // Check if this musician already has a call
            const hasCall = prev.some(call => call.musicianId === musician.id);

            if (hasCall) {
                // Remove their call
                socketService.sendDismissFohCall(musician.id);
                return prev.filter(call => call.musicianId !== musician.id);
            } else {
                // Add their call
                const talkbackLabel = config?.talkbacks.find(tb => tb.id === musician.talkbackId)?.name || '';
                socketService.sendFohCall(musician.id, musician.name, musician.talkbackId, talkbackLabel);
                return [...prev, {
                    musicianId: musician.id,
                    musicianName: musician.name,
                    talkbackId: musician.talkbackId,
                    talkbackLabel
                }];
            }
        });
    };

    const dismissFohCall = (musicianId: string) => {
        setFohCallQueue(prev => prev.filter(call => call.musicianId !== musicianId));
        socketService.sendDismissFohCall(musicianId);
    };

    return (
        <AppContext.Provider value={{
            config,
            currentMusician,
            selectMusician,
            meters,
            talkbackStates,
            isConnected,
            wingStatus,
            testConnection,
            refreshConfig,
            fohCallQueue,
            triggerFohCall,
            dismissFohCall
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
