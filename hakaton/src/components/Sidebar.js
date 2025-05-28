import React, { useState } from 'react';

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
  setHexagonOpacity
}) => {
  const [activeTab, setActiveTab] = useState('facilities'); // facilities, population, hexagons

  return (
    <div className="sidebar">
      <h2>Параметры анализа</h2>
      
      {/* Вкладки */}
      <div className="sidebar-tabs">
        <button 
          className={`tab-button ${activeTab === 'facilities' ? 'active' : ''}`}
          onClick={() => setActiveTab('facilities')}
        >
          Объекты инфраструктуры
        </button>
        <button 
          className={`tab-button ${activeTab === 'population' ? 'active' : ''}`}
          onClick={() => setActiveTab('population')}
        >
          Тепловая карта
        </button>
        <button 
          className={`tab-button ${activeTab === 'hexagons' ? 'active' : ''}`}
          onClick={() => setActiveTab('hexagons')}
        >
          Гексагоны
        </button>
      </div>
      
      {/* Содержимое вкладки объектов инфраструктуры */}
      {activeTab === 'facilities' && (
        <div className="tab-content">
          <div className="facility-type-selector">
            <h3>Тип учреждения</h3>
            <div>
              <label>
                <input 
                  type="radio" 
                  name="facilityType" 
                  value="school"
                  checked={selectedFacilityType === 'school'}
                  onChange={() => onFacilityTypeChange('school')}
                />
                Школы
              </label>
            </div>
            <div>
              <label>
                <input 
                  type="radio" 
                  name="facilityType" 
                  value="hospital"
                  checked={selectedFacilityType === 'hospital'}
                  onChange={() => onFacilityTypeChange('hospital')}
                />
                Больницы
              </label>
            </div>
            <div>
              <label>
                <input 
                  type="radio" 
                  name="facilityType" 
                  value="clinic"
                  checked={selectedFacilityType === 'clinic'}
                  onChange={() => onFacilityTypeChange('clinic')}
                />
                Клиники
              </label>
            </div>
            <div>
              <label>
                <input 
                  type="radio" 
                  name="facilityType" 
                  value="kindergarten"
                  checked={selectedFacilityType === 'kindergarten'}
                  onChange={() => onFacilityTypeChange('kindergarten')}
                />
                Детские сады
              </label>
            </div>
            <div>
              <label>
                <input 
                  type="radio" 
                  name="facilityType" 
                  value="college"
                  checked={selectedFacilityType === 'college'}
                  onChange={() => onFacilityTypeChange('college')}
                />
                Колледжи
              </label>
            </div>
            <div>
              <label>
                <input 
                  type="radio" 
                  name="facilityType" 
                  value="university"
                  checked={selectedFacilityType === 'university'}
                  onChange={() => onFacilityTypeChange('university')}
                />
                Университеты
              </label>
            </div>
          </div>
          
          <button 
            className="btn" 
            onClick={onRunAnalysis}
            disabled={isLoading}
          >
            {isLoading ? 'Загрузка...' : 'Показать текущие учреждения'}
          </button>
          
          <button 
            className="btn" 
            onClick={onGetRecommendations}
            style={{ marginTop: '20px', backgroundColor: '#2196F3' }}
            disabled={isLoading}
          >
            Получить рекомендации
          </button>
          
          <div className="info-box" style={{ marginTop: '20px', fontSize: '14px' }}>
            <h3>Информация</h3>
            <p>
              Выберите тип учреждения и область на карте, затем нажмите кнопку "Показать текущие учреждения", 
              чтобы загрузить данные о существующих объектах.
            </p>
            <p>
              Нажмите "Получить рекомендации", чтобы система проанализировала данные и предложила оптимальные места 
              для строительства новых объектов.
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
                  onChange={() => setShowHexagons(!showHexagons)}
                />
                <span className="label-text">Показать гексагоны населения</span>
              </label>
            </div>
            
            {showHexagons && (
              <>
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
                  <h4>Легенда плотности:</h4>
                  <div className="hexagon-gradient">
                    <div className="gradient-bar"></div>
                    <div className="gradient-labels">
                      <span>Низкая</span>
                      <span>Высокая</span>
                    </div>
                  </div>
                </div>
                
                <div className="info-box">
                  <h3>О гексагонах</h3>
                  <p>
                    Гексагональная сетка H3 используется для визуализации плотности населения. 
                    Каждый гексагон представляет территорию с соответствующим количеством жителей.
                  </p>
                  <p>
                    Цветовая шкала отражает количество населения: от синего (меньше всего) 
                    до красного (больше всего).
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
