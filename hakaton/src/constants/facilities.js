/**
 * Единые константы для объектов инфраструктуры
 */

// Радиусы охвата для разных типов объектов (в км)
export const COVERAGE_RADIUS = {
  school: 2,
  hospital: 3,
  clinic: 2,
  kindergarten: 1.5,
  college: 2,
  university: 3,
  fire_station: 3
};

// Цвета для разных типов объектов
export const FACILITY_COLORS = {
  school: '#4CAF50',       // Зеленый
  hospital: '#F44336',     // Красный
  clinic: '#FF9800',       // Оранжевый
  kindergarten: '#9C27B0', // Фиолетовый
  college: '#2196F3',      // Синий
  university: '#3F51B5',   // Индиго
  fire_station: '#FF5722'  // Красно-оранжевый
};

// Более яркие цвета для рекомендуемых объектов
export const RECOMMENDATION_COLORS = {
  school: '#FF3D3D',       // Ярко-красный
  hospital: '#FF1C1C',     // Насыщенный красный
  clinic: '#FF5252',       // Светло-красный
  kindergarten: '#FF0000', // Чистый красный
  college: '#E60000',      // Темно-красный
  university: '#FF6666',   // Розово-красный
  fire_station: '#CC0000'  // Глубокий красный
};

// Русские названия типов объектов
export const FACILITY_NAMES = {
  school: 'Школа',
  hospital: 'Больница',
  clinic: 'Клиника',
  kindergarten: 'Детский сад',
  college: 'Колледж',
  university: 'Университет',
  fire_station: 'Пожарная станция'
};
