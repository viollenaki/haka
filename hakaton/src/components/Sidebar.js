import React from 'react';

const Sidebar = ({ 
  selectedFacilityType, 
  onFacilityTypeChange, 
  onRunAnalysis, 
  onGetRecommendations,
  isLoading
}) => {
  return (
    <div className="sidebar">
      <h2>Параметры анализа</h2>
      
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
  );
};

export default Sidebar;
