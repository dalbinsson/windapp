import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { fetchWeatherData } from './api/weatherApi';
import Header from './components/Header';
import ForecastView from './components/ForecastView';
import MapView from './components/MapView';
import MagnusSolution from './components/MagnusSolution';
import SettingsDrawer from './components/SettingsDrawer';
import Footer from './components/Footer';
import './styles/app.css';

function TabNavigation() {
  const location = useLocation();

  return (
    <nav className="tab-navigation">
      <Link 
        to="/" 
        className={`tab-link ${location.pathname === '/' ? 'active' : ''}`}
      >
        Weather Solution
      </Link>
      <Link 
        to="/magnus" 
        className={`tab-link ${location.pathname === '/magnus' ? 'active' : ''}`}
      >
        Magnus Solution
      </Link>
    </nav>
  );
}

function WeatherContent() {
  const {
    data,
    loading,
    setData,
    setLoading,
    activeView,
  } = useAppStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const weatherData = await fetchWeatherData(57.325, 12.105);
        setData(weatherData);
      } catch (error) {
        console.error('Failed to load weather data:', error);
        setData({
          series: {},
          errors: { 'Load Error': String(error) },
          location: { lat: 57.325, lon: 12.105 },
          loadedAt: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setData, setLoading]);

  return (
    <main>
      {activeView === 'forecast' ? (
        <ForecastView data={data} loading={loading} />
      ) : (
        <MapView />
      )}
    </main>
  );
}

function App() {
  return (
    <Router basename="/windapp">
      <Header />
      <TabNavigation />
      <Routes>
        <Route path="/" element={<WeatherContent />} />
        <Route path="/magnus" element={<MagnusSolution />} />
      </Routes>
      <SettingsDrawer />
      <Footer />
    </Router>
  );
}

export default App;
