import React, { useState, useEffect } from 'react';
import KeplerMap from '../components/KeplerMap';
import { processGeojson } from 'kepler.gl/processors';
import api from '../utils/api';

const KeplerMapPage = () => {
  const [mapData, setMapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Загружаем данные о плотности населения
        const bounds = {
          north: 43.0,
          south: 42.7,
          east: 75.0,
          west: 74.4
        };
        
        const populationData = await api.getPopulationDensity(bounds);
        
        // Преобразуем данные в формат GeoJSON
        const geojsonData = {
          type: 'FeatureCollection',
          features: populationData.map(point => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [point.lng, point.lat]
            },
            properties: {
              intensity: point.intensity
            }
          }))
        };
        
        // Подготавливаем данные для Kepler
        const datasets = processGeojson(geojsonData);
        setMapData(datasets);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Загрузка данных...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {mapData && <KeplerMap data={mapData} />}
    </div>
  );
};

export default KeplerMapPage;
