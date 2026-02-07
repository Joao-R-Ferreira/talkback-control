/**
 * OSC Logging Module
 * Tracks OSC commands sent to Behringer Wing console
 */

export interface OSCLogEntry {
    timestamp: string;
    address: string;
    value: number | boolean | string;
    valueType: string;
}

let isLogging = false;
let logEntries: OSCLogEntry[] = [];

export const startLogging = (): void => {
    isLogging = true;
    logEntries = [];
    console.log('[LOGS] Logging started');
};

export const stopLogging = (): void => {
    isLogging = false;
    console.log(`[LOGS] Logging stopped (${logEntries.length} entries)`);
};

export const isLoggingActive = (): boolean => {
    return isLogging;
};

export const addLogEntry = (address: string, value: number | boolean, valueType: string = 'float'): void => {
    if (!isLogging) return;
    
    const entry: OSCLogEntry = {
        timestamp: new Date().toISOString(),
        address,
        value,
        valueType
    };
    
    logEntries.push(entry);
    console.log(`[LOGS] ${entry.timestamp} -> ${address} = ${value}`);
};

export const getLogs = (): OSCLogEntry[] => {
    return [...logEntries];
};

export const clearLogs = (): void => {
    logEntries = [];
    console.log('[LOGS] Log cleared');
};

export const getLogStats = (): { count: number; isLogging: boolean; startTime?: string; endTime?: string } => {
    return {
        count: logEntries.length,
        isLogging,
        startTime: logEntries.length > 0 ? logEntries[0].timestamp : undefined,
        endTime: logEntries.length > 0 ? logEntries[logEntries.length - 1].timestamp : undefined
    };
};

export default {
    startLogging,
    stopLogging,
    isLoggingActive,
    addLogEntry,
    getLogs,
    clearLogs,
    getLogStats
};
