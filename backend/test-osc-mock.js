#!/usr/bin/env node

// Quick test of the OSC/TALK button flow in mock mode
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
    console.log('[TEST] Connected to backend WebSocket');
    
    // Simulate pressing the TALK button (SET_MUTE message with mute=true)
    const talkMsg = {
        type: 'SET_MUTE',
        channelId: 'tb1',  // DRUMS TB (aux channel 4)
        active: true       // Mute/talk activated
    };
    
    console.log('[TEST] Sending SET_MUTE (TALK DOWN):', JSON.stringify(talkMsg));
    ws.send(JSON.stringify(talkMsg));
    
    // Also test SET_GAIN
    setTimeout(() => {
        const gainMsg = {
            type: 'SET_GAIN',
            channelId: 'tb1',
            value: 0.75
        };
        console.log('[TEST] Sending SET_GAIN:', JSON.stringify(gainMsg));
        ws.send(JSON.stringify(gainMsg));
    }, 100);
    
    // And FOH_CALL
    setTimeout(() => {
        const fohMsg = {
            type: 'FOH_CALL',
            musicianId: 'm1770291630609',
            musicianName: 'André Schwager',
            talkbackId: 'tb1',
            talkbackLabel: 'DRUMS TB'
        };
        console.log('[TEST] Sending FOH_CALL:', JSON.stringify(fohMsg));
        ws.send(JSON.stringify(fohMsg));
    }, 200);
});

ws.on('message', (data) => {
    try {
        const msg = JSON.parse(data);
        console.log('[BACKEND BROADCAST]', JSON.stringify(msg, null, 2));
    } catch (e) {
        console.log('[BACKEND RAW]', data.toString());
    }
});

ws.on('error', (err) => {
    console.error('[ERROR]', err.message);
});

ws.on('close', () => {
    console.log('[TEST] Disconnected');
    process.exit(0);
});

// Disconnect after 1 second
setTimeout(() => {
    ws.close();
}, 1000);
