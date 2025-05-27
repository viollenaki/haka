/**
 * Набор утилит для работы с картами
 */

/**
 * Рассчитывает дистанцию между двумя точками в метрах (формула гаверсинусов)
 * @param {number} lat1 Широта первой точки
 * @param {number} lon1 Долгота первой точки
 * @param {number} lat2 Широта второй точки
 * @param {number} lon2 Долгота второй точки
 * @returns {number} Расстояние в метрах
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // радиус Земли в метрах
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Генерирует гексагональную сетку для заданной области
 * @param {Object} bounds Границы области
 * @param {number} cellSize Размер ячейки в метрах
 * @returns {Array} Массив гексагонов
 */
export const generateHexGrid = (bounds, cellSize = 1000) => {
  const { north, south, east, west } = bounds;
  
  // Рассчитываем приблизительное количество шагов по широте и долготе
  const latStep = cellSize / 111111; // 111111 метров в градусе по широте (приблизительно)
  const lonStep = cellSize / (111111 * Math.cos(((north + south) / 2) * Math.PI / 180));
  
  const hexagons = [];
  
  // Создаем сетку с небольшим смещением для каждого второго ряда
  for (let lat = south; lat <= north; lat += latStep * 0.75) {
    const row = Math.floor((lat - south) / (latStep * 0.75));
    const offset = row % 2 === 0 ? 0 : lonStep / 2;
    
    for (let lon = west + offset; lon <= east; lon += lonStep) {
      // Создаем гексагон
      const center = { lat, lng: lon };
      hexagons.push({
        center,
        // В реальном приложении здесь бы создавались вершины гексагона
      });
    }
  }
  
  return hexagons;
};

/**
 * Конвертирует GeoJSON в формат, подходящий для React-Leaflet
 * @param {Object} geojson Данные в формате GeoJSON
 * @returns {Array} Массив объектов для отображения на карте
 */
export const convertGeoJSON = (geojson) => {
  if (!geojson || !geojson.features) return [];
  
  return geojson.features.map(feature => {
    const { geometry, properties } = feature;
    
    if (geometry.type === 'Point') {
      return {
        type: 'point',
        latitude: geometry.coordinates[1],
        longitude: geometry.coordinates[0],
        properties
      };
    }
    
    if (geometry.type === 'Polygon') {
      return {
        type: 'polygon',
        coordinates: geometry.coordinates[0].map(coord => [coord[1], coord[0]]),
        properties
      };
    }
    
    return null;
  }).filter(item => item !== null);
};

/**
 * Создает цветовую палитру для значений плотности
 * @param {number} min Минимальное значение
 * @param {number} max Максимальное значение
 * @returns {Function} Функция, возвращающая цвет для значения
 */
export const createColorScale = (min, max) => {
  const colors = ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'];
  
  return (value) => {
    if (value <= min) return colors[0];
    if (value >= max) return colors[colors.length - 1];
    
    const normalizedValue = (value - min) / (max - min);
    const index = Math.min(colors.length - 1, Math.floor(normalizedValue * colors.length));
    return colors[index];
  };
};
