import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppProvider } from './context/AppContext.tsx'

// Disable pinch-zoom and double-tap zoom validation
if (typeof document !== 'undefined') {
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  });

  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Prevent pinch zoom via touchmove
  document.addEventListener('touchmove', function (event) {
    if ((event as any).scale !== 1) {
      event.preventDefault();
    }
  }, { passive: false });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
