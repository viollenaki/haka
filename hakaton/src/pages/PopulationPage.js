import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import api from '../utils/apiInstance';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'your_mapbox_token_here';

const PopulationPage = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [populationData, setPopulationData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [intensity, setIntensity] = useState(50);
  const [stats, setStats] = useState({ total: 0, max: 0, min: 0, avg: 0 });

  useEffect(() => {
    setIsLoading(true);
    api.loadPopulationData()
      .then(data => {
        setPopulationData(data);

        if (data.length > 0) {
          const total = data.reduce((sum, point) => sum + point.intensity, 0);
          const max = Math.max(...data.map(point => point.intensity));
          const min = Math.min(...data.map(point => point.intensity));
          const avg = total / data.length;
          setStats({ total, max, min, avg });
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (map.current) {
      // Обновляем слой тепловой карты при изменении интенсивности или данных
      if (map.current.getLayer('population-heatmap')) {
        map.current.setPaintProperty('population-heatmap', 'heatmap-intensity', intensity / 50);
      }
    }
  }, [intensity]);

  useEffect(() => {
    if (map.current) return; // инициализация один раз

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [74.6122, 42.8740],
      zoom: 12
    });

    map.current.on('load', () => {
      if (!populationData || populationData.length === 0) return;

      const heatmapGeojson = {
        type: 'FeatureCollection',
        features: populationData.map(point => ({
          type: 'Feature',
          properties: { intensity: point.intensity },
          geometry: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
          }
        }))
      };

      if (map.current.getSource('population-heatmap-source')) {
        map.current.getSource('population-heatmap-source').setData(heatmapGeojson);
      } else {
        map.current.addSource('population-heatmap-source', {
          type: 'geojson',
          data: heatmapGeojson
        });

        map.current.addLayer({
          id: 'population-heatmap',
          type: 'heatmap',
          source: 'population-heatmap-source',
          maxzoom: 17,
          paint: {
            'heatmap-weight': ['get', 'intensity'],
            'heatmap-intensity': intensity / 50,
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 15,
              15, 20
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)'
            ],
            'heatmap-opacity': 0.7
          }
        });
      }
    });
  }, [populationData]);

  return (
    <div className="population-page">
      <h1>Анализ плотности населения Бишкека</h1>

      {isLoading ? (
        <div className="loading">Загрузка данных о населении...</div>
      ) : (
        <>
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

          <div className="population-map" style={{ height: '600px', width: '100%' }}>
            <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />
          </div>
        </>
      )}
    </div>
  );
};

export default PopulationPage;
