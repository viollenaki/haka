import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import api from '../utils/apiInstance';
import { COVERAGE_RADIUS, FACILITY_COLORS } from '../constants/facilities';
import PopulationHexagonLayer from './PopulationHexagonLayer';

// Заменяем иконки на простые цветные маркеры для объектов
const facilityIcons = {
  school: new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #4CAF50; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
    radius: COVERAGE_RADIUS.school
  }),
  hospital: new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #F44336; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
    radius: COVERAGE_RADIUS.hospital
  }),
  clinic: new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #FF9800; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
    radius: COVERAGE_RADIUS.clinic
  }),
  kindergarten: new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #9C27B0; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
    radius: COVERAGE_RADIUS.kindergarten
  }),
  college: new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #2196F3; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
    radius: COVERAGE_RADIUS.college
  }),
  university: new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #3F51B5; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
    radius: COVERAGE_RADIUS.university
  }),
  fire_station: new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #FF5722; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
    radius: COVERAGE_RADIUS.fire_station
  }),
};

// Маркер для рекомендуемых местоположений - сделаем его ярче и крупнее
const recommendIcon = new L.DivIcon({
  className: 'custom-div-icon recommendation-marker',
  html: `<div style="background-color: #FF4500; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -10],
});

// Компонент для отслеживания границ карты
function BoundsHandler({ onBoundsChange }) {
  const map = useMap();
  const boundsRef = useRef();

  useEffect(() => {
    if (!map) return;
    const currentBounds = map.getBounds();
    const boundsObj = {
      north: currentBounds.getNorth(),
      south: currentBounds.getSouth(),
      east: currentBounds.getEast(),
      west: currentBounds.getWest()
    };
    
    // Store previous bounds in a ref to compare
    if (!boundsRef.current || 
        JSON.stringify(boundsRef.current) !== JSON.stringify(boundsObj)) {
      boundsRef.current = boundsObj;
      onBoundsChange(boundsObj);
    }
  }, [map]);  // Only depend on map instance changes

  return null;
}

// Компонент для создания тепловой карты
function HeatmapLayerComponent({ points }) {
  const map = useMap();
  const heatLayerRef = useRef();
  
  useEffect(() => {
    if (!points || points.length === 0) return;

    // Удаляем предыдущий слой, если он существует
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    const heatData = points.map(point => [
      point.lat,
      point.lng,
      point.intensity / 100 // Нормализуем интенсивность для лучшей визуализации
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
  }, [map, points]);

  return null;
}


// Слушает drop на карте и рисует маркер и круг с popup
function DropHandler({ facilityType }) {
  const map = useMap();
  const markersRef = useRef([]);

  // Очищаем пользовательские маркеры при смене типа учреждения
  useEffect(() => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => map.removeLayer(marker));
      markersRef.current = [];
    }
  }, [facilityType, map]);

  useEffect(() => {
    const handleDrop = e => {
      e.preventDefault();
      const type = e.dataTransfer.getData('facilityType');
      const rect = map.getContainer().getBoundingClientRect();
      const point = [e.clientX - rect.left, e.clientY - rect.top];
      const latlng = map.containerPointToLatLng(point);
      const icon = facilityIcons[type] || facilityIcons.school;
      const iconRadius = COVERAGE_RADIUS[type] || 2;
      const r = iconRadius * 1000;
      
      // Создаем маркер и сохраняем ссылку
      const marker = L.marker([latlng.lat, latlng.lng], { icon }).addTo(map);
      markersRef.current.push(marker);
      
      // Создаем popup и сохраняем ссылку
      const popup = L.popup()
        .setLatLng(latlng);
      markersRef.current.push(popup);
      
      // Создаем круг и сохраняем ссылку
      const circle = L.circle([latlng.lat, latlng.lng], {
        color: 'red',
        fillColor: '#f03',
        // fillOpacity: 0.5,
        radius: r
      }).addTo(map);
      markersRef.current.push(circle);
    };
    const container = map.getContainer();
    container.addEventListener('dragover', e => e.preventDefault());
    container.addEventListener('drop', handleDrop);
    return () => {
      container.removeEventListener('dragover', e => e.preventDefault());
      container.removeEventListener('drop', handleDrop);
    };
  }, [map]);
  return null;
}

const MapView = ({ 
  facilities, 
  recommendations, 
  onBoundsChange, 
  facilityType, 
  coverageRadius, 
  showHeatmap, 
  heatmapIntensity,
  showHexagons = false,
  hexagonOpacity = 0.7
}) => {
  const [populationData, setPopulationData] = React.useState([]);
  const [isPopulationLoading, setIsPopulationLoading] = React.useState(false);
  const [internalFacilities, setInternalFacilities] = React.useState([]);
  const [internalRecommendations, setInternalRecommendations] = React.useState([]);

  // Обновляем internalFacilities при изменении props.facilities
  React.useEffect(() => {
    setInternalFacilities(facilities);
  }, [facilities]);

  // Обновляем internalRecommendations при изменении props.recommendations
  React.useEffect(() => {
    setInternalRecommendations(recommendations);
  }, [recommendations]);

  // При смене типа объекта очищаем internalFacilities и internalRecommendations
  React.useEffect(() => {
    setInternalFacilities([]);
    setInternalRecommendations([]);
  }, [facilityType]);

  // Загрузка данных о населении
  useEffect(() => {
    if (showHeatmap && populationData.length === 0 && !isPopulationLoading) {
      setIsPopulationLoading(true);
      
      api.loadPopulationData()
        .then(data => {
          console.log('Loaded population data:', data.length, 'points');
          setPopulationData(data);
        })
        .catch(err => {
          console.error('Failed to load population data:', err);
        })
        .finally(() => {
          setIsPopulationLoading(false);
        });
    }
  }, [showHeatmap, populationData.length, isPopulationLoading]);

  // Функция для определения цвета круга в зависимости от типа учреждения
  const getCircleColor = (type) => {
    return FACILITY_COLORS[type] || '#607D8B'; // Серый по умолчанию
  };

  return (
    <div className="map-container">
      {isPopulationLoading && (
        <div className="map-loading-overlay">
          <div className="loading-spinner"></div>
          <p>Загрузка данных о населении...</p>
        </div>
      )}
      
      <MapContainer
        center={[42.8740, 74.6122]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <BoundsHandler onBoundsChange={onBoundsChange} />
        <DropHandler facilityType={facilityType} />
        
        {/* Слой тепловой карты */}
        {showHeatmap && populationData.length > 0 && (
          <HeatmapLayerComponent 
            points={populationData} 
            intensity={heatmapIntensity / 100}
          />
        )}
        
        {/* Слой с гексагонами плотности населения */}
        <PopulationHexagonLayer 
          visible={showHexagons} 
          opacity={hexagonOpacity}
        />
        
        {internalFacilities.map((facility, idx) => (
          <React.Fragment key={`facility-${idx}`}>
            <Marker 
              position={[facility.latitude, facility.longitude]} 
              icon={facilityIcons[facility.type || facilityType] || facilityIcons.school}
            >
              <Popup>
                <div>
                  <h3>{facility.name}</h3>
                  <p>Тип: {facility.type}</p>
                  {facility.address && <p>Адрес: {facility.address}</p>}
                </div>
              </Popup>
            </Marker>
            <Circle 
              center={[facility.latitude, facility.longitude]}
              radius={coverageRadius * 1000} // Конвертируем км в метры
              pathOptions={{ 
                fillColor: getCircleColor(facility.type || facilityType), 
                fillOpacity: 0.15, 
                color: getCircleColor(facility.type || facilityType), 
                opacity: 0.5,
                weight: 1
              }}
            />
          </React.Fragment>
        ))}
        
        {internalRecommendations.map((rec, idx) => (
          <React.Fragment key={`rec-${idx}`}>
            <Marker 
              position={[rec.latitude, rec.longitude]} 
              icon={recommendIcon}
            >
              <Popup>
                <div className="recommendation-popup">
                  <h3>Рекомендуемая локация #{idx + 1}</h3>
                  <p>Оценка: <strong>{(rec.score * 100).toFixed(1)}%</strong></p>
                  <p>Координаты: {rec.latitude.toFixed(5)}, {rec.longitude.toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
            <Circle 
              center={[rec.latitude, rec.longitude]}
              radius={coverageRadius * 1000} // Используем радиус в метрах из props
              pathOptions={{ 
                fillColor: '#FF4500', 
                fillOpacity: 0.12, 
                color: '#FF4500', 
                opacity: 0.7,
                weight: 2,
                dashArray: '5, 5' // Пунктирный круг для рекомендаций
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
