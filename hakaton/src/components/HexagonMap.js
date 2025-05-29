import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// Импорт данных напрямую из оригинального файла
import geojsonData from '../bishkek_filtered.geojson.js';
import api from '../utils/apiInstance';
import { COVERAGE_RADIUS, FACILITY_COLORS } from '../constants/facilities';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYWt1dXN0aWsiLCJhIjoiY21iNzJodTc1MDA1dTJxcjEwYzkwMm5kcCJ9.i8IWICH8gIGv1BCkynT9sw';

const HexagonMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [visibleLayers, setVisibleLayers] = useState({
    schools: false,
    hospitals: false,
    clinics: false,
    kindergartens: false,
    colleges: false,
    universities: false,
    fire_stations: false
  });
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [maxPopulation, setMaxPopulation] = useState(1000);
  const [showHexagons, setShowHexagons] = useState(true);
  const [hexagonOpacity, setHexagonOpacity] = useState(0.7);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [populationStats, setPopulationStats] = useState({ min: 0, max: 0, avg: 0, total: 0 });
  const [hexagonCount, setHexagonCount] = useState(0); // Добавляем счетчик гексагонов

  useEffect(() => {
    if (map.current) return;

    const initializeMap = () => {
      setLoading(true);
      
      try {
        console.log("Инициализация карты...");
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [74.59, 42.87], // Координаты Бишкека
          zoom: 11 // Уменьшаем начальный масштаб, чтобы видеть больше гексагонов
        });

        // Добавляем элементы управления навигацией
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          console.log("Карта загружена, проверяем данные гексагонов...");
          
          // Проверяем наличие данных
          if (!geojsonData) {
            console.error("geojsonData не определен");
            setError('Данные гексагонов не загружены');
            setLoading(false);
            return;
          }
          
          // Проверяем структуру данных
          if (!geojsonData.features || !Array.isArray(geojsonData.features)) {
            console.error("geojsonData не содержит массив features", geojsonData);
            setError('Некорректный формат данных гексагонов');
            setLoading(false);
            return;
          }
          
          // Выводим количество гексагонов
          console.log(`Загружено ${geojsonData.features.length} гексагонов`);
          setHexagonCount(geojsonData.features.length);
          
          // Проверяем каждый гексагон на наличие координат
          const validFeatures = geojsonData.features.filter(f => {
            return f.geometry && f.geometry.coordinates && f.geometry.coordinates.length > 0;
          });
          
          console.log(`Найдено ${validFeatures.length} гексагонов с корректными координатами`);
          
          if (validFeatures.length === 0) {
            setError('В данных нет гексагонов с корректными координатами');
            setLoading(false);
            return;
          }
          
          // Рассчитываем статистику по населению
          const popValues = validFeatures.map(f => f.properties?.population || 0);
          const maxPop = Math.max(...popValues, 1);
          const minPop = Math.min(...popValues.filter(v => v > 0), 0);
          const totalPop = popValues.reduce((acc, val) => acc + val, 0);
          const avgPop = totalPop / popValues.filter(v => v > 0).length || 0;

          setMaxPopulation(maxPop);
          setPopulationStats({
            min: minPop,
            max: maxPop,
            avg: Math.round(avgPop),
            total: totalPop
          });

          // Добавляем исходные данные на карту
          map.current.addSource('hexagons', {
            type: 'geojson',
            data: geojsonData
          });

          // Добавляем слой с заливкой гексагонов
          map.current.addLayer({
            id: 'hexagons-fill',
            type: 'fill',
            source: 'hexagons',
            paint: {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'population'],
                0, '#0571b0',
                Math.round(maxPop * 0.2), '#6baed6',
                Math.round(maxPop * 0.4), '#74c476',
                Math.round(maxPop * 0.6), '#fd8d3c',
                Math.round(maxPop * 0.8), '#de2d26'
              ],
              'fill-opacity': hexagonOpacity
            }
          });

          // Добавляем слой с обводкой гексагонов
          map.current.addLayer({
            id: 'hexagons-outline',
            type: 'line',
            source: 'hexagons',
            paint: {
              'line-color': '#000',
              'line-width': 1,
              'line-opacity': 0.3
            }
          });

          // Обработчик клика для отображения информации
          map.current.on('click', 'hexagons-fill', (e) => {
            if (!e.features || e.features.length === 0) return;
            
            const feature = e.features[0];
            const coordinates = e.lngLat;
            const { h3, population } = feature.properties || {};

            if (!h3 || !population) {
              console.warn("Отсутствуют свойства гексагона:", feature.properties);
              return;
            }

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <h4>Информация о зоне</h4>
                <p><strong>H3 индекс:</strong> ${h3}</p>
                <p><strong>Население:</strong> ${population} чел.</p>
                <p><strong>Плотность:</strong> ${Math.round(population / 0.15)} чел./км²</p>
              `)
              .addTo(map.current);
          });

          // Интерактивные эффекты при наведении
          map.current.on('mouseenter', 'hexagons-fill', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });
          
          map.current.on('mouseleave', 'hexagons-fill', () => {
            map.current.getCanvas().style.cursor = '';
          });

          // Подгоняем карту под границы всех гексагонов
          try {
            const bounds = new mapboxgl.LngLatBounds();
            
            validFeatures.forEach(feature => {
              if (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
                // Для полигонов (гексагонов) обрабатываем каждую точку в полигоне
                feature.geometry.coordinates[0].forEach(coord => {
                  // mapboxgl работает с координатами в формате [lng, lat], а в GeoJSON они могут быть [lat, lng]
                  // Нам нужно убедиться, что координаты находятся в диапазоне от -180 до 180 для долготы
                  // и от -90 до 90 для широты
                  if (Array.isArray(coord) && coord.length >= 2) {
                    const lng = coord[0] > 180 || coord[0] < -180 ? coord[0] % 180 : coord[0];
                    const lat = coord[1] > 90 || coord[1] < -90 ? (coord[1] > 90 ? 90 : -90) : coord[1];
                    bounds.extend([lng, lat]);
                  }
                });
              }
            });
            
            if (!bounds.isEmpty()) {
              console.log("Устанавливаем границы карты:", bounds);
              map.current.fitBounds(bounds, {
                padding: 40,
                maxZoom: 13
              });
            } else {
              console.warn("Не удалось определить границы гексагонов");
            }
          } catch (err) {
            console.error("Ошибка при подгонке границ карты:", err);
          }

          setDataLoaded(true);
          setLoading(false);
        });

        map.current.on('error', (e) => {
          console.error('Ошибка Mapbox:', e);
          setError(`Ошибка карты: ${e.error && e.error.message ? e.error.message : 'Неизвестная ошибка'}`);
          setLoading(false);
        });
      } catch (err) {
        console.error('Ошибка при инициализации карты:', err);
        setError('Не удалось инициализировать карту: ' + (err.message || 'Неизвестная ошибка'));
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Обновление непрозрачности гексагонов
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (map.current.getLayer('hexagons-fill')) {
      map.current.setPaintProperty(
        'hexagons-fill',
        'fill-opacity',
        hexagonOpacity
      );
    }
  }, [hexagonOpacity]);

  // Управление видимостью слоев
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const visibility = showHexagons ? 'visible' : 'none';
    
    if (map.current.getLayer('hexagons-fill')) {
      map.current.setLayoutProperty(
        'hexagons-fill',
        'visibility',
        visibility
      );
    }
    
    if (map.current.getLayer('hexagons-outline')) {
      map.current.setLayoutProperty(
        'hexagons-outline',
        'visibility',
        visibility
      );
    }
  }, [showHexagons]);

  return (
    <div style={{ height: '80vh', width: '100%', padding: '20px' }}>
      <h2>Карта плотности населения Бишкека (гексагоны)</h2>
      
      {/* Информация о данных */}
      <div style={{ marginBottom: '15px' }}>
        <p>
          Всего гексагонов: <strong>{hexagonCount}</strong>
          {dataLoaded && <span> • Отображено: <strong>{geojsonData.features.length}</strong> гексагонов</span>}
        </p>
      </div>
      
      {/* Панель управления слоями */}
      <div className="map-controls" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label htmlFor="show-hexagons">
              <input 
                type="checkbox"
                id="show-hexagons"
                checked={showHexagons}
                onChange={() => setShowHexagons(!showHexagons)}
              /> 
              Показать гексагоны населения
            </label>
          </div>
          
          {showHexagons && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="hex-opacity">Непрозрачность:</label>
              <input 
                type="range"
                id="hex-opacity"
                min="0.1"
                max="1"
                step="0.1"
                value={hexagonOpacity}
                onChange={(e) => setHexagonOpacity(parseFloat(e.target.value))}
              />
              <span>{Math.round(hexagonOpacity * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Статистика по данным */}
      {dataLoaded && showHexagons && (
        <div style={{ marginBottom: '10px', fontSize: '14px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
          <strong>Статистика населения:</strong> 
          от {populationStats.min} до {populationStats.max} чел., 
          в среднем: {populationStats.avg} чел., 
          всего: {populationStats.total} чел.
        </div>
      )}
      
      {/* Контейнер карты */}
      <div style={{ position: 'relative', height: 'calc(100% - 130px)', width: '100%', border: '1px solid #ddd', borderRadius: '4px' }}>
        <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />
        
        {/* Легенда */}
        {showHexagons && dataLoaded && (
          <div style={{
            position: 'absolute',
            right: '30px',
            bottom: '30px',
            background: 'white',
            padding: '10px',
            borderRadius: '4px',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            zIndex: 10
          }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Плотность населения</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '20px', background: '#0571b0', marginRight: '8px' }}></div>
                <span>0 - {Math.round(maxPopulation * 0.2)} чел.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '20px', background: '#6baed6', marginRight: '8px' }}></div>
                <span>{Math.round(maxPopulation * 0.2)} - {Math.round(maxPopulation * 0.4)} чел.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '20px', background: '#74c476', marginRight: '8px' }}></div>
                <span>{Math.round(maxPopulation * 0.4)} - {Math.round(maxPopulation * 0.6)} чел.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '20px', background: '#fd8d3c', marginRight: '8px' }}></div>
                <span>{Math.round(maxPopulation * 0.6)} - {Math.round(maxPopulation * 0.8)} чел.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '20px', background: '#de2d26', marginRight: '8px' }}></div>
                <span>{Math.round(maxPopulation * 0.8)} - {maxPopulation} чел.</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Индикатор загрузки */}
        {loading && (
          <div style={{ 
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.8)',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>
            <div style={{ 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              margin: '0 auto 15px',
              animation: 'spin 2s linear infinite'
            }}></div>
            <p>Загрузка данных гексагонов...</p>
          </div>
        )}
        
        {/* Сообщение об ошибке */}
        {error && (
          <div style={{ 
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.9)',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            color: 'red',
            maxWidth: '80%',
            textAlign: 'center'
          }}>
            <h3>Ошибка загрузки данных</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Перезагрузить страницу
            </button>
          </div>
        )}

        {/* Отладочная информация */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'absolute',
            left: '10px',
            top: '10px',
            background: 'rgba(255,255,255,0.8)',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            maxWidth: '300px'
          }}>
            <details>
              <summary>Отладочная информация</summary>
              <p>GeoJSON features: {geojsonData?.features?.length || 0}</p>
              <p>Максимум населения: {maxPopulation}</p>
              <p>Загружено: {dataLoaded ? 'Да' : 'Нет'}</p>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default HexagonMap;
