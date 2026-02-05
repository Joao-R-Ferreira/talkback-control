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
