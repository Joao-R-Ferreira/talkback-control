import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { HeaderProvider } from './context/HeaderContext';

function App() {
  return (
    <BrowserRouter>
      <HeaderProvider>
        <AppRoutes />
      </HeaderProvider>
    </BrowserRouter>
  )
}

export default App
