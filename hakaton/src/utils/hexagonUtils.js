/**
 * Утилиты для работы с гексагональными данными о населении
 */

/**
 * Получает цвет для гексагона в зависимости от плотности населения
 * @param {number} population Количество населения в гексагоне
 * @param {number} maxPopulation Максимальное значение населения (для нормализации)
 * @returns {string} Цвет в формате hex
 */
export const getHexagonColor = (population, maxPopulation = 20000) => {
  // Нормализуем значение между 0 и 1
  const normalizedValue = Math.min(population / maxPopulation, 1);
  
  // Цветовая схема от синего (низкая плотность) к красному (высокая плотность)
  if (normalizedValue < 0.2) {
    return '#0571b0'; // Синий
  } else if (normalizedValue < 0.4) {
    return '#6baed6'; // Голубой
  } else if (normalizedValue < 0.6) {
    return '#74c476'; // Зеленый
  } else if (normalizedValue < 0.8) {
    return '#fd8d3c'; // Оранжевый
  } else {
    return '#de2d26'; // Красный
  }
};

/**
 * Получает стиль для гексагона в зависимости от плотности населения
 * @param {number} population Количество населения в гексагоне
 * @param {number} maxPopulation Максимальное значение населения (для нормализации)
 * @param {number} opacity Непрозрачность гексагона (0-1)
 * @returns {Object} Объект стиля для React Leaflet
 */
export const getHexagonStyle = (population, maxPopulation = 20000, opacity = 0.7) => {
  const color = getHexagonColor(population, maxPopulation);
  
  return {
    fillColor: color,
    weight: 1,
    opacity: opacity,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.7
  };
};

/**
 * Вычисляет максимальное значение населения среди гексагонов
 * @param {Array} features Массив GeoJSON-объектов с полем population
 * @returns {number} Максимальное значение населения
 */
export const getMaxPopulation = (features) => {
  if (!features || features.length === 0) return 1000;
  
  return Math.max(...features.map(feature => 
    feature.properties && feature.properties.population ? feature.properties.population : 0
  ));
};

/**
 * Подготавливает данные о гексагонах из GeoJSON
 * @param {Object} geojson GeoJSON объект с данными о гексагонах
 * @returns {Object} Объект с массивом features и maxPopulation
 */
export const prepareHexagonData = (geojson) => {
  if (!geojson || !geojson.features) {
    return { features: [], maxPopulation: 1000 };
  }
  
  // Фильтруем только валидные фичи с населением
  const validFeatures = geojson.features.filter(
    feature => feature.properties && 
    feature.properties.population !== undefined && 
    feature.geometry && 
    feature.geometry.type === 'Polygon'
  );
  
  // Находим максимальное население
  const maxPopulation = getMaxPopulation(validFeatures);
  
  return {
    features: validFeatures,
    maxPopulation
  };
};
