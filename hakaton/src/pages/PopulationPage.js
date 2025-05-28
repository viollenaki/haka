import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import api from '../utils/apiInstance';
import '../styles/population.css';

// Компонент тепловой карты
function HeatmapLayer({ points, intensity }) {
  const map = useMap();
  const heatLayerRef = React.useRef(null);

  useEffect(() => {
    if (!points || points.length === 0) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    const heatData = points.map(point => [
      point.lat,
      point.lng,
      (point.intensity * intensity) / 100
    ]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
    }).addTo(map);

    heatLayerRef.current = heatLayer;

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points, intensity]);

  return null;
}

const PopulationPage = () => {
  const [populationData, setPopulationData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [intensity, setIntensity] = useState(50);
  const [stats, setStats] = useState({ total: 0, max: 0, min: 0, avg: 0 });

  useEffect(() => {
    setIsLoading(true);
    api.loadPopulationData()
      .then(data => {
        setPopulationData(data);
        
        // Вычисляем статистику
        if (data.length > 0) {
          const total = data.reduce((sum, point) => sum + point.intensity, 0);
          const max = Math.max(...data.map(point => point.intensity));
          const min = Math.min(...data.map(point => point.intensity));
          const avg = total / data.length;
          
          setStats({ total, max, min, avg });
        }
      })
      .catch(err => {
        console.error('Failed to load population data:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="population-page">
      <h1>Анализ плотности населения Бишкека</h1>

      {isLoading ? (
        <div className="loading">Загрузка данных о населении...</div>
      ) : (
        <div className="population-content">
          <div className="population-stats">
            <h2>Статистика населения</h2>
            <p>Загружено точек данных: <strong>{populationData.length}</strong></p>
            <p>Общее население: <strong>{stats.total.toLocaleString()}</strong></p>
            <p>Максимальная плотность: <strong>{stats.max}</strong></p>
            <p>Минимальная плотность: <strong>{stats.min}</strong></p>
            <p>Средняя плотность: <strong>{stats.avg.toFixed(2)}</strong></p>
            
            <div className="intensity-control">
              <h3>Интенсивность отображения</h3>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={intensity} 
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                step="5"
              />
              <span>{intensity}%</span>
            </div>
          </div>
          
          <div className="population-map">
            <MapContainer
              center={[42.8740, 74.6122]}
              zoom={12}
              style={{ height: '600px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              <HeatmapLayer points={populationData} intensity={intensity} />
            </MapContainer>
            
            <div className="map-legend">
              <div className="legend-title">Плотность населения</div>
              <div className="legend-gradient">
                <span style={{ backgroundColor: 'blue' }}></span>
                <span style={{ backgroundColor: 'cyan' }}></span>
                <span style={{ backgroundColor: 'lime' }}></span>
                <span style={{ backgroundColor: 'yellow' }}></span>
                <span style={{ backgroundColor: 'red' }}></span>
              </div>
              <div className="legend-labels">
                <span>Низкая</span>
                <span>Высокая</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopulationPage;
