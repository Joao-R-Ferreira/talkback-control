import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppConfig, MeterUpdate, Musician } from '../types';
import { getConfig } from '../services/api';
import { socketService } from '../services/socket';

interface AppContextType {
    config: AppConfig | null;
    currentMusician: Musician | null;
    selectMusician: (musicianId: string) => void;
    meters: Record<string, number>;
    talkbackStates: Record<string, { gain: number; isMuted: boolean }>;
    isConnected: boolean;
    refreshConfig: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [currentMusician, setCurrentMusician] = useState<Musician | null>(null);
    const [meters, setMeters] = useState<Record<string, number>>({});
    const [talkbackStates, setTalkbackStates] = useState<Record<string, { gain: number; isMuted: boolean }>>({});
    const [isConnected, setIsConnected] = useState(false);

    const refreshConfig = async () => {
        try {
            const data = await getConfig();
            setConfig(data);
        } catch (error) {
            console.error('Failed to load config', error);
        }
    };

    useEffect(() => {
        refreshConfig();
        socketService.connect();

        const unsubscribe = socketService.subscribe((data) => {
            if (data.type === 'METERS') {
                const updates = data.payload as MeterUpdate[];
                setMeters(prev => {
                    const next = { ...prev };
                    updates.forEach(u => next[u.talkbackId] = u.level);
                    return next;
                });
                setIsConnected(true);
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

    return (
        <AppContext.Provider value={{ config, currentMusician, selectMusician, meters, talkbackStates, isConnected, refreshConfig }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
