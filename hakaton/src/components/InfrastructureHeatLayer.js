import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { infrastructureToHeatPoints, kmToPixelsAtZoom } from '../utils/mapUtils';

/**
 * Компонент для отображения тепловой карты зон охвата инфраструктурных объектов
 * @param {Array} data Данные о зонах охвата инфраструктурных объектов
 * @param {Object} options Дополнительные параметры для настройки тепловой карты
 */
const InfrastructureHeatLayer = ({ data, options = {} }) => {
  const map = useMap();
  const [heatLayer, setHeatLayer] = useState(null);

  // Параметры тепловой карты по умолчанию
  const defaultOptions = {
    radius: 20,
    blur: 15,
    maxZoom: 17,
    max: 100,
    gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
  };

  // Объединяем с пользовательскими опциями
  const heatOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    if (!map || !data || data.length === 0) return;

    // Получаем текущий зум карты
    const currentZoom = map.getZoom();
    
    // Преобразуем данные инфраструктуры в точки тепловой карты
    const heatPoints = infrastructureToHeatPoints(data, currentZoom);
    
    // Преобразуем в формат для leaflet.heat
    const heatData = heatPoints.map(point => [
      point.lat,
      point.lng,
      point.intensity
    ]);

    // Создаем тепловую карту
    const layer = L.heatLayer(heatData, heatOptions).addTo(map);
    setHeatLayer(layer);

    // Обновляем тепловую карту при изменении зума
    const handleZoomEnd = () => {
      if (heatLayer) {
        map.removeLayer(heatLayer);
        
        const newZoom = map.getZoom();
        const newHeatPoints = infrastructureToHeatPoints(data, newZoom);
        
        const newHeatData = newHeatPoints.map(point => [
          point.lat,
          point.lng,
          point.intensity
        ]);
        
        const newLayer = L.heatLayer(newHeatData, heatOptions).addTo(map);
        setHeatLayer(newLayer);
      }
    };

    map.on('zoomend', handleZoomEnd);

    // Очистка при размонтировании компонента
    return () => {
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, data, heatOptions]);

  return null;
};

export default InfrastructureHeatLayer;
