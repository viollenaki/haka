import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Исправление проблемы с иконками Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Кастомные иконки для разных типов учреждений
const facilityIcons = {
  school: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2602/2602414.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
  }),
  hospital: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2785/2785482.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
  }),
  fire_station: new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4108/4108894.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
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

const MapView = ({ facilities, recommendations, onBoundsChange, facilityType }) => {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [populationData, setPopulationData] = useState([]);

  // Загрузка данных о плотности населения при изменении границ карты
  useEffect(() => {
    const fetchPopulationData = async () => {
      try {
        // Имитация загрузки данных о плотности населения
        // В реальном приложении здесь был бы запрос к API
        const mockData = Array.from({ length: 200 }, () => ({
          lat: 55.5 + Math.random() * 0.3, // Примерные координаты
          lng: 37.5 + Math.random() * 0.3,
          intensity: Math.random() * 100
        }));
        
        setPopulationData(mockData);
      } catch (error) {
        console.error('Failed to load population data:', error);
      }
    };

    fetchPopulationData();
  }, [onBoundsChange]);

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
        center={[42.8740, 74.6122]} // Бишкек
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <BoundsHandler onBoundsChange={onBoundsChange} />
        
        {showHeatmap && (
          <HeatmapLayerComponent points={populationData} />
        )}
        
        {facilities.map((facility, idx) => (
          <Marker 
            key={`facility-${idx}`}
            position={[facility.latitude, facility.longitude]} 
            icon={facilityIcons[facilityType] || facilityIcons.school}
          >
            <Popup>
              <div>
                <h3>{facility.name}</h3>
                <p>Тип: {facility.type}</p>
                {facility.address && <p>Адрес: {facility.address}</p>}
              </div>
            </Popup>
          </Marker>
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
              radius={2000} // 2km radius
              pathOptions={{ 
                fillColor: 'blue', 
                fillOpacity: 0.1, 
                color: 'blue', 
                opacity: 0.5 
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
