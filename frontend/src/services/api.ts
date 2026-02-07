import axios from 'axios';
import type { AppConfig } from '../types';

const API_URL = `http://${window.location.hostname}:3001/api`;

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getConfig = async (): Promise<AppConfig> => {
    const response = await api.get<AppConfig>('/config');
    return response.data;
};

export const updateConfig = async (config: Partial<AppConfig>, token: string): Promise<AppConfig> => {
    const response = await api.post<AppConfig>('/config', config, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const login = async (username: string, password: string): Promise<{ token: string }> => {
    const response = await api.post<{ token: string }>('/login', { username, password });
    return response.data;
};

export const uploadImage = async (file: File, token: string): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<{ url: string }>('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const getImages = async (token: string): Promise<string[]> => {
    const response = await api.get<string[]>('/images', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteImage = async (filename: string, token: string): Promise<void> => {
    await api.delete(`/images/${filename}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// Logging API calls
export interface LogEntry {
    timestamp: string;
    address: string;
    value: number | boolean | string;
    valueType: string;
}

export interface LogStats {
    count: number;
    isLogging: boolean;
    startTime?: string;
    endTime?: string;
}

export const getLogStatus = async (): Promise<LogStats> => {
    const response = await api.get<LogStats>('/logs/status');
    return response.data;
};

export const startLogging = async (): Promise<{ status: string; isLogging: boolean }> => {
    const response = await api.post('/logs/start', {});
    return response.data;
};

export const stopLogging = async (): Promise<{ status: string; isLogging: boolean }> => {
    const response = await api.post('/logs/stop', {});
    return response.data;
};

export const getLogs = async (): Promise<{ entries: LogEntry[]; count: number }> => {
    const response = await api.get<{ entries: LogEntry[]; count: number }>('/logs');
    return response.data;
};

export const clearLogs = async (): Promise<{ status: string; cleared: boolean }> => {
    const response = await api.delete('/logs');
    return response.data;
};

export const testWingConnection = async (): Promise<{ connected: boolean; message: string }> => {
    const response = await api.get<{ connected: boolean; message: string }>('/wing/test');
    return response.data;
};

