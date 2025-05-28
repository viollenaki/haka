import axios from 'axios';
import { 
  mockFacilities, 
  mockPopulationDensity, 
  mockRecommendations 
} from './mocks';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

/**
 * Класс для работы с API
 */
class Api {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    this.cancelTokens = {};
  }

  /**
   * Валидирует параметры границ карты
   * @private
   * @param {Object} bounds Границы области {north, south, east, west}
   * @returns {boolean} Результат валидации
   */
  _validateBounds(bounds) {
    if (!bounds) return false;
    return ['north', 'south', 'east', 'west'].every(key => 
      typeof bounds[key] === 'number' && !isNaN(bounds[key])
    );
  }

  /**
   * Преобразует объект границ в параметры запроса
   * @private
   * @param {Object} bounds Границы области {north, south, east, west}
   * @returns {Object} Параметры для запроса
   */
  _getBoundsParams(bounds) {
    if (!this._validateBounds(bounds)) {
      throw new Error('Invalid bounds object');
    }
    
    return {
      min_lat: bounds.south,
      min_lon: bounds.west,
      max_lat: bounds.north,
      max_lon: bounds.east
    };
  }

  /**
   * Логирует ошибки API в консоль
   * @private
   * @param {string} context Контекст ошибки (название метода)
   * @param {Error} error Объект ошибки
   */
  _logError(context, error) {
    console.error(`[API:${context}]`, error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return error;
  }

  /**
   * Создает CancelToken для запроса и отменяет предыдущий, если он существует
   * @private
   * @param {string} key Уникальный ключ запроса
   * @returns {CancelToken} Токен для отмены запроса axios
   */
  _createCancelToken(key) {
    // Отменяем предыдущий запрос, если он существует
    if (this.cancelTokens[key]) {
      this.cancelTokens[key].cancel('Operation canceled due to new request');
    }
    
    // Создаем новый токен
    const source = axios.CancelToken.source();
    this.cancelTokens[key] = source;
    
    return source.token;
  }

  /**
   * Получает список учреждений заданного типа в указанных границах
   * @param {string} facilityType Тип учреждения ('school', 'hospital', 'fire_station')
   * @param {Object} bounds Границы области {north, south, east, west}
   * @returns {Promise<Array>} Массив учреждений
   */
  async getFacilities(facilityType, bounds) {
    if (!facilityType) {
      throw new Error('Facility type is required');
    }
    
    if (!this._validateBounds(bounds)) {
      return mockFacilities(facilityType, bounds, 5 + Math.floor(Math.random() * 10));
    }
    
    const requestKey = `getFacilities-${facilityType}`;
    
    try {
      const response = await this.client.get(`/facilities/type/${facilityType}`, {
        params: this._getBoundsParams(bounds),
        cancelToken: this._createCancelToken(requestKey)
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log(`Request ${requestKey} canceled:`, error.message);
        return [];
      }
      
      this._logError('getFacilities', error);
      
      // Временный мок для разработки
      return mockFacilities(facilityType, bounds, 5 + Math.floor(Math.random() * 10));
    }
  }

  /**
   * Получает данные о плотности населения
   * @param {Object} bounds Границы области {north, south, east, west}
   * @returns {Promise<Array>} Данные о плотности населения
   */
  async getPopulationDensity(bounds) {
    if (!this._validateBounds(bounds)) {
      return mockPopulationDensity(bounds, 200);
    }
    
    const requestKey = 'getPopulationDensity';
    
    try {
      const response = await this.client.get('/population-density', {
        params: this._getBoundsParams(bounds),
        cancelToken: this._createCancelToken(requestKey)
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log(`Request ${requestKey} canceled:`, error.message);
        return [];
      }
      
      this._logError('getPopulationDensity', error);
      
      // Временный мок для разработки
      return mockPopulationDensity(bounds, 200);
    }
  }

  /**
   * Получает рекомендации для размещения новых учреждений
   * @param {string} facilityType Тип учреждения
   * @param {Object} bounds Границы области {north, south, east, west}
   * @param {boolean} useAI Использовать ли AI для получения рекомендаций
   * @returns {Promise<Object>} Объект с рекомендациями
   */
  async getRecommendations(facilityType, bounds, useAI = false) {
    if (!facilityType) {
      throw new Error('Facility type is required');
    }
    
    if (!this._validateBounds(bounds)) {
      return { 
        locations: mockRecommendations(bounds, 3 + Math.floor(Math.random() * 3)),
        improvement_score: 25 + Math.random() * 50
      };
    }
    
    const requestKey = `getRecommendations-${facilityType}`;
    
    try {
      const existingFacilities = await this.getFacilities(facilityType, bounds);
      
      // Формируем запрос с информацией о существующих объектах
      const requestBody = {
        target_facility_type: facilityType,
        area_information: {
          bounds: {
            north: bounds.north,
            south: bounds.south,
            east: bounds.east,
            west: bounds.west
          },
          center: {
            lat: (bounds.north + bounds.south) / 2,
            lng: (bounds.east + bounds.west) / 2
          },
          area_size_km2: this._calculateAreaSize(bounds)
        },
        existing_facilities: existingFacilities.map(facility => ({
          type: facility.type || facilityType,
          coordinates: [facility.longitude, facility.latitude],
          name: facility.name,
          coverage_radius: {"radius": 1.0} // Определяем стандартный радиус покрытия
        })),
        recommendations_count: 5,
        request_type: "optimal_placement"
      };
      
      console.log('Sending AI recommendation request:', JSON.stringify(requestBody).substring(0, 500) + '...');
      
      try {
        // Отправляем запрос к API
        const response = await this.client.post('/ai/recommend', requestBody, {
          params: { use_openai: useAI },
          cancelToken: this._createCancelToken(requestKey)
        });
        
        console.log('Received AI recommendation response:', response.data);
        
        // Преобразуем GeoJSON ответ в формат, понятный клиенту
        const features = response.data.features || [];
        return {
          locations: features.map(feature => ({
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            name: feature.properties.name || "Рекомендуемая локация",
            reason: feature.properties.reason || "Рекомендовано AI",
            score: feature.properties.score || 0.8
          })),
          improvement_score: response.data.improvement_score || 50
        };
      } catch (apiError) {
        throw this._logError('AI Recommendation', apiError);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log(`Request ${requestKey} canceled:`, error.message);
        return { locations: [], improvement_score: 0 };
      }
      
      this._logError('getRecommendations', error);
      
      // Временный мок для разработки
      return {
        locations: mockRecommendations(bounds, 3 + Math.floor(Math.random() * 3)),
        improvement_score: 25 + Math.random() * 50
      };
    }
  }
  
  /**
   * Вычисляет примерную площадь области в кв. км
   * @private
   * @param {Object} bounds Границы области
   * @returns {number} Площадь в кв. км
   */
  _calculateAreaSize(bounds) {
    const R = 6371; // Радиус Земли в км
    const dLat = (bounds.north - bounds.south) * Math.PI / 180;
    const dLon = (bounds.east - bounds.west) * Math.PI / 180;
    const lat1 = bounds.south * Math.PI / 180;
    const lat2 = bounds.north * Math.PI / 180;
    
    // Приближенная формула для небольших территорий
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * 
              Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const area = R * R * c;
    
    return Math.round(area * 10) / 10; // Округляем до 1 десятичного знака
  }

  /**
   * Получает список всех учреждений для карты в указанных границах
   * @param {Object} bounds Границы области {north, south, east, west}
   * @returns {Promise<Array>} Массив учреждений
   */
  async getMapFacilities(bounds) {
    if (!this._validateBounds(bounds)) {
      // Генерируем мок-данные разных типов
      const allFacilities = [];
      const types = ['school', 'clinic', 'hospital', 'college', 'kindergarten', 'university', 'fire_station'];
      
      types.forEach(type => {
        const count = 2 + Math.floor(Math.random() * 5); // 2-6 объектов каждого типа
        const facilities = mockFacilities(type, bounds, count);
        allFacilities.push(...facilities);
      });
      
      return allFacilities;
    }
    
    const requestKey = 'getMapFacilities';
    
    try {
      const response = await this.client.get('/facilities/', {
        params: this._getBoundsParams(bounds),
        cancelToken: this._createCancelToken(requestKey)
      });
      
      // Отфильтровать только нужные типы объектов
      const validTypes = ['school', 'clinic', 'hospital', 'college', 'kindergarten', 'university', 'fire_station'];
      return response.data.filter(facility => validTypes.includes(facility.facility_type));
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log(`Request ${requestKey} canceled:`, error.message);
        return [];
      }
      
      this._logError('getMapFacilities', error);
      
      // Генерируем мок-данные разных типов
      const allFacilities = [];
      const types = ['school', 'clinic', 'hospital', 'college', 'kindergarten', 'university', 'fire_station'];
      
      types.forEach(type => {
        const count = 2 + Math.floor(Math.random() * 5); // 2-6 объектов каждого типа
        const facilities = mockFacilities(type, bounds, count);
        allFacilities.push(...facilities);
      });
      
      return allFacilities;
    }
  }

  /**
   * Загружает данные о населении из GeoJSON файла
   * @returns {Promise<Array>} Данные о плотности населения
   */
  async loadPopulationData() {
    const requestKey = 'loadPopulationData';
    
    try {
      // Загрузка данных из локального файла
      const response = await fetch('/bishkek_filtered.geojson1.js', {
        signal: this._createAbortSignal(requestKey)
      });
      
      if (!response.ok) {
        throw new Error('Failed to load population data');
      }
      
      const geojsonData = await response.json();
      
      // Преобразование GeoJSON в формат, подходящий для тепловой карты
      const heatmapData = this._convertGeoJsonToHeatmap(geojsonData);
      
      return heatmapData;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Request ${requestKey} canceled`);
        return [];
      }
      
      this._logError('loadPopulationData', error);
      return mockPopulationDensity({
        north: 42.9, south: 42.8, east: 74.7, west: 74.5
      }, 200);
    }
  }
  
  /**
   * Создаёт AbortSignal для fetch запросов
   * @private
   * @param {string} key Уникальный ключ запроса
   * @returns {AbortSignal} Сигнал для отмены fetch запроса
   */
  _createAbortSignal(key) {
    // Отменяем предыдущий запрос, если он существует
    if (this.cancelTokens[key]) {
      this.cancelTokens[key].abort();
    }
    
    // Создаем новый контроллер
    const controller = new AbortController();
    this.cancelTokens[key] = controller;
    
    return controller.signal;
  }

  /**
   * Получает данные о гексагонах с плотностью населения
   * @returns {Promise<Object>} GeoJSON объект с гексагонами
   */
  async getPopulationHexagons() {
    const requestKey = 'getPopulationHexagons';
    
    try {
      const response = await this.client.get('/population/hexagons', {
        cancelToken: this._createCancelToken(requestKey)
      });
      
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log(`Request ${requestKey} canceled:`, error.message);
        return { type: "FeatureCollection", features: [] };
      }
      
      this._logError('getPopulationHexagons', error);
      
      // Используем мок-данные из существующей функции и преобразуем их в гексагоны
      const bounds = {
        north: 42.9,
        south: 42.8,
        east: 74.7,
        west: 74.5
      };
      
      const pointData = this.mockPopulationDensity(bounds, 100);
      return this._convertPointsToHexagons(pointData);
    }
  }

  /**
   * Преобразует точечные данные в гексагональную сетку
   * @private
   * @param {Array} points Массив точек с плотностью населения
   * @returns {Object} GeoJSON объект с гексагонами
   */
  _convertPointsToHexagons(points) {
    // Создаем гексагональную сетку на основе точек
    // Это упрощенная реализация для мок-данных
    const features = [];
    const hexSize = 0.01; // Примерный размер гексагона
    
    // Создаем сетку с уникальными ключами
    const grid = {};
    
    // Распределяем точки по гексагонам
    points.forEach(point => {
      // Округляем координаты для группировки в гексагоны
      const hexX = Math.round(point.lng / hexSize) * hexSize;
      const hexY = Math.round(point.lat / hexSize) * hexSize;
      const hexKey = `${hexX}-${hexY}`;
      
      if (!grid[hexKey]) {
        grid[hexKey] = {
          center: [hexX, hexY],
          population: 0
        };
      }
      
      // Увеличиваем население в гексагоне
      grid[hexKey].population += point.intensity;
    });
    
    // Преобразуем гексагоны в GeoJSON
    Object.values(grid).forEach((hex, index) => {
      // Создаем примерный шестиугольник вокруг центра
      const vertices = 6;
      const radius = hexSize * 0.8;
      const [centerX, centerY] = hex.center;
      const coordinates = [];
      
      for (let i = 0; i < vertices; i++) {
        const angle = (Math.PI / 3) * i;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        coordinates.push([x, y]);
      }
      
      // Замыкаем полигон
      coordinates.push(coordinates[0]);
      
      // Создаем GeoJSON Feature
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        },
        properties: {
          h3: `mock-hex-${index}`,
          population: Math.round(hex.population)
        }
      });
    });
    
    return {
      type: 'FeatureCollection',
      features: features
    };
  }
}

// Экспортируем класс Api по умолчанию
export default Api;
