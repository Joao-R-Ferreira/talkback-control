import { getConfig } from './config';
import { TalkbackConfig } from './types';
import logs from './logs';
import { createConnection } from 'net';

let oscPort: any = null;
let oscAvailable = false;
const meterLevels: { [talkbackId: string]: number } = {}; // Store current meter levels

// Try to dynamically load an OSC/UDP library if available.
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const osc = require('osc');
    // We'll create a UDPPort when needed in `init`.
    oscPort = { osc, portInstance: null };
    oscAvailable = true;
} catch (e) {
    // Not installed - we'll fall back to logging/mock behavior
    oscAvailable = false;
}

export const initWing = () => {
    const cfg = getConfig();
    if (cfg.mode === 'mock') {
        console.log('[WING] Running in MOCK mode; no OSC will be sent.');
        return;
    }

    if (!oscAvailable) {
        console.warn('[WING] OSC library not available. Install `osc` to enable real communication.');
        return;
    }

    const { osc } = oscPort;
    // create UDP port to talk to console
    try {
        oscPort.portInstance = new osc.UDPPort({
            localAddress: '0.0.0.0',
            localPort: 0,
            metadata: true,
            remoteAddress: cfg.wing.ip,
            remotePort: cfg.wing.port
        });

        oscPort.portInstance.open();
        oscPort.portInstance.on('ready', () => {
            console.log(`[WING] OSC UDPPort opened to ${cfg.wing.ip}:${cfg.wing.port}`);
        });

        // Listen for meter OSC messages from Wing console
        oscPort.portInstance.on('message', (oscMsg: any) => {
            try {
                const address = oscMsg.address;
                // Parse channel/aux meter addresses: /ch/{number}/meter or /aux/{number}/meter
                const chMatch = address.match(/^\/ch\/(\d+)\/meter$/);
                const auxMatch = address.match(/^\/aux\/(\d+)\/meter$/);

                if (chMatch || auxMatch) {
                    const channelNum = parseInt(chMatch ? chMatch[1] : auxMatch![1]);
                    const channelType = chMatch ? 'ch' : 'aux';
                    const meterValue = oscMsg.args?.[0]?.value ?? 0;

                    // Find the talkback config that matches this channel
                    const tb = cfg.talkbacks.find(
                        t => t.channelType === channelType && t.channelNumber === channelNum
                    );

                    if (tb) {
                        // Normalize meter value (typically 0-1 or dB value) to 0-1 range
                        // Assuming Wing sends values 0-1 or we'll clamp them
                        meterLevels[tb.id] = Math.max(0, Math.min(1, meterValue));
                    }
                }
            } catch (err) {
                console.error('[WING] Failed to process meter message', err);
            }
        });
    } catch (err) {
        console.error('[WING] Failed to open OSC UDP port', err);
    }
};

const sendOsc = (address: string, value: number | boolean) => {
    const cfg = getConfig();
    
    // Log the OSC command
    logs.addLogEntry(address, value, typeof value === 'boolean' ? 'int' : 'float');
    
    if (cfg.mode === 'mock') {
        console.log(`[WING][MOCK] ${address} -> ${value}`);
        return;
    }

    if (!oscAvailable || !oscPort.portInstance) {
        console.warn('[WING] OSC not available; cannot send message', address, value);
        return;
    }

    try {
        const args = typeof value === 'boolean' ? [{ type: 'i', value: value ? 1 : 0 }] : [{ type: 'f', value }];
        oscPort.portInstance.send({ address, args });
    } catch (err) {
        console.error('[WING] Failed to send OSC message', err);
    }
};

// OSC addresses based on Behringer Wing Remote Protocols documentation
export const setGain = (tb: TalkbackConfig, gain: number) => {
    // Normalize gain from 0.0 - 1.0 to Wing dB range: -144 to 10
    const dbValue = -144 + (gain * 154); // Maps 0=silence, 1=+10dB

    let address = '';
    if (tb.channelType === 'ch') {
        // Channel fader: /ch/{number}/fdr (range: -144 to 10 dB)
        address = `/ch/${String(tb.channelNumber).padStart(2, '0')}/fdr`;
    } else {
        // Aux fader: /aux/{number}/fdr (range: -144 to 10 dB)
        address = `/aux/${tb.channelNumber}/fdr`;
    }

    sendOsc(address, dbValue);
};

export const setMute = (tb: TalkbackConfig, active: boolean) => {
    // Map mute to integer: 1 = muted, 0 = unmuted
    const muteValue = active ? 1 : 0;

    let address = '';
    if (tb.channelType === 'ch') {
        // Channel mute: /ch/{number}/mute (0=off/unmuted, 1=on/muted)
        address = `/ch/${String(tb.channelNumber).padStart(2, '0')}/mute`;
    } else {
        // Aux mute: /aux/{number}/mute (0=off/unmuted, 1=on/muted)
        address = `/aux/${tb.channelNumber}/mute`;
    }

    sendOsc(address, muteValue);
};

export const sendFohCall = (musicianId: string, musicianName: string, tb: TalkbackConfig) => {
    // FOH call could be implemented as toggling a mute or setting a talkback send level.
    // Here we send a simple OSC message indicating a call event; mapping must be adapted.
    const address = `/talkback/call`;
    // send a placeholder compound value as float (not standard) - prefer per-arg metadata
    // We'll send musicianId numeric hash and a float 1.0 to indicate ON
    sendOsc(address, 1.0);
    console.log(`[WING] FOH call -> ${musicianName} (${musicianId}) on ${tb.name}`);
};

export const getMeterLevels = (): { [talkbackId: string]: number } => {
    return meterLevels;
};

export const testConnection = (): Promise<{ connected: boolean; message: string }> => {
    const cfg = getConfig();
    
    if (cfg.mode === 'mock') {
        return Promise.resolve({ connected: true, message: 'Demo mode - always connected' });
    }

    return new Promise<{ connected: boolean; message: string }>((resolve) => {
        const socket = createConnection({
            host: cfg.wing.ip,
            port: cfg.wing.port,
            timeout: 3000
        });

        socket.on('connect', () => {
            socket.destroy();
            resolve({ connected: true, message: 'Wing console found' });
        });

        socket.on('error', () => {
            socket.destroy();
            resolve({ connected: false, message: 'Console not found' });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ connected: false, message: 'Connection timeout' });
        });

        // Timeout fallback
        setTimeout(() => {
            socket.destroy();
            resolve({ connected: false, message: 'Connection timeout' });
        }, 4000);
    });
};

export default {
    initWing,
    setGain,
    setMute,
    sendFohCall,
    getMeterLevels,
    testConnection
};
