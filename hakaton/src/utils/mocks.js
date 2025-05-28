/**
 * Модуль с функциями генерации мок-данных для разработки
 */

/**
 * Генерирует мок-данные учреждений для разработки
 * @param {string} type Тип учреждения
 * @param {Object} bounds Границы карты {north, south, east, west}
 * @param {number} count Количество объектов для генерации
 * @returns {Array} Массив объектов учреждений
 */
export const mockFacilities = (type, bounds, count) => {
  const facilities = [];
  const { north, south, east, west } = bounds || { 
    north: 42.9, south: 42.8, east: 74.7, west: 74.5 
  };
  
  for (let i = 0; i < count; i++) {
    facilities.push({
      id: i + 1,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} #${i + 1}`,
      type,
      latitude: south + Math.random() * (north - south),
      longitude: west + Math.random() * (east - west),
      address: `ул. Примерная, д. ${Math.floor(Math.random() * 100) + 1}`
    });
  }
  
  return facilities;
};

/**
 * Генерирует мок-данные о плотности населения для разработки
 * @param {Object} bounds Границы карты {north, south, east, west}
 * @param {number} count Количество точек для генерации
 * @returns {Array} Массив точек плотности населения
 */
export const mockPopulationDensity = (bounds, count) => {
  const points = [];
  const { north, south, east, west } = bounds || { 
    north: 42.9, south: 42.8, east: 74.7, west: 74.5 
  };
  
  for (let i = 0; i < count; i++) {
    points.push({
      lat: south + Math.random() * (north - south),
      lng: west + Math.random() * (east - west),
      intensity: Math.random() * 100
    });
  }
  
  return points;
};

/**
 * Генерирует мок-данные рекомендаций для разработки
 * @param {Object} bounds Границы карты {north, south, east, west}
 * @param {number} count Количество рекомендаций для генерации
 * @returns {Array} Массив рекомендованных локаций
 */
export const mockRecommendations = (bounds, count) => {
  const recommendations = [];
  const { north, south, east, west } = bounds || { 
    north: 42.9, south: 42.8, east: 74.7, west: 74.5 
  };
  
  for (let i = 0; i < count; i++) {
    recommendations.push({
      latitude: south + Math.random() * (north - south),
      longitude: west + Math.random() * (east - west),
      score: 0.7 + Math.random() * 0.29,
      reason: `Высокая концентрация населения, отсутствие подобных объектов в радиусе ${Math.round(Math.random() * 4) + 1} км`
    });
  }
  
  return recommendations;
};
