import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { WeatherPage } from './pages/WeatherPage';
import { MagnusPage } from './pages/MagnusPage';
import { Header, SettingsDrawer, Footer } from './components/layout';
import './styles/app.css';

const SolutionTabs = () => {
  const location = useLocation();
  const basename = window.location.pathname.split('/').filter(Boolean)[0] === 'windapp' ? '/windapp' : '';

  return (
    <nav className="tab-navigation">
      <a
        href={`${basename}/`}
        className={`tab-link ${location.pathname === '/' || location.pathname === `${basename}/` ? 'active' : ''}`}
      >
        Weather Solution
      </a>
      <a
        href={`${basename}/magnus`}
        className={`tab-link ${location.pathname === '/magnus' || location.pathname === `${basename}/magnus` ? 'active' : ''}`}
      >
        Magnus Solution
      </a>
    </nav>
  );
};

const ViewTabs = () => {
  const location = useLocation();
  const isWeatherPage = location.pathname === '/' || location.pathname.endsWith('/');
  const currentHash = window.location.hash.slice(1) || 'forecast';

  if (!isWeatherPage) return null;

  return (
    <nav className="tab-navigation">
      <a 
        href={`${window.location.pathname}#forecast`} 
        className={`tab-link ${currentHash === 'forecast' ? 'active' : ''}`}
      >
        Forecast
      </a>
      <a 
        href={`${window.location.pathname}#map`} 
        className={`tab-link ${currentHash === 'map' ? 'active' : ''}`}
      >
        Map
      </a>
    </nav>
  );
};

const AppContent = () => {
  return (
    <>
      <Header />
      <SolutionTabs />
      <ViewTabs />
      <Routes>
        <Route path="/" element={<WeatherPage />} />
        <Route path="/magnus" element={<MagnusPage />} />
      </Routes>
      <SettingsDrawer />
      <Footer />
    </>
  );
};

export const App = () => {
  const basename = window.location.hostname.includes('github.io') ? '/windapp' : '/';
  return (
    <Router basename={basename}>
      <AppContent />
    </Router>
  );
};
