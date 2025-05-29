import React, { useState } from 'react';
import './SideBar.css';


const Sidebar = ({ 
  selectedFacilityType, 
  onFacilityTypeChange, 
  onRunAnalysis, 
  onGetRecommendations,
  isLoading,
  showHeatmap, 
  setShowHeatmap,
  heatmapIntensity, 
  setHeatmapIntensity,
  showHexagons,
  setShowHexagons,
  hexagonOpacity,
  setHexagonOpacity,
  onHexagonLayerToggle
}) => {
  const [activeTab, setActiveTab] = useState('facilities');
  
  // Обработчик переключения вкладок
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Автоматически выключаем режим гексагонов при переходе на другую вкладку
    if (tab !== 'hexagons' && showHexagons) {
      setShowHexagons(false);
    }
    
    // Если выбрали вкладку гексагонов, вызываем загрузку данных
    if (tab === 'hexagons' && onHexagonLayerToggle) {
      onHexagonLayerToggle();
    }
  };

  // Функция для перетаскивания
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('facilityType', type);
  };

  const labels = {
    map: "Без слоев",
    school: "Школы",
    hospital: "Больницы",
    clinic: "Клиники",
    kindergarten: "Детские сады",
    college: "Колледжи",
    university: "Университеты",
    fire_station: "Пожарные станции"
  };

  return (
    <div className="sidebar">
      <h2>Параметры анализа</h2>
      
      {/* Вкладки */}
      <div className="sidebar-tabs">
        <button 
          className={`tab-button ${activeTab === 'facilities' ? 'active' : ''}`}
          onClick={() => handleTabChange('facilities')}
        >
          Объекты инфраструктуры
        </button>

        <button 
          className={`tab-button ${activeTab === 'hexagons' ? 'active' : ''}`}
          onClick={() => handleTabChange('hexagons')}
        >
          Гексагоны
        </button>
      </div>
      
      {/* Содержимое вкладки объектов инфраструктуры */}
      {activeTab === 'facilities' && (
        <div className="tab-content">
          <div className="facility-type-selector">
            <h3>Тип учреждения</h3>
            
            {/* Специальная опция "Без слоев" */}
            <div className="facility-row no-layers-option">
              <div className="facility-radio">
                <label className="no-layers-label">
                  <input 
                    type="radio" 
                    name="facilityType" 
                    value="map"
                    checked={selectedFacilityType === "map"}
                    onChange={() => onFacilityTypeChange("map")}
                  />
                  <span className="no-layers-text">{labels.map}</span>
                </label>
              </div>
            </div>
            
            <div className="separator"></div>
            
            {/* Остальные типы учреждений */}
            {Object.keys(labels).filter(type => type !== "map").map(type => (
              <div key={type} className="facility-row">
                <div className="facility-radio">
                  <label>
                    <input 
                      type="radio" 
                      name="facilityType" 
                      value={type}
                      checked={selectedFacilityType === type}
                      onChange={() => onFacilityTypeChange(type)}
                    />
                    {labels[type]}
                  </label>
                </div>
                <div 
                  className="facility-drag-button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, type)}
                  title={`Перетащите ${labels[type].toLowerCase()} на карту`}
                  data-type={type}
                >
                  <span className="drag-icon">+</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Оставляем только эту важную кнопку */}
          <button 
            className="btn" 
            onClick={onGetRecommendations}
            disabled={isLoading}
          >
            Получить рекомендации
          </button>
          
          <div className="info-box">
            <h3>Информация</h3>
            <p>
              Выберите тип учреждения для анализа или перетащите иконку "+" на карту, 
              чтобы смоделировать размещение нового учреждения.
            </p>
            <p>
              Нажмите "Получить рекомендации", чтобы система проанализировала данные и 
              предложила оптимальные места для строительства новых объектов.
            </p>
          </div>
        </div>
      )}
      
      {/* Содержимое вкладки тепловой карты населения */}
      {activeTab === 'population' && (
        <div className="tab-content">
          <h3>Настройки отображения</h3>
          
          <div className="heat-control-panel">
            <div className="control-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={() => setShowHeatmap(!showHeatmap)}
                />
                <span className="label-text">Показать плотность населения</span>
              </label>
            </div>
            
            {showHeatmap && (
              <>
                <div className="control-group">
                  <label htmlFor="intensity">Интенсивность отображения:</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      id="intensity"
                      min="0"
                      max="100"
                      value={heatmapIntensity}
                      onChange={(e) => setHeatmapIntensity(parseInt(e.target.value))}
                      className="range-slider"
                    />
                    <div className="slider-value">{heatmapIntensity}%</div>
                  </div>
                </div>
                
                <div className="legend-preview">
                  <h4>Легенда:</h4>
                  <div className="heatmap-gradient">
                    <div className="gradient-bar"></div>
                    <div className="gradient-labels">
                      <span>Низкая</span>
                      <span>Высокая</span>
                    </div>
                  </div>
                </div>
                
                <div className="info-box">
                  <h3>О данных</h3>
                  <p>
                    Тепловая карта отображает плотность населения на основе данных
                    переписи и геопространственного анализа. Более тёмные участки 
                    представляют районы с более высокой плотностью населения.
                  </p>
                  <p>
                    Используйте эти данные для определения областей, где доступ 
                    к социальной инфраструктуре особенно важен.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Содержимое вкладки гексагонов населения */}
      {activeTab === 'hexagons' && (
        <div className="tab-content">
          <h3>Гексагональная плотность населения</h3>
          
          <div className="heat-control-panel">
            <div className="control-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showHexagons}
                  onChange={() => {
                    const newValue = !showHexagons;
                    setShowHexagons(newValue); // Этот обработчик теперь переключает режим гексагонов
                  }}
                />
                <span className="label-text">Показать гексагоны населения</span>
              </label>
            </div>
            
            {showHexagons && (
              <>
                <div className="mode-info-box">
                  <p className="mode-info">
                    <i className="info-icon">ℹ️</i> Вы находитесь в режиме просмотра гексагонов. Другие слои временно скрыты.
                  </p>
                </div>
                
                <div className="control-group">
                  <label htmlFor="hexOpacity">Непрозрачность:</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      id="hexOpacity"
                      min="10"
                      max="100"
                      value={hexagonOpacity * 100}
                      onChange={(e) => setHexagonOpacity(parseInt(e.target.value) / 100)}
                      className="range-slider"
                    />
                    <div className="slider-value">{Math.round(hexagonOpacity * 100)}%</div>
                  </div>
                </div>
                
                <div className="legend-preview">
                  <h4>Легенда плотности населения:</h4>
                  <div className="hexagon-gradient-bar"></div>
                  <div className="hexagon-gradient-labels">
                    <span>Низкая</span>
                    <span>Высокая</span>
                  </div>
                </div>
                
                <div className="info-box">
                  <h4>О данных</h4>
                  <p>
                    Гексагональная сетка показывает плотность населения Бишкека. 
                    Цвет отражает количество населения: синий (низкое), 
                    зеленый (среднее), красный (высокое).
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
