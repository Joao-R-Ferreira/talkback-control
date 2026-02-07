#!/usr/bin/env node
/**
 * Simple UDP/OSC listener for testing Wing communication.
 * Listens for OSC messages and displays them in human-readable format.
 */

const dgram = require('dgram');
const fs = require('fs');

// OSC parsing helper
function parseOSCMessage(buffer) {
    try {
        let offset = 0;
        
        // Read address (null-terminated string, padded to multiple of 4)
        let addressEnd = buffer.indexOf(0, offset);
        const address = buffer.toString('utf8', offset, addressEnd);
        offset = addressEnd + 1;
        
        // Align to 4-byte boundary
        while (offset % 4 !== 0) offset++;
        
        // Read type tag string (starts with ',', null-terminated, padded to multiple of 4)
        if (buffer[offset] !== 44) { // ',' character
            return { address, args: [], raw: buffer.toString('hex') };
        }
        
        let typeEnd = buffer.indexOf(0, offset);
        const typeString = buffer.toString('utf8', offset, typeEnd);
        offset = typeEnd + 1;
        
        // Align to 4-byte boundary
        while (offset % 4 !== 0) offset++;
        
        // Parse arguments based on type tag
        const args = [];
        for (let i = 1; i < typeString.length; i++) {
            const type = typeString[i];
            
            if (type === 'f') {
                // Float (4 bytes, big-endian)
                const float = buffer.readFloatBE(offset);
                args.push({ type: 'float', value: float });
                offset += 4;
            } else if (type === 'i') {
                // Int (4 bytes, big-endian)
                const int = buffer.readInt32BE(offset);
                args.push({ type: 'int', value: int });
                offset += 4;
            } else if (type === 's') {
                // String (null-terminated, padded to multiple of 4)
                let strEnd = buffer.indexOf(0, offset);
                const str = buffer.toString('utf8', offset, strEnd);
                args.push({ type: 'string', value: str });
                offset = strEnd + 1;
                while (offset % 4 !== 0) offset++;
            }
        }
        
        return { address, args, typeString };
    } catch (err) {
        return { error: err.message, raw: buffer.toString('hex') };
    }
}

// Create UDP server
const server = dgram.createSocket('udp4');

server.on('message', (msg, rinfo) => {
    const timestamp = new Date().toISOString();
    const parsed = parseOSCMessage(msg);
    
    console.log(`\n[${timestamp}] OSC Message received from ${rinfo.address}:${rinfo.port}`);
    console.log(`  Address: ${parsed.address}`);
    
    if (parsed.typeString) {
        console.log(`  Type Tag: ${parsed.typeString}`);
        if (parsed.args.length > 0) {
            console.log(`  Arguments:`);
            parsed.args.forEach((arg, i) => {
                console.log(`    [${i}] ${arg.type}: ${arg.value}`);
            });
        }
    } else if (parsed.error) {
        console.log(`  Parse Error: ${parsed.error}`);
        console.log(`  Raw (hex): ${parsed.raw}`);
    }
});

server.on('error', (err) => {
    console.error(`Server error: ${err}`);
});

server.on('listening', () => {
    const addr = server.address();
    console.log(`\n🎙️  OSC Listener started on ${addr.address}:${addr.port}`);
    console.log(`Waiting for OSC packets...\n`);
});

// Bind to localhost:2223
const PORT = 2223;
const HOST = '127.0.0.1';

server.bind(PORT, HOST, () => {
    console.log(`Listening for OSC messages on ${HOST}:${PORT}...`);
});

// Handle CTRL+C
process.on('SIGINT', () => {
    console.log('\n\nShutting down OSC listener...');
    server.close();
    process.exit(0);
});
