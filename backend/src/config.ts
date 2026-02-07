import { AppConfig, TalkbackConfig, Musician, TalkbackState } from './types';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(__dirname, '../config.json');

// Default initial configuration
const DEFAULT_CONFIG: AppConfig = {
    wing: {
        ip: '192.168.1.199',
        port: 2223 // Default OSC port
    },
    // Default mode: mock for safe local development
    mode: 'mock',
    talkbacks: [
        { id: 'tb1', name: 'Drums TB', channelType: 'ch', channelNumber: 1 },
        { id: 'tb2', name: 'Keys TB', channelType: 'ch', channelNumber: 2 },
        { id: 'tb3', name: 'Guitar TB', channelType: 'ch', channelNumber: 3 },
    ],
    musicians: [
        { id: 'm1', name: 'Drummer', talkbackId: 'tb1' },
        { id: 'm2', name: 'Keyboardist', talkbackId: 'tb2' },
        { id: 'm3', name: 'Guitarist', talkbackId: 'tb3' },
    ]
};

const loadConfig = (): AppConfig => {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Failed to load config, using default', e);
    }
    return DEFAULT_CONFIG;
};

// Initialize talkback states with defaults if missing
const initializeTalkbackStates = (config: AppConfig): AppConfig => {
    if (!config.talkbackStates) {
        config.talkbackStates = [];
    }

    // Ensure all talkbacks have a state entry
    config.talkbacks.forEach(tb => {
        const existingState = config.talkbackStates!.find(s => s.talkbackId === tb.id);
        if (!existingState) {
            config.talkbackStates!.push({
                talkbackId: tb.id,
                gain: 0.8,
                isMuted: false
            });
        }
    });

    return config;
};

let currentConfig: AppConfig = initializeTalkbackStates(loadConfig());

export const getConfig = (): AppConfig => {
    return currentConfig;
};

export const updateConfig = (newConfig: Partial<AppConfig>): AppConfig => {
    currentConfig = { ...currentConfig, ...newConfig };
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(currentConfig, null, 2));
    } catch (e) {
        console.error('Failed to save config', e);
    }
    return currentConfig;
};

export const getTalkbackState = (talkbackId: string): TalkbackState | undefined => {
    return currentConfig.talkbackStates?.find(s => s.talkbackId === talkbackId);
};

export const updateTalkbackState = (talkbackId: string, updates: Partial<Omit<TalkbackState, 'talkbackId'>>): void => {
    if (!currentConfig.talkbackStates) {
        currentConfig.talkbackStates = [];
    }

    const stateIndex = currentConfig.talkbackStates.findIndex(s => s.talkbackId === talkbackId);

    if (stateIndex >= 0) {
        currentConfig.talkbackStates[stateIndex] = {
            ...currentConfig.talkbackStates[stateIndex],
            ...updates
        };
    } else {
        // Create new state if it doesn't exist
        currentConfig.talkbackStates.push({
            talkbackId,
            gain: updates.gain ?? 0.8,
            isMuted: updates.isMuted ?? false
        });
    }

    // Persist to file asynchronously to avoid blocking the event loop
    fs.writeFile(CONFIG_PATH, JSON.stringify(currentConfig, null, 2), (err) => {
        if (err) {
            console.error('Failed to save talkback state', err);
        }
    });
};
