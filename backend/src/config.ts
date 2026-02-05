import { AppConfig, TalkbackConfig, Musician } from './types';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(__dirname, '../config.json');

// Default initial configuration
const DEFAULT_CONFIG: AppConfig = {
    wing: {
        ip: '192.168.1.199',
        port: 2223 // Default OSC port
    },
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

let currentConfig: AppConfig = loadConfig();

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
