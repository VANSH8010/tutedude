import { CheatingLogProvider } from './context/CheatingLogContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './views/HomePage';
import ProfilePage from './views/ProfilePage';
import NotFoundPage from './views/NotFoundPage';

function App() {
  return (
    <CheatingLogProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </CheatingLogProvider>
  );
}

export default App;
