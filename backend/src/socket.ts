import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { getConfig, updateConfig, updateTalkbackState } from './config';
import wing from './wing';
import { MeterUpdate } from './types';

interface ClientMessage {
    type: 'SET_GAIN' | 'SET_MUTE' | 'FOH_CALL' | 'FOH_DISMISS';
    channelId?: string; // talkbackId
    value?: number; // 0-1 for gain
    active?: boolean; // for mute/unmute
    musicianId?: string; // for FOH_CALL
    musicianName?: string; // for FOH_CALL
    talkbackId?: string; // for FOH_CALL
    talkbackLabel?: string; // for FOH_CALL
}

export const setupWebSockets = (server: Server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket) => {
        console.log('Client connected');

        // Send current connection status immediately
        ws.send(JSON.stringify({
            type: 'CONNECTION_STATUS',
            payload: { connected: wing.isWingConnected() }
        }));

        // Initialize/ensure wing module is ready according to config mode
        try {
            wing.initWing();
        } catch (err) {
            console.warn('Wing init failed', err);
        }

        // Send initial talkback states to the newly connected client
        const config = getConfig();
        if (config.talkbackStates && config.talkbackStates.length > 0) {
            ws.send(JSON.stringify({
                type: 'INITIAL_STATE',
                payload: config.talkbackStates
            }));
        }

        ws.on('message', (message: string) => {
            try {
                const data: ClientMessage = JSON.parse(message);
                handleClientMessage(data, wss);
            } catch (e) {
                console.error('Failed to parse message', e);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    // Mock Meter Generation (or Real Meter Reading)
    setInterval(() => {
        const config = getConfig();
        let updates: MeterUpdate[];

        if (config.mode === 'production') {
            // In production mode, read actual meter levels from Wing console via OSC
            const meterLevels = wing.getMeterLevels();
            updates = config.talkbacks.map(tb => ({
                talkbackId: tb.id,
                level: meterLevels[tb.id] ?? 0 // Use actual level or 0 if not received yet
            }));
        } else {
            // In mock mode, generate random levels for testing
            updates = config.talkbacks.map(tb => ({
                talkbackId: tb.id,
                level: Math.random() // Random level 0-1
            }));
        }

        broadcast(wss, { type: 'METERS', payload: updates });
    }, 100); // 100ms update rate

    // Connection Status Heartbeat (Slower)
    setInterval(() => {
        broadcast(wss, {
            type: 'CONNECTION_STATUS',
            payload: { connected: wing.isWingConnected() }
        });
    }, 2000); // Check every 2 seconds
};

const handleClientMessage = (msg: ClientMessage, wss: WebSocketServer) => {
    // Here we would communicate with the WING console via OSC
    // For now, we just log the action and broadcast to other clients
    if (msg.type === 'SET_GAIN') {
        console.log(`[WING] Set Gain: ID=${msg.channelId}, Value=${msg.value}`);

        // Persist the gain change
        if (msg.channelId && msg.value !== undefined) {
            updateTalkbackState(msg.channelId, { gain: msg.value });
        }

        // Find talkback config to map to Wing channels
        const cfg = getConfig();
        const tb = cfg.talkbacks.find(t => t.id === msg.channelId);
        if (tb) {
            try {
                wing.setGain(tb, msg.value ?? 0);
            } catch (err) {
                console.error('Failed to set gain on wing', err);
            }
        }

        broadcast(wss, { type: 'GAIN_UPDATE', payload: { talkbackId: msg.channelId, level: msg.value } });
    } else if (msg.type === 'SET_MUTE') {
        console.log(`[WING] Set Mute: ID=${msg.channelId}, Active=${msg.active}`);

        // Persist the mute change
        if (msg.channelId && msg.active !== undefined) {
            updateTalkbackState(msg.channelId, { isMuted: msg.active });
        }

        // Try to apply to Wing
        const cfg2 = getConfig();
        const tb2 = cfg2.talkbacks.find(t => t.id === msg.channelId);
        if (tb2) {
            try {
                wing.setMute(tb2, !!msg.active);
            } catch (err) {
                console.error('Failed to set mute on wing', err);
            }
        }

        broadcast(wss, { type: 'MUTE_UPDATE', payload: { talkbackId: msg.channelId, active: msg.active } });
    } else if (msg.type === 'FOH_CALL') {
        console.log(`[FOH] Call from: ${msg.musicianName} (${msg.musicianId}) on ${msg.talkbackId}`);
        // Try to notify Wing about FOH call
        const cfg3 = getConfig();
        const tb3 = cfg3.talkbacks.find(t => t.id === msg.talkbackId);
        if (tb3) {
            try {
                wing.sendFohCall(msg.musicianId ?? '', msg.musicianName ?? '', tb3);
            } catch (err) {
                console.error('Failed to send FOH call to wing', err);
            }
        }

        broadcast(wss, { type: 'FOH_CALL', musicianId: msg.musicianId, musicianName: msg.musicianName, talkbackId: msg.talkbackId, talkbackLabel: msg.talkbackLabel });
    } else if (msg.type === 'FOH_DISMISS') {
        console.log(`[FOH] Call dismissed: ${msg.musicianId}`);
        broadcast(wss, { type: 'FOH_DISMISS', musicianId: msg.musicianId });
    }
};

const broadcast = (wss: WebSocketServer, data: any) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};
