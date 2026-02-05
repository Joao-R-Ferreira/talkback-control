import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainControlPage from './pages/MainControlPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';
import { HeaderProvider } from './context/HeaderContext';

function App() {
  return (
    <BrowserRouter>
      <HeaderProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MainControlPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HeaderProvider>
    </BrowserRouter>
  )
}

export default App
