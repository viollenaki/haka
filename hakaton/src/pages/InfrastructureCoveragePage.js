import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import InfrastructureHeatLayer from '../components/InfrastructureHeatLayer';
import CoverageCircles from '../components/CoverageCircles';
import MapLegend from '../components/MapLegend';
import api from '../utils/api';

const InfrastructureCoveragePage = () => {
  const [infrastructureData, setInfrastructureData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCircles, setShowCircles] = useState(true);

  // Границы карты для первоначальной загрузки данных
  const initialBounds = {
    north: 42.9,
    south: 42.8,
    east: 74.7,
    west: 74.5
  };
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getInfrastructureCoverage(initialBounds);
        setInfrastructureData(data);
      } catch (error) {
        console.error('Error loading infrastructure data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="infrastructure-coverage-page">
      <h1>Карта зон охвата инфраструктуры</h1>
      
      <div className="map-controls" style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '20px' }}>
          <input 
            type="checkbox" 
            checked={showHeatmap} 
            onChange={() => setShowHeatmap(!showHeatmap)}
          />
          Показать тепловую карту
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={showCircles} 
            onChange={() => setShowCircles(!showCircles)}
          />
          Показать круги зон охвата
        </label>
      </div>
      
      {isLoading ? (
        <div>Загрузка данных...</div>
      ) : (
        <div style={{ height: '700px', width: '100%' }}>
          <MapContainer 
            center={[42.87, 74.61]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {showHeatmap && infrastructureData.length > 0 && (
              <InfrastructureHeatLayer 
                data={infrastructureData}
                options={{
                  radius: 25,
                  blur: 20,
                  maxZoom: 18,
                }}
              />
            )}
            
            {showCircles && infrastructureData.length > 0 && (
              <CoverageCircles 
                data={infrastructureData}
                showLabels={true}
              />
            )}
            
            <MapLegend 
              options={{
                position: 'bottomright',
                title: 'Зоны охвата',
                showHeatmapLegend: showHeatmap
              }}
            />
          </MapContainer>
        </div>
      )}
      
      <div className="infrastructure-info" style={{ marginTop: '20px' }}>
        <h2>Информация о зонах охвата</h2>
        <p>
          На карте представлены зоны охвата различных инфраструктурных объектов.
          Каждый объект имеет внутренний (минимальный) и внешний (максимальный) радиус охвата.
        </p>
        <p>
          Тепловая карта показывает интенсивность покрытия территории инфраструктурными объектами.
          Более тёмные участки соответствуют областям с более высокой концентрацией услуг.
        </p>
        <p>
          Всего в выбранном регионе: <strong>{infrastructureData.length}</strong> объектов инфраструктуры.
        </p>
      </div>
    </div>
  );
};

export default InfrastructureCoveragePage;
