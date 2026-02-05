import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { getConfig, updateConfig } from './config';
import { MeterUpdate } from './types';

interface ClientMessage {
    type: 'SET_GAIN' | 'SET_MUTE';
    channelId?: string; // talkbackId
    value?: number; // 0-1 for gain
    active?: boolean; // for mute/unmute
}

export const setupWebSockets = (server: Server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket) => {
        console.log('Client connected');

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
        broadcast(wss, { type: 'GAIN_UPDATE', payload: { talkbackId: msg.channelId, level: msg.value } });
    } else if (msg.type === 'SET_MUTE') {
        console.log(`[WING] Set Mute: ID=${msg.channelId}, Active=${msg.active}`);
        broadcast(wss, { type: 'MUTE_UPDATE', payload: { talkbackId: msg.channelId, active: msg.active } });
    }
};

const broadcast = (wss: WebSocketServer, data: any) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};
