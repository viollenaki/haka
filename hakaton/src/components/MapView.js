import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L, { popup } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Кастомные иконки для разных типов учреждений
const facilityIcons = {
  school: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2602/2602414.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
    radius: 2
  }),
  hospital: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2785/2785482.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
    radius: 1
  }),
  clinic: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2982/2982466.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
    radius: 2
  }),
  kindergarten: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3597/3597071.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
    radius: 1.5
  }),
  college: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/214/214282.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
    radius: 2
  }),
  university: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2957/2957872.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
    radius: 5
  }),
  fire_station: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4108/4108894.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
    radius: 5
  }),
};

const recommendIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7710/7710488.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
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
  }, [map]); // Only depend on map instance changes

  return null;
}

// Компонент для создания тепловой карты
function HeatmapLayerComponent({ points }) {
  const map = useMap();
  
  useEffect(() => {
    if (!points || points.length === 0) return;

    const heatData = points.map(point => [
      point.lat,
      point.lng,
      point.intensity
    ]);

    const heatLayer = L.heatLayer(heatData, { 
      radius: 20,
      blur: 15,
      maxZoom: 17,
      max: 100,
      gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}


// Слушает drop на карте и рисует маркер и круг с popup
function DropHandler({ radius }) {
  const map = useMap();
  useEffect(() => {
    const handleDrop = e => {
      e.preventDefault();
      const type = e.dataTransfer.getData('facilityType');
      const rect = map.getContainer().getBoundingClientRect();
      const point = [e.clientX - rect.left, e.clientY - rect.top];
      const latlng = map.containerPointToLatLng(point);
      const icon = facilityIcons[type] || facilityIcons.school;
      const iconRadius = icon.options?.radius || radius;
      const r = iconRadius * 1000;
      L.marker([latlng.lat, latlng.lng], { icon }).addTo(map);
      L.popup()
        .setLatLng(latlng)
      L.circle([latlng.lat, latlng.lng], {
        color: 'red',
        fillColor: '#f03',
        // fillOpacity: 0.5,
        radius: r
      }).addTo(map);
    };
    const container = map.getContainer();
    container.addEventListener('dragover', e => e.preventDefault());
    container.addEventListener('drop', handleDrop);
    return () => {
      container.removeEventListener('dragover', e => e.preventDefault());
      container.removeEventListener('drop', handleDrop);
    };
  }, [map, radius]);
  return null;
}

const MapView = ({ facilities, recommendations, onBoundsChange, facilityType, coverageRadius }) => {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [populationData, setPopulationData] = useState([]);

  // Функция для определения цвета круга в зависимости от типа учреждения
  const getCircleColor = (type) => {
    const colors = {
      'school': '#4CAF50',       // Зеленый
      'hospital': '#F44336',     // Красный
      'clinic': '#FF9800',       // Оранжевый
      'kindergarten': '#9C27B0', // Фиолетовый
      'college': '#2196F3',      // Синий
      'university': '#3F51B5',   // Индиго
      'fire_station': '#FF5722'  // Красно-оранжевый
    };
    
    return colors[type] || '#607D8B'; // Серый по умолчанию
  };

  return (
    <div className="map-container">
      <div className="heat-layer-selector">
        <label>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={() => setShowHeatmap(!showHeatmap)}
          />
          Показать плотность населения
        </label>
      </div>
      
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
        {/* <ClickHandler /> */}
        <DropHandler radius={coverageRadius} />
        
        {showHeatmap && (
          <HeatmapLayerComponent points={populationData} />
        )}
        
        {facilities.map((facility, idx) => (
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
        
        {recommendations.map((rec, idx) => (
          <React.Fragment key={`rec-${idx}`}>
            <Marker 
              position={[rec.latitude, rec.longitude]} 
              icon={recommendIcon}
            >
              <Popup>
                <div>
                  <h3>Рекомендуемая локация #{idx + 1}</h3>
                  <p>Оценка: {(rec.score * 100).toFixed(1)}%</p>
                  <p>Координаты: {rec.latitude.toFixed(5)}, {rec.longitude.toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
            <Circle 
              center={[rec.latitude, rec.longitude]}
              radius={coverageRadius * 1000} // Используем радиус в метрах из props
              pathOptions={{ 
                fillColor: 'blue', 
                fillOpacity: 0.1, 
                color: 'blue', 
                opacity: 0.5,
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
