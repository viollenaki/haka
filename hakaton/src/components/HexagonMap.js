import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// Исправляем импорт файла с данными
import geojsonData from '../bishkek_filtered.geojson1.js';

const HexagonMap = () => {
  const [hexagons, setHexagons] = useState([]);
  const [maxPopulation, setMaxPopulation] = useState(1000);
  const [error, setError] = useState(null);

  // Конвертация Web Mercator в LatLng
  const webMercatorToLatLng = (x, y) => {
    const earthRadius = 6378137; // Радиус Земли в метрах
    
    // Конвертируем x координату из метров в радианы
    const lng = (x / earthRadius) * (180 / Math.PI);
    
    // Конвертируем y координату из метров в радианы
    const lat = (Math.atan(Math.exp(y / earthRadius)) - (Math.PI / 4)) * 2 * (180 / Math.PI);
    
    return [lat, lng];
  };

  // Получение цвета в зависимости от плотности населения
  const getColor = (population) => {
    const normalized = Math.min(population / maxPopulation, 1);
    
    if (normalized < 0.2) return '#0571b0'; // Синий
    if (normalized < 0.4) return '#6baed6'; // Голубой
    if (normalized < 0.6) return '#74c476'; // Зеленый
    if (normalized < 0.8) return '#fd8d3c'; // Оранжевый
    return '#de2d26'; // Красный
  };

  useEffect(() => {
    try {
      // Проверяем, что geojsonData и features существуют
      if (!geojsonData || !geojsonData.features) {
        setError("Данные геосетки отсутствуют или имеют неверный формат");
        console.error("Missing or invalid geojsonData:", geojsonData);
        return;
      }
      
      // Преобразуем GeoJSON в формат для отображения
      const features = geojsonData.features;
      
      // Найдем максимальное население
      const popValues = features.map(f => f.properties?.population || 0);
      const maxPop = Math.max(...popValues, 1); // Минимум 1, чтобы избежать деления на 0
      setMaxPopulation(maxPop);
      
      // Преобразуем координаты для работы с Leaflet
      const hexData = features.map(feature => {
        // Извлекаем координаты полигона и преобразуем их
        const coords = feature.geometry?.coordinates?.[0]?.map(coord => 
          webMercatorToLatLng(coord[0], coord[1])
        ) || [];
        
        return {
          id: feature.properties?.h3 || `hex-${Math.random().toString(16).slice(2)}`,
          population: feature.properties?.population || 0,
          coordinates: coords
        };
      });
      
      setHexagons(hexData);
    } catch (err) {
      console.error("Error processing hexagon data:", err);
      setError("Ошибка при обработке данных геосетки");
    }
  }, []);

  if (error) {
    return (
      <div className="hexagon-map-error" style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
        <h3>Ошибка загрузки данных</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Попробовать снова</button>
      </div>
    );
  }

  return (
    <div className="hexagon-map-container" style={{ height: '80vh', width: '100%', padding: '20px' }}>
      <h2>Карта плотности населения Бишкека (гексагоны)</h2>
      <div style={{ height: '90%', width: '100%' }}>
        <MapContainer
          center={[42.87, 74.59]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {hexagons.length > 0 ? (
            hexagons.map(hex => (
              <Polygon
                key={hex.id}
                positions={hex.coordinates}
                pathOptions={{
                  fillColor: getColor(hex.population),
                  weight: 1,
                  opacity: 1,
                  color: '#666',
                  fillOpacity: 0.7
                }}
              >
                <Tooltip>
                  Население: {hex.population}
                </Tooltip>
              </Polygon>
            ))
          ) : (
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              padding: '10px',
              borderRadius: '5px',
              zIndex: 1000
            }}>
              Загрузка данных...
            </div>
          )}
        </MapContainer>
      </div>
      
      <div className="legend" style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
        <span>Плотность населения: </span>
        <div style={{ display: 'flex', marginLeft: '10px' }}>
          <div style={{ backgroundColor: '#0571b0', width: '40px', height: '20px', marginRight: '5px' }}></div>
          <div style={{ backgroundColor: '#6baed6', width: '40px', height: '20px', marginRight: '5px' }}></div>
          <div style={{ backgroundColor: '#74c476', width: '40px', height: '20px', marginRight: '5px' }}></div>
          <div style={{ backgroundColor: '#fd8d3c', width: '40px', height: '20px', marginRight: '5px' }}></div>
          <div style={{ backgroundColor: '#de2d26', width: '40px', height: '20px' }}></div>
        </div>
        <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between', marginLeft: '5px' }}>
          <span>Низкая</span>
          <span>Высокая</span>
        </div>
      </div>
    </div>
  );
};

export default HexagonMap;
