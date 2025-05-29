import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { COVERAGE_RADIUS, FACILITY_COLORS, RECOMMENDATION_COLORS } from '../constants/facilities';

// Используем токен Mapbox
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYWt1dXN0aWsiLCJhIjoiY21iNzJodTc1MDA1dTJxcjEwYzkwMm5kcCJ9.i8IWICH8gIGv1BCkynT9sw';

const MapView = ({ 
  facilities, 
  recommendations, 
  onBoundsChange, 
  facilityType, 
  coverageRadius, 
  showHeatmap, 
  heatmapIntensity,
  showHexagons = false,
  hexagonOpacity = 0.7,
  hexagonData,
  hexagonMode = false,
  allowFacilityDrop = true,
  onFacilityAdded = null,
  userAddedFacilities = [],
  clearUserFacilities = null
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const userLayersRef = useRef([]); // Для отслеживания пользовательских слоев

  // Идентификаторы слоев
  const facilityLayerId = 'facilities-layer';
  const facilityCircleLayerId = 'facilities-circle-layer';
  const recommendationLayerId = 'recommendations-layer';
  const recommendationCircleLayerId = 'recommendations-circle-layer';
  const heatmapLayerId = 'heatmap-layer';
  const hexagonLayerId = 'hexagon-layer';

  // Используем useCallback для мемоизации функции cleanupLayer
  const cleanupLayer = useCallback((layerId) => {
    if (!map.current || !mapLoaded) return;
    
    try {
      // Удаляем обработчики событий, если они есть
      ['click', 'mouseenter', 'mouseleave'].forEach(event => {
        if (map.current.listens && map.current.listens(event, layerId)) {
          map.current.off(event, layerId);
        }
      });
      
      // Удаляем слой, если он существует
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      
      // Удаляем источник после удаления всех слоев
      if (map.current.getSource(layerId)) {
        map.current.removeSource(layerId);
      }
    } catch (err) {
      console.error(`Error cleaning up layer ${layerId}:`, err);
    }
  }, [mapLoaded]); // Зависит только от mapLoaded

  // Инициализация карты - используем пустой массив зависимостей для инициализации только один раз
  useEffect(() => {
    if (map.current) return; // избегаем повторной инициализации
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [74.6122, 42.8740],
      zoom: 13
    });

    // Сохраняем оригинальную функцию onBoundsChange для использования внутри эффекта
    const boundsChangeHandler = onBoundsChange;

    map.current.on('load', () => {
      console.log('Map loaded successfully');
      setMapLoaded(true);
      
      // Отправляем начальные границы карты после загрузки
      const bounds = map.current.getBounds();
      boundsChangeHandler({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
    });

    map.current.on('moveend', () => {
      // Отправляем новые границы карты при перемещении
      if (!map.current) return;
      
      const bounds = map.current.getBounds();
      boundsChangeHandler({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
    });

    // Очистка при размонтировании
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Пустой массив зависимостей - инициализируем карту только один раз

  // Обновление слоев учреждений
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Создаем одну функцию для всех обновлений слоев
    const updateLayers = () => {
      // Обновляем слои объектов инфраструктуры
      try {
        // Очищаем существующие слои и источники
        cleanupLayer(facilityCircleLayerId);
        cleanupLayer(facilityLayerId);

        // Если выбран режим "без слоев" (map), в режиме гексагонов, или нет данных, просто выходим
        if (facilityType === "map" || hexagonMode || !facilities || facilities.length === 0) return;

        // GeoJSON для точек учреждений
        const geojson = {
          type: 'FeatureCollection',
          features: facilities.map(facility => ({
            type: 'Feature',
            properties: {
              type: facility.type || facilityType, // Используем тип объекта или текущий выбранный тип
              name: facility.name,
              address: facility.address,
              coverageRadius: COVERAGE_RADIUS[facility.type || facilityType] || coverageRadius || 2
            },
            geometry: {
              type: 'Point',
              coordinates: [facility.longitude, facility.latitude]
            }
          }))
        };

        // Добавляем источник данных
        map.current.addSource(facilityLayerId, {
          type: 'geojson',
          data: geojson
        });

        // Добавляем слой с маркерами
        map.current.addLayer({
          id: facilityLayerId,
          type: 'circle',
          source: facilityLayerId,
          paint: {
            'circle-radius': 8,
            'circle-color': [
              'match',
              ['get', 'type'],
              ...Object.entries(FACILITY_COLORS).flat(),
              '#888' // Дефолтный цвет, если тип не найден
            ],
            'circle-stroke-color': 'white',
            'circle-stroke-width': 2
          }
        });

        // Добавляем слой с зонами охвата с корректными цветами
        map.current.addLayer({
          id: facilityCircleLayerId,
          type: 'circle',
          source: facilityLayerId,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, ['*', ['get', 'coverageRadius'], 10],
              15, ['*', ['get', 'coverageRadius'], 100]
            ],
            'circle-color': [
              'match',
              ['get', 'type'],
              'school', FACILITY_COLORS.school,
              'hospital', FACILITY_COLORS.hospital,
              'clinic', FACILITY_COLORS.clinic,
              'kindergarten', FACILITY_COLORS.kindergarten,
              'college', FACILITY_COLORS.college,
              'university', FACILITY_COLORS.university,
              'fire_station', FACILITY_COLORS.fire_station,
              FACILITY_COLORS[facilityType] || '#888' // Используем текущий выбранный тип, если тип объекта не определен
            ],
            'circle-opacity': 0.15,
            'circle-stroke-color': [
              'match',
              ['get', 'type'],
              'school', FACILITY_COLORS.school,
              'hospital', FACILITY_COLORS.hospital,
              'clinic', FACILITY_COLORS.clinic,
              'kindergarten', FACILITY_COLORS.kindergarten,
              'college', FACILITY_COLORS.college,
              'university', FACILITY_COLORS.university,
              'fire_station', FACILITY_COLORS.fire_station,
              FACILITY_COLORS[facilityType] || '#888'
            ],
            'circle-stroke-width': 1,
            'circle-stroke-opacity': 0.5
          }
        });

        // Добавляем обработчики событий
        map.current.on('click', facilityLayerId, (e) => {
          if (!e.features || !e.features.length) return;
          
          const feature = e.features[0];
          const coordinates = feature.geometry.coordinates.slice();
          const { name, type, address } = feature.properties;

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<h3>${name}</h3><p>Тип: ${type}</p>${address ? `<p>Адрес: ${address}</p>` : ''}`)
            .addTo(map.current);
        });

        map.current.on('mouseenter', facilityLayerId, () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        
        map.current.on('mouseleave', facilityLayerId, () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
      } catch (error) {
        console.error("Error updating facility layers:", error);
      }
    };

    // Используем setTimeout для гарантии, что карта полностью загружена
    const timer = setTimeout(updateLayers, 100);
    return () => clearTimeout(timer);
    
  }, [facilities, coverageRadius, mapLoaded, hexagonMode, facilityType]); // Убираем cleanupLayer из зависимостей

  // Обновление слоев рекомендаций
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Используем setTimeout для избежания конфликтов
    const timer = setTimeout(() => {
      try {
        // Очищаем старые слои и источники
        cleanupLayer(recommendationCircleLayerId);
        cleanupLayer(recommendationLayerId);
        
        // Если выбран режим "без слоев" (map), в режиме гексагонов, или нет данных, просто выходим
        if (facilityType === "map" || hexagonMode || !recommendations || recommendations.length === 0) return;

        const geojson = {
          type: 'FeatureCollection',
          features: recommendations.map((rec, idx) => ({
            type: 'Feature',
            properties: {
              score: rec.score,
              name: rec.name || `Рекомендуемая локация #${idx + 1}`,
              coverageRadius: coverageRadius || 2,
              type: rec.type || facilityType // Используем тип из рекомендации или текущий выбранный тип
            },
            geometry: {
              type: 'Point',
              coordinates: [rec.longitude, rec.latitude]
            }
          }))
        };

        map.current.addSource(recommendationLayerId, {
          type: 'geojson',
          data: geojson
        });

        // Добавляем слой с маркерами рекомендации
        map.current.addLayer({
          id: recommendationLayerId,
          type: 'circle',
          source: recommendationLayerId,
          paint: {
            'circle-radius': 16, // Увеличиваем размер для лучшей заметности
            'circle-color': [
              'match',
              ['get', 'type'],
              'school', RECOMMENDATION_COLORS.school,
              'hospital', RECOMMENDATION_COLORS.hospital,
              'clinic', RECOMMENDATION_COLORS.clinic,
              'kindergarten', RECOMMENDATION_COLORS.kindergarten,
              'college', RECOMMENDATION_COLORS.college,
              'university', RECOMMENDATION_COLORS.university,
              'fire_station', RECOMMENDATION_COLORS.fire_station,
              '#FF0000' // Красный по умолчанию для рекомендаций
            ],
            'circle-stroke-color': 'white',
            'circle-stroke-width': 3,
            'circle-opacity': 1,
            'circle-pitch-alignment': 'map',
          }
        });
        
        // Добавляем слой с зонами охвата для рекомендаций
        map.current.addLayer({
          id: recommendationCircleLayerId,
          type: 'circle',
          source: recommendationLayerId,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, ['*', ['get', 'coverageRadius'], 10],
              15, ['*', ['get', 'coverageRadius'], 100]
            ],
            // Используем красные оттенки для зон охвата
            'circle-color': [
              'match',
              ['get', 'type'],
              'school', 'rgba(255, 0, 0, 0.15)',
              'hospital', 'rgba(255, 0, 0, 0.15)',
              'clinic', 'rgba(255, 0, 0, 0.15)',
              'kindergarten', 'rgba(255, 0, 0, 0.15)',
              'college', 'rgba(255, 0, 0, 0.15)',
              'university', 'rgba(255, 0, 0, 0.15)',
              'fire_station', 'rgba(255, 0, 0, 0.15)',
              'rgba(255, 0, 0, 0.15)' // Красный с прозрачностью по умолчанию
            ],
            'circle-opacity': 0.3, // Увеличиваем непрозрачность для лучшей видимости
            'circle-stroke-color': [
              'match',
              ['get', 'type'],
              'school', RECOMMENDATION_COLORS.school,
              'hospital', RECOMMENDATION_COLORS.hospital,
              'clinic', RECOMMENDATION_COLORS.clinic,
              'kindergarten', RECOMMENDATION_COLORS.kindergarten,
              'college', RECOMMENDATION_COLORS.college,
              'university', RECOMMENDATION_COLORS.university,
              'fire_station', RECOMMENDATION_COLORS.fire_station,
              '#FF0000'
            ],
            'circle-stroke-width': 3,   // Увеличиваем ширину границы
            'circle-stroke-opacity': 0.9, // Увеличиваем непрозрачность границы
            'circle-stroke-dasharray': [2, 2] // Пунктирная линия для выделения
          }
        });

        // Добавляем обработчики
        map.current.on('click', recommendationLayerId, (e) => {
          if (!e.features || !e.features.length) return;
          
          const feature = e.features[0];
          const coordinates = feature.geometry.coordinates.slice();
          const { name, score } = feature.properties;

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<h3>${name}</h3><p>Оценка: ${(score * 100).toFixed(1)}%</p>`)
            .addTo(map.current);
        });

        map.current.on('mouseenter', recommendationLayerId, () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        
        map.current.on('mouseleave', recommendationLayerId, () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
      } catch (error) {
        console.error("Error updating recommendation layer:", error);
      }
    }, 200); // Небольшая задержка после загрузки карты

    return () => clearTimeout(timer);
  }, [recommendations, coverageRadius, mapLoaded, facilityType, hexagonMode]); // Добавлена зависимость cleanupLayer

  // Тепловая карта
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const timer = setTimeout(() => {
      try {
        // Удаляем старый слой и источник
        cleanupLayer(heatmapLayerId);
        
        // Проверяем нужно ли показывать тепловую карту
        // Не показываем в режиме "без слоев", гексагонов
        if (facilityType === "map" || hexagonMode || !showHeatmap || !facilities || facilities.length === 0) return;

        // Подготавливаем данные для тепловой карты
        const heatmapData = {
          type: 'FeatureCollection',
          features: facilities.map(f => ({
            type: 'Feature',
            properties: {
              intensity: (f.intensity || 1) * (heatmapIntensity / 100)
            },
            geometry: {
              type: 'Point',
              coordinates: [f.longitude, f.latitude]
            }
          }))
        };

        map.current.addSource(heatmapLayerId, {
          type: 'geojson',
          data: heatmapData
        });

        map.current.addLayer({
          id: heatmapLayerId,
          type: 'heatmap',
          source: heatmapLayerId,
          maxzoom: 17,
          paint: {
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 15,
              15, 20
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 1,
              15, 3
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
      } catch (error) {
        console.error("Error updating heatmap layer:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [showHeatmap, facilities, heatmapIntensity, mapLoaded, hexagonMode]); // Добавлена зависимость cleanupLayer

  // Слой гексагонов
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const timer = setTimeout(() => {
      try {
        // Очищаем старые слои гексагонов
        cleanupLayer(hexagonLayerId);
        cleanupLayer('hexagons-outline'); // Удаляем и контуры гексагонов
        
        // Проверяем, нужно ли показывать гексагоны
        if (!showHexagons || !hexagonData) {
          console.log("Skipping hexagon layer: showHexagons=", showHexagons, "hexagonData=", hexagonData ? "available" : "null");
          return;
        }

        console.log(`Rendering hexagon layer with ${hexagonData.features?.length || 0} hexагонов`);

        // Добавляем источник данных для гексагонов
        map.current.addSource(hexagonLayerId, {
          type: 'geojson',
          data: hexagonData
        });

        // Добавляем слой с заполненными гексагонами с градиентом согласно фото
        map.current.addLayer({
          id: hexagonLayerId,
          type: 'fill',
          source: hexagonLayerId,
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'population'],
              0, '#0571b0',    // Тёмно-синий для минимальных значений
              100, '#92c5de',  // Светло-синий
              200, '#f7f7f7',  // Зеленоватый/нейтральный
              400, '#fc8d59',  // Оранжевый
              800, '#d7301f'   // Красный для максимальных значений
            ],
            'fill-opacity': hexagonOpacity
          }
        });

        // Добавляем слой с контурами гексагонов
        map.current.addLayer({
          id: 'hexagons-outline',
          type: 'line',
          source: hexagonLayerId,
          paint: {
            'line-color': '#000000',
            'line-width': 0.5,
            'line-opacity': 0.3
          }
        });

        // Добавляем интерактивность для гексагонов с информацией о населении
        map.current.on('click', hexagonLayerId, (e) => {
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          const coordinates = e.lngLat;
          const { h3, population } = feature.properties || {};

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
              <h4>Информация о зоне</h4>
              <p><strong>Население:</strong> ${population || 0} чел.</p>
              <p><strong>H3 индекс:</strong> ${h3 || 'Н/Д'}</p>
            `)
            .addTo(map.current);
        });
        
        // Изменяем курсор при наведении
        map.current.on('mouseenter', hexagonLayerId, () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        
        map.current.on('mouseleave', hexagonLayerId, () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });

        // Устанавливаем визуальное отображение режима гексагонов
        if (hexagonMode) {
          // Добавляем информационное сообщение
          if (!document.getElementById('hexagon-mode-info')) {
            const infoDiv = document.createElement('div');
            infoDiv.id = 'hexagon-mode-info';
            infoDiv.className = 'map-info-overlay';
            infoDiv.innerHTML = '<div class="info-content">Режим просмотра гексагонов активен</div>';
            map.current.getContainer().appendChild(infoDiv);
          }
        } else {
          // Удаляем сообщение, если режим выключен
          const infoDiv = document.getElementById('hexagon-mode-info');
          if (infoDiv) infoDiv.remove();
        }
      } catch (error) {
        console.error("Error updating hexagon layer:", error);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [showHexagons, hexagonData, hexagonOpacity, mapLoaded, hexagonMode, cleanupLayer]);

  // Функция для отрисовки пользовательских объектов на карте
  const renderUserFacilities = useCallback(() => {
    if (!map.current || !mapLoaded) return;
    
    // Сначала очистим все существующие пользовательские слои
    userLayersRef.current.forEach(layerId => {
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(layerId)) {
        map.current.removeSource(layerId);
      }
    });
    userLayersRef.current = [];
    
    // Отрисуем все пользовательские объекты
    userAddedFacilities.forEach((facility, index) => {
      const markerId = `user-marker-${index}`;
      const circleId = `user-circle-${index}`;
      
      // Добавляем источник данных для маркера
      map.current.addSource(markerId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            type: facility.type,
            name: `Новый объект: ${facility.type}`
          },
          geometry: {
            type: 'Point',
            coordinates: [facility.longitude, facility.latitude]
          }
        }
      });
      
      // Добавляем маркер
      map.current.addLayer({
        id: markerId,
        type: 'circle',
        source: markerId,
        paint: {
          'circle-radius': 8,
          'circle-color': FACILITY_COLORS[facility.type] || '#888',
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2
        }
      });
      
      // Добавляем круг радиуса покрытия
      map.current.addSource(circleId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            radius: facility.coverageRadius || COVERAGE_RADIUS[facility.type] || 2
          },
          geometry: {
            type: 'Point',
            coordinates: [facility.longitude, facility.latitude]
          }
        }
      });
      
      map.current.addLayer({
        id: circleId,
        type: 'circle',
        source: circleId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, ['*', ['get', 'radius'], 10],
            15, ['*', ['get', 'radius'], 100]
          ],
          'circle-color': FACILITY_COLORS[facility.type] || '#888',
          'circle-opacity': 0.15,
          'circle-stroke-color': FACILITY_COLORS[facility.type] || '#888',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.5
        }
      });
      
      userLayersRef.current.push(markerId, circleId);
    });
  }, [userAddedFacilities, mapLoaded]);
  
  // Обновляем отображение пользовательских объектов при их изменении
  useEffect(() => {
    renderUserFacilities();
  }, [userAddedFacilities, renderUserFacilities]);

  // Функция для перетаскивания объектов
  const setupDragAndDrop = useCallback(() => {
    if (!map.current || !mapLoaded || !allowFacilityDrop) return;
    
    const container = map.current.getContainer();
    
    const handleDragOver = (e) => {
      e.preventDefault();
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      
      // Получаем тип учреждения из события перетаскивания
      const type = e.dataTransfer.getData('facilityType');
      if (!type) return;
      
      // Получаем координаты на карте из позиции события
      const rect = container.getBoundingClientRect();
      const point = [e.clientX - rect.left, e.clientY - rect.top];
      const lngLat = map.current.unproject(point);
      
      // Определяем радиус покрытия для данного типа объекта
      const radius = COVERAGE_RADIUS[type] || coverageRadius || 2; // в км
      
      // Если предоставлена функция обратного вызова, вызываем её с новым объектом
      if (onFacilityAdded && typeof onFacilityAdded === 'function') {
        onFacilityAdded({
          type,
          latitude: lngLat.lat,
          longitude: lngLat.lng,
          coverageRadius: radius
        });
      }
    };
    
    // Добавляем обработчики событий
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    
    // Возвращаем функцию очистки
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, [map, mapLoaded, coverageRadius, allowFacilityDrop, onFacilityAdded]);
  
  // Инициализация обработчиков drag-and-drop
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const cleanup = setupDragAndDrop();
    return cleanup;
  }, [mapLoaded, setupDragAndDrop]);

  return (
    <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />
  );
};

export default MapView;