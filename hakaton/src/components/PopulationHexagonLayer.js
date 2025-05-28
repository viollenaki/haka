import React, { useState, useEffect } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import api from '../utils/apiInstance';

/**
 * Компонент для отображения плотности населения в виде гексагональной сетки
 */
const PopulationHexagonLayer = ({ visible, resolution = 8, opacity = 0.7 }) => {
  const [hexData, setHexData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxPopulation, setMaxPopulation] = useState(1000);

  // Загрузка данных о гексагонах при первом рендере
  useEffect(() => {
    if (visible && hexData.length === 0 && !loading) {
      loadHexagonData();
    }
  }, [visible]);

  // Загрузка данных о гексагонах
  const loadHexagonData = async () => {
    setLoading(true);
    try {
      // Получаем данные о населении в формате гексагонов
      const data = await api.getPopulationHexagons();
      
      if (data && data.features && data.features.length > 0) {
        // Находим максимальную популяцию для нормализации цвета
        const populations = data.features.map(f => f.properties.population || 0);
        const maxPop = Math.max(...populations, 1000);
        
        setMaxPopulation(maxPop);
        setHexData(data.features);
        
        console.log(`Загружено ${data.features.length} гексагонов. Максимальная популяция: ${maxPop}`);
      } else {
        console.warn('Не удалось загрузить данные о гексагонах или данные пусты');
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных гексагонов:', error);
    } finally {
      setLoading(false);
    }
  };

  // Получает цвет для гексагона в зависимости от плотности населения
  const getHexColor = (population) => {
    // Нормализуем значение между 0 и 1
    const normalizedValue = Math.min(population / maxPopulation, 1);
    
    if (normalizedValue < 0.2) return '#0571b0'; // Синий
    if (normalizedValue < 0.4) return '#6baed6'; // Голубой
    if (normalizedValue < 0.6) return '#74c476'; // Зеленый
    if (normalizedValue < 0.8) return '#fd8d3c'; // Оранжевый
    return '#de2d26'; // Красный
  };

  if (!visible || hexData.length === 0) {
    return null;
  }

  return (
    <>
      {hexData.map((feature, idx) => {
        if (!feature.geometry || 
            feature.geometry.type !== 'Polygon' || 
            !feature.geometry.coordinates || 
            !feature.geometry.coordinates[0]) {
          return null;
        }
        
        const population = feature.properties?.population || 0;
        const hexId = feature.properties?.h3 || `hex-${idx}`;
        
        // Преобразуем координаты из формата GeoJSON [lon, lat] в [lat, lon] для Leaflet
        const positions = feature.geometry.coordinates[0].map(
          coord => [coord[1], coord[0]]
        );
        
        return (
          <Polygon
            key={hexId}
            positions={positions}
            pathOptions={{
              fillColor: getHexColor(population),
              weight: 1,
              opacity: 0.5,
              color: '#666',
              fillOpacity: opacity
            }}
          >
            <Tooltip direction="center">
              <div>
                <strong>Население:</strong> {population}
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
};

export default PopulationHexagonLayer;
