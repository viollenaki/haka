import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import FacilityPanel from './components/FacilityPanel';
import AboutPage from './pages/AboutPage';
import PopulationPage from './pages/PopulationPage';
import HexagonMap from './components/HexagonMap';

// Импорт вспомогательных файлов
import api from './utils/apiInstance';
import radiusData from './radius.json';

function App() {
  const [selectedFacilityType, setSelectedFacilityType] = useState('school');
  const [mapBounds, setMapBounds] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [coverageRadius, setCoverageRadius] = useState(2); // Радиус охвата по умолчанию в км

  // Находит и устанавливает радиус для выбранного типа учреждения
  const updateCoverageRadius = (facilityType) => {
    const facilityInfo = radiusData.infrastructure_coverage.find(item => item.type === facilityType);
    if (facilityInfo && facilityInfo.radius_km && facilityInfo.radius_km.urban) {
      setCoverageRadius(facilityInfo.radius_km.urban[1]); // Используем максимальный радиус
    } else {
      setCoverageRadius(2); // Дефолтное значение
    }
  };

  const handleFacilityTypeChange = (type) => {
    setSelectedFacilityType(type);
    updateCoverageRadius(type);
    
    // Автоматически запускаем анализ при изменении типа учреждения
    if (mapBounds) {
      loadFacilitiesData(type, mapBounds);
    }
  };

  const handleMapBoundsChange = (bounds) => {
    setMapBounds(bounds);
    
    // При первой загрузке и изменении границ карты - загружаем данные
    if (selectedFacilityType && !facilities.length) {
      loadFacilitiesData(selectedFacilityType, bounds);
    }
  };

  // Выделим загрузку данных в отдельную функцию
  const loadFacilitiesData = async (facilityType, bounds) => {
    if (!bounds) return;

    setIsAnalysisLoading(true);
    try {
      // Используем API класс для получения данных
      let data;
      if (facilityType === 'all') {
        // Получаем все типы учреждений для карты
        data = await api.getMapFacilities(bounds);
      } else {
        // Получаем учреждения выбранного типа
        data = await api.getFacilities(facilityType, bounds);
      }
      
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const handleRunAnalysis = () => {
    if (!mapBounds) return;
    loadFacilitiesData(selectedFacilityType, mapBounds);
  };

  const handleGetRecommendations = async () => {
    if (!mapBounds) return;
    
    setIsAnalysisLoading(true);
    try {
      // Используем метод из API вместо прямого fetch
      const recommendationsData = await api.getRecommendations(
        selectedFacilityType, 
        mapBounds,
        true // использовать AI для генерации рекомендаций
      );
      
      // Установка полученных рекомендаций
      if (recommendationsData && recommendationsData.locations) {
        setRecommendations(recommendationsData.locations);
        // Показываем количество полученных рекомендаций
        console.log(`Получено ${recommendationsData.locations.length} рекомендаций`);
      } else {
        console.error('Invalid recommendations data format', recommendationsData);
        setRecommendations([]);
        alert('Не удалось получить рекомендации. Проверьте консоль для деталей.');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setRecommendations([]);
      alert(`Ошибка при получении рекомендаций: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // Инициализация радиуса при первой загрузке
  useEffect(() => {
    updateCoverageRadius(selectedFacilityType);
  }, []);

  return (
    <Router>
      <div className="App">
        <Header />
        <div className="app-container">
          <Routes>
            <Route path="/" element={
              <>
                <Sidebar 
                  selectedFacilityType={selectedFacilityType}
                  onFacilityTypeChange={handleFacilityTypeChange}
                  onRunAnalysis={handleRunAnalysis}
                  onGetRecommendations={handleGetRecommendations}
                  isLoading={isAnalysisLoading}
                />
                <main className="main-content">
                  <MapView 
                    facilities={facilities}
                    recommendations={recommendations}
                    onBoundsChange={handleMapBoundsChange}
                    facilityType={selectedFacilityType}
                    coverageRadius={coverageRadius}
                  />
                </main>
              </>
            } />
            <Route path="/population" element={<PopulationPage />} />
            <Route path="/hexmap" element={
              <React.Suspense fallback={<div>Загрузка карты гексагонов...</div>}>
                <HexagonMap />
              </React.Suspense>
            } />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
        <FacilityPanel />
      </div>
    </Router>
  );
}

export default App;
