import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { fetchWeatherData } from '@/api/weatherApi';
import { ForecastView, MapView } from '@/features/weather';

export const WeatherPage = () => {
  const { data, setData, loading, setLoading, activeView, setActiveView } = useAppStore();

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
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setData, setLoading]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'forecast' || hash === 'map') {
        setActiveView(hash);
      } else if (!hash) {
        setActiveView('forecast');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setActiveView]);

  return (
    <main>
      {data ? (
        <>
          {activeView === 'forecast' && <ForecastView data={data} loading={loading} />}
          {activeView === 'map' && <MapView />}
        </>
      ) : (
        <div style={{ padding: '20px', color: '#c0392b' }}>Loading weather data...</div>
      )}
    </main>
  );
};
