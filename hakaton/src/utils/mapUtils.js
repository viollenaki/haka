import { COVERAGE_RADIUS } from '../constants/facilities';

/**
 * Создает слои с зонами охвата для объектов инфраструктуры
 * @param {Array} data Данные о объектах инфраструктуры
 * @returns {Array} Массив слоев с зонами охвата
 */
export const createCoverageLayers = (data) => {
  if (!data || !data.length) return [];
  
  return data.map(facility => {
    const type = facility.type || 'default';
    const radius = COVERAGE_RADIUS[type] || 2;
    
    return {
      center: [facility.latitude, facility.longitude],
      type: type,
      name: facility.name || `Объект ${type}`,
      minRadius: (radius * 0.5) * 1000, // Минимальный радиус в метрах
      maxRadius: radius * 1000, // Максимальный радиус в метрах
      notes: facility.notes
    };
  });
};

/**
 * Проверяет, находится ли точка в пределах города или полигона
 * @param {Array} point Координаты точки [lon, lat]
 * @param {Array} polygon Массив координат полигона [[lon, lat], [lon, lat], ...]
 * @returns {boolean} true если точка внутри полигона
 */
export const isPointInPolygon = (point, polygon) => {
  // Алгоритм ray casting
  const x = point[0];
  const y = point[1];
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};
