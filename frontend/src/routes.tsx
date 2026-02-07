import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MainControlPage from './pages/MainControlPage';
import SettingsPage from './pages/SettingsPage';
import FohAssistantPage from './pages/FohAssistantPage';
import LogPage from './pages/LogPage';

const AppRoutes: React.FC = () => (
    <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route element={<Layout />}> 
            <Route path="/talkback" element={<MainControlPage />} />
            <Route path="/foh-assistant" element={<FohAssistantPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/logs" element={<LogPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

export default AppRoutes;
