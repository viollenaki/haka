import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, Circle, Marker, LayerGroup, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import geojsonData from '../bishkek_filtered.geojson1.js';
import api from '../utils/apiInstance';
import { COVERAGE_RADIUS, FACILITY_COLORS } from '../constants/facilities';

// Кастомные иконки для разных типов учреждений
const facilityIcons = {
  school: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2602/2602414.png',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  }),
  hospital: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2785/2785482.png',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  }),
  clinic: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2982/2982466.png',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  }),
  kindergarten: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3597/3597071.png',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  }),
  college: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/214/214282.png',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  }),
  university: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2957/2957872.png',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  }),
  fire_station: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4108/4108894.png',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  }),
  default: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
};

// Компонент для отслеживания границ карты
function BoundsHandler({ onBoundsChange }) {
  const map = useMap();
  const boundsRef = useRef();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!map) return;
    
    const handleMoveEnd = () => {
      const currentBounds = map.getBounds();
      const boundsObj = {
        north: currentBounds.getNorth(),
        south: currentBounds.getSouth(),
        east: currentBounds.getEast(),
        west: currentBounds.getWest()
      };
      
      if (!boundsRef.current || 
          JSON.stringify(boundsRef.current) !== JSON.stringify(boundsObj) ||
          !initializedRef.current) {
        
        boundsRef.current = boundsObj;
        initializedRef.current = true;
        onBoundsChange(boundsObj);
      }
    };
    
    map.on('moveend', handleMoveEnd);
    
    // Вызываем handleMoveEnd сразу после монтирования компонента
    setTimeout(() => {
      if (!initializedRef.current) {
        handleMoveEnd();
      }
    }, 100);
    
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onBoundsChange]);

  return null;
}

const HexagonMap = () => {
  const [hexagons, setHexagons] = useState([]);
  const [maxPopulation, setMaxPopulation] = useState(1000);
  const [error, setError] = useState(null);
  
  // Добавляем нужные состояния
  const [mapBounds, setMapBounds] = useState({
    north: 42.92,
    south: 42.82,
    east: 74.70,
    west: 74.50
  });
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Состояние для управления видимостью слоев инфраструктуры
  const [visibleLayers, setVisibleLayers] = useState({
    schools: false,
    hospitals: false,
    clinics: false,
    kindergartens: false,
    colleges: false,
    universities: false,
    fire_stations: false
  });
  
  // Настройки отображения
  const [showMarkers, setShowMarkers] = useState(true); // Состояние для показа/скрытия маркеров
  const [showCircles, setShowCircles] = useState(true); // Состояние для показа/скрытия кругов

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
  
  // Обработка изменения видимости слоя
  const handleLayerToggle = (layerName) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  // Обработка изменения границ карты
  const handleBoundsChange = (bounds) => {
    setMapBounds(bounds);
    
    // Загружаем данные об объектах, если активен какой-то слой
    const hasActiveLayer = Object.values(visibleLayers).some(visible => visible);
    if (hasActiveLayer) {
      loadFacilities(bounds);
    }
  };
  
  // Фильтрация объектов по типу для отображения
  const getFilteredFacilities = (type) => {
    return facilities.filter(facility => facility.type === type);
  };
  
  // Преобразование строки типа в читаемый формат
  const getFacilityName = (type) => {
    const names = {
      school: 'Школа',
      hospital: 'Больница',
      clinic: 'Клиника',
      kindergarten: 'Детский сад',
      college: 'Колледж',
      university: 'Университет',
      fire_station: 'Пожарная станция'
    };
    return names[type] || type;
  };

  // Функция загрузки данных об учреждениях
  const loadFacilities = async (bounds = mapBounds) => {
    setLoading(true);
    try {
      const data = await api.getMapFacilities(bounds);
      if (data && Array.isArray(data)) {
        setFacilities(data);
      }
    } catch (err) {
      console.error("Error loading facilities:", err);
    } finally {
      setLoading(false);
    }
  };

  // Получение иконки для маркера в зависимости от типа объекта
  const getFacilityIcon = (type) => {
    return facilityIcons[type] || facilityIcons.default;
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
      
      // Загрузим начальные данные об объектах
      loadFacilities();
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
      
      {/* Панель управления слоями */}
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Отображаемые объекты</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={visibleLayers.schools} 
              onChange={() => handleLayerToggle('schools')}
            />
            Школы
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={visibleLayers.hospitals} 
              onChange={() => handleLayerToggle('hospitals')}
            />
            Больницы
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={visibleLayers.clinics} 
              onChange={() => handleLayerToggle('clinics')}
            />
            Клиники
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={visibleLayers.kindergartens} 
              onChange={() => handleLayerToggle('kindergartens')}
            />
            Детские сады
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={visibleLayers.colleges} 
              onChange={() => handleLayerToggle('colleges')}
            />
            Колледжи
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={visibleLayers.universities} 
              onChange={() => handleLayerToggle('universities')}
            />
            Университеты
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={visibleLayers.fire_stations} 
              onChange={() => handleLayerToggle('fire_stations')}
            />
            Пожарные станции
          </label>
        </div>
        
        {/* Добавляем настройки отображения */}
        <div style={{ marginTop: '15px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Настройки отображения</h3>
          <label style={{ marginRight: '15px' }}>
            <input 
              type="checkbox" 
              checked={showMarkers} 
              onChange={() => setShowMarkers(!showMarkers)}
            />
            Показывать маркеры объектов
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={showCircles} 
              onChange={() => setShowCircles(!showCircles)}
            />
            Показывать зоны охвата
          </label>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => loadFacilities()} 
            style={{
              padding: '8px 12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            disabled={loading}
          >
            {loading ? 'Загрузка...' : 'Обновить данные'}
          </button>
        </div>
      </div>
      
      <div style={{ height: '70%', width: '100%', position: 'relative' }}>
        <MapContainer
          center={[42.87, 74.59]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <BoundsHandler onBoundsChange={handleBoundsChange} />
          
          {/* Слой гексагонов */}
          {hexagons.length > 0 && (
            hexagons.map(hex => (
              <Polygon
                key={hex.id}
                positions={hex.coordinates}
                pathOptions={{
                  fillColor: getColor(hex.population),
                  weight: 0,
                  opacity: 1,
                  color: 'transparent',
                  fillOpacity: 0.5
                }}
              >
                <Tooltip>
                  Население: {hex.population}
                </Tooltip>
              </Polygon>
            ))
          )}
          
          {/* Слои с зонами охвата учреждений - показываем только если showCircles === true */}
          {Object.entries(visibleLayers).map(([layerKey, isVisible]) => {
            if (!isVisible || !showCircles) return null;
            
            const type = layerKey.endsWith('s') ? layerKey.slice(0, -1) : layerKey; // Удаляем 's' из конца (schools -> school)
            return (
              <LayerGroup key={`circle-${layerKey}`}>
                {getFilteredFacilities(type).map((facility, idx) => (
                  <Circle
                    key={`${type}-circle-${idx}`}
                    center={[facility.latitude, facility.longitude]}
                    radius={COVERAGE_RADIUS[type] * 1000} // Переводим км в метры
                    pathOptions={{
                      color: FACILITY_COLORS[type],
                      fillColor: FACILITY_COLORS[type],
                      fillOpacity: 0.2,
                      weight: 1
                    }}
                  >
                    <Tooltip>
                      <div>
                        <strong>{facility.name}</strong>
                        <p>Тип: {getFacilityName(type)}</p>
                        {facility.address && <p>Адрес: {facility.address}</p>}
                      </div>
                    </Tooltip>
                  </Circle>
                ))}
              </LayerGroup>
            );
          })}
          
          {/* Добавляем маркеры объектов - показываем только если showMarkers === true */}
          {showMarkers && (
            <LayerGroup>
              {facilities.map((facility, idx) => {
                // Проверяем, включен ли слой для данного типа объекта
                const layerKey = `${facility.type}s`; // Добавляем 's' к типу (school -> schools)
                if (!visibleLayers[layerKey]) return null;
                
                return (
                  <Marker
                    key={`marker-${idx}`}
                    position={[facility.latitude, facility.longitude]}
                    icon={getFacilityIcon(facility.type)}
                    zIndexOffset={1000} // Гарантируем, что маркеры будут выше других слоев
                  >
                    <Popup>
                      <div>
                        <strong>{facility.name}</strong>
                        <p>Тип: {getFacilityName(facility.type)}</p>
                        {facility.address && <p>Адрес: {facility.address}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </LayerGroup>
          )}
        </MapContainer>
        
        {loading && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            borderRadius: '5px',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            zIndex: 1000
          }}>
            Загрузка данных...
          </div>
        )}
      </div>
      
      {/* Обновляем легенду, чтобы показывать маркеры объектов */}
      <div className="legend" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Легенда</h3>
        
        {/* Легенда для плотности населения */}
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '5px' }}>Плотность населения</h4>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', marginRight: '10px' }}>
              <div style={{ backgroundColor: '#0571b0', width: '40px', height: '20px', marginRight: '5px' }}></div>
              <div style={{ backgroundColor: '#6baed6', width: '40px', height: '20px', marginRight: '5px' }}></div>
              <div style={{ backgroundColor: '#74c476', width: '40px', height: '20px', marginRight: '5px' }}></div>
              <div style={{ backgroundColor: '#fd8d3c', width: '40px', height: '20px', marginRight: '5px' }}></div>
              <div style={{ backgroundColor: '#de2d26', width: '40px', height: '20px' }}></div>
            </div>
            <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between' }}>
              <span>Низкая</span>
              <span>Высокая</span>
            </div>
          </div>
        </div>
        
        {/* Легенда для значков объектов */}
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '5px' }}>Типы объектов</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {Object.entries(facilityIcons).map(([type, icon]) => {
              if (type === 'default') return null;
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center' }}>
                  <img 
                    src={icon.options.iconUrl} 
                    alt={type} 
                    style={{ width: '20px', height: '20px', marginRight: '5px' }} 
                  />
                  <span style={{ fontSize: '12px' }}>{getFacilityName(type)}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Легенда для объектов инфраструктуры */}
        <div>
          <h4 style={{ marginTop: 0, marginBottom: '5px' }}>Зоны охвата</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.entries(FACILITY_COLORS).map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '15px', 
                  height: '15px', 
                  backgroundColor: color,
                  borderRadius: '50%',
                  marginRight: '5px'
                }}></span>
                <span>{getFacilityName(type)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HexagonMap;
