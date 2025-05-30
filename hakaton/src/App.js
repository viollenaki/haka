import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';



import Header from './components/Header/Header.js';
import Sidebar from './components/SideBar/Sidebar.js';
import MapView from './components/MapView';
import AboutPage from './pages/AboutPage/AboutPage.js';
import PopulationPage from './pages/PopulationPage';
import HexagonMap from './components/HexagonMap';
import LoadingOverlay from './components/LoadingOverlay';

// Импорт вспомогательных файлов
import api from './utils/apiInstance';
import radiusData from './radius.json';
// Импортируем наши данные о гексагонах напрямую
import geojsonData from './bishkek_filtered.geojson.js';

function App() {
  const [selectedFacilityType, setSelectedFacilityType] = useState('school');
  const [mapBounds, setMapBounds] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [coverageRadius, setCoverageRadius] = useState(2);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapIntensity, setHeatmapIntensity] = useState(70);
  
  // Добавляем состояние для гексагонов
  const [showHexagons, setShowHexagons] = useState(false);
  const [hexagonOpacity, setHexagonOpacity] = useState(0.7);
  const [hexagonData, setHexagonData] = useState(null);

  // Новое состояние для режима гексагонов (когда видны только гексагоны)
  const [hexagonMode, setHexagonMode] = useState(false);

  // Состояние для сообщения загрузки AI
  const [aiLoadingMessage, setAiLoadingMessage] = useState("");
  
  // Отдельное состояние для отслеживания загрузки AI рекомендаций
  const [isAILoading, setIsAILoading] = useState(false);

  // Состояние для добавленных пользователем объектов
  const [userAddedFacilities, setUserAddedFacilities] = useState([]);

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
    
    // Очищаем предыдущие данные при смене типа учреждения
    setFacilities([]);
    setRecommendations([]);
    
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
    
    // Используем отдельный флаг для загрузки AI вместо общего isAnalysisLoading
    setIsAILoading(true);
    setAiLoadingMessage("Анализируем данные для оптимального размещения объектов...");
    
    try {
      // Имитация более долгой загрузки для демонстрации анимации
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Используем метод из API вместо прямого fetch
      const recommendationsData = await api.getRecommendations(
        selectedFacilityType, 
        mapBounds,
        true // использовать AI для генерации рекомендаций
      );
      
      // Установка полученных рекомендаций с добавлением типа учреждения
      if (recommendationsData && recommendationsData.locations) {
        setAiLoadingMessage("Визуализируем рекомендуемые места...");
        await new Promise(resolve => setTimeout(resolve, 500)); // Небольшая задержка для UX
        
        const locationsWithType = recommendationsData.locations.map(loc => ({
          ...loc,
          type: selectedFacilityType // Добавляем тип учреждения к каждой рекомендации
        }));
        setRecommendations(locationsWithType);
        
        // Показываем количество полученных рекомендаций
        console.log(`Получено ${locationsWithType.length} рекомендаций`);
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
      setIsAILoading(false);
    }
  };

  // Функция для загрузки данных гексагонов
  const loadHexagonData = async () => {
    if (showHexagons) {
      setIsAnalysisLoading(true);
      try {
        // Попробуем сначала загрузить через API
        try {
          const data = await api.getPopulationHexagons();
          setHexagonData(data);
          console.log(`Загружено ${data.features?.length || 0} гексагонов из API`);
        } catch (apiError) {
          console.warn("Не удалось загрузить гексагоны через API, используем локальные данные:", apiError);
          
          // Если API не сработал, используем локальные данные
          setHexagonData(geojsonData);
          console.log(`Загружено ${geojsonData.features?.length || 0} гексагонов из локального файла`);
        }
      } catch (error) {
        console.error('Error fetching hexagon data:', error);
        // В случае ошибки используем локальные данные
        setHexagonData(geojsonData);
      } finally {
        setIsAnalysisLoading(false);
      }
    }
  };
  
  // Обработчик переключения режима гексагонов
  const handleHexagonModeToggle = (enabled) => {
    setShowHexagons(enabled);
    setHexagonMode(enabled); // Устанавливаем режим гексагонов
    
    if (enabled && !hexagonData) {
      loadHexagonData();
    }
  };
  
  const handleFacilityAdded = (newFacility) => {
    console.log('New facility added:', newFacility);
    // Добавляем новый объект в массив добавленных пользователем объектов
    setUserAddedFacilities(prev => [...prev, newFacility]);
  };
  
  // Функция для очистки всех добавленных пользователем точек
  const handleClearUserFacilities = () => {
    setUserAddedFacilities([]);
  };
  
  // Инициализация радиуса при первой загрузке
  useEffect(() => {
    updateCoverageRadius(selectedFacilityType);
  }, []);

  // Вызываем загрузку гексагонов при изменении showHexagons
  useEffect(() => {
    if (showHexagons) {
      loadHexagonData();
    }
  }, [showHexagons]);

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
                  showHeatmap={showHeatmap}
                  setShowHeatmap={setShowHeatmap}
                  heatmapIntensity={heatmapIntensity}
                  setHeatmapIntensity={setHeatmapIntensity}
                  showHexagons={showHexagons}
                  setShowHexagons={handleHexagonModeToggle}
                  hexagonOpacity={hexagonOpacity}
                  setHexagonOpacity={setHexagonOpacity}
                  onHexagonLayerToggle={() => loadHexagonData()}
                  onClearUserFacilities={handleClearUserFacilities}
                  hasUserAddedFacilities={userAddedFacilities.length > 0}
                />
                <main className="main-content">
                  <MapView 
                    facilities={facilities}
                    recommendations={recommendations}
                    onBoundsChange={handleMapBoundsChange}
                    facilityType={selectedFacilityType}
                    coverageRadius={coverageRadius}
                    showHeatmap={showHeatmap && !hexagonMode}
                    heatmapIntensity={heatmapIntensity}
                    showHexagons={showHexagons}
                    hexagonOpacity={hexagonOpacity}
                    hexagonData={hexagonData}
                    hexagonMode={hexagonMode}
                    allowFacilityDrop={true}
                    onFacilityAdded={handleFacilityAdded}
                    userAddedFacilities={userAddedFacilities}
                    clearUserFacilities={handleClearUserFacilities}
                  />
                  <LoadingOverlay 
                    visible={isAILoading} 
                    message={aiLoadingMessage}
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
      </div>
    </Router>
  );
}

export default App;
