import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { Icon } from 'leaflet';
import HexagonLayer from '../components/HexagonLayer';
import api from '../utils/apiInstance';
import { prepareHexagonData } from '../utils/hexagonUtils';
import '../styles/hexagon.css';

// Координаты центра Бишкека
const BISHKEK_CENTER = [42.8747, 74.6122];
const DEFAULT_ZOOM = 12;

const PopulationHexagonPage = () => {
  const [hexagonData, setHexagonData] = useState(null);
  const [maxPopulation, setMaxPopulation] = useState(20000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHexagonData = async () => {
      try {
        setLoading(true);
        const data = await api.getPopulationHexagons();
        
        // Подготавливаем данные
        const { features, maxPopulation } = prepareHexagonData(data);
        
        setHexagonData({
          type: "FeatureCollection",
          features: features
        });
        setMaxPopulation(maxPopulation);
        
        console.log(`Загружено ${features.length} гексагонов. Максимальное население: ${maxPopulation}`);
      } catch (err) {
        console.error('Ошибка при загрузке данных гексагонов:', err);
        setError('Не удалось загрузить данные о населении');
      } finally {
        setLoading(false);
      }
    };

    fetchHexagonData();
  }, []);

  return (
    <div className="population-hexagon-page">
      <div className="page-header">
        <h1>Карта населения Бишкека</h1>
        <p>Данные о населении представлены в виде гексагональной сетки H3</p>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка данных о населении...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()}>Попробовать снова</button>
        </div>
      )}

      <div className="map-container" style={{ height: '70vh', width: '100%' }}>
        <MapContainer
          center={BISHKEK_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ZoomControl position="topright" />
          
          {hexagonData && (
            <HexagonLayer 
              geojsonData={hexagonData} 
              maxPopulation={maxPopulation}
            />
          )}
          
          {/* Легенда */}
          <div className="map-legend hexagon-legend">
            <h4>Население</h4>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#0571b0' }}></div>
                <span>0 - {Math.round(maxPopulation * 0.2)}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#6baed6' }}></div>
                <span>{Math.round(maxPopulation * 0.2)} - {Math.round(maxPopulation * 0.4)}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#74c476' }}></div>
                <span>{Math.round(maxPopulation * 0.4)} - {Math.round(maxPopulation * 0.6)}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#fd8d3c' }}></div>
                <span>{Math.round(maxPopulation * 0.6)} - {Math.round(maxPopulation * 0.8)}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#de2d26' }}></div>
                <span>{Math.round(maxPopulation * 0.8)} - {maxPopulation}+</span>
              </div>
            </div>
          </div>
        </MapContainer>
      </div>
      
      <div className="information-panel">
        <h2>О гексагональной сетке</h2>
        <p>
          Гексагональная сетка H3 используется для визуализации плотности населения. 
          Каждый гексагон представляет определенную территорию с соответствующим количеством жителей.
        </p>
        <p>
          Цветовая шкала отображает количество населения от синего (меньше всего) до красного (больше всего).
        </p>
        <p>
          Нажмите на гексагон, чтобы получить точную информацию о населении в выбранной зоне.
        </p>
      </div>
    </div>
  );
};

export default PopulationHexagonPage;
