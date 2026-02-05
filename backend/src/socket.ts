import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { getConfig, updateConfig, updateTalkbackState } from './config';
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

    // Mock Meter Generation
    setInterval(() => {
        const config = getConfig();
        const updates: MeterUpdate[] = config.talkbacks.map(tb => ({
            talkbackId: tb.id,
            level: Math.random() // Random level 0-1
        }));

        broadcast(wss, { type: 'METERS', payload: updates });
    }, 100); // 100ms update rate
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

        broadcast(wss, { type: 'GAIN_UPDATE', payload: { talkbackId: msg.channelId, level: msg.value } });
    } else if (msg.type === 'SET_MUTE') {
        console.log(`[WING] Set Mute: ID=${msg.channelId}, Active=${msg.active}`);

        // Persist the mute change
        if (msg.channelId && msg.active !== undefined) {
            updateTalkbackState(msg.channelId, { isMuted: msg.active });
        }

        broadcast(wss, { type: 'MUTE_UPDATE', payload: { talkbackId: msg.channelId, active: msg.active } });
    } else if (msg.type === 'FOH_CALL') {
        console.log(`[FOH] Call from: ${msg.musicianName} (${msg.musicianId}) on ${msg.talkbackId}`);
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
