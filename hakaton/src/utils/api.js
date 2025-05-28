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
      const response = await fetch('/bishkek_filtered.geojson', {
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
   * Загружает данные о населении в формате гексагонов (Н3) из GeoJSON файла
   * @returns {Promise<Object>} GeoJSON объект с данными о населении
   */
  async getPopulationHexagons() {
    const requestKey = 'getPopulationHexagons';
    
    try {
      const response = await fetch('/bishkek_filtered.geojson', {
        signal: this._createAbortSignal(requestKey)
      });
      
      if (!response.ok) {
        throw new Error('Failed to load population hexagon data');
      }
      
      const geojsonData = await response.json();
      
      // Координаты в geojson в формате WebMercator (EPSG:3857), 
      // преобразуем их в lat/lng для Leaflet (EPSG:4326)
      if (geojsonData.features) {
        geojsonData.features = geojsonData.features.map(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            feature.geometry.coordinates = [feature.geometry.coordinates[0].map(coord => {
              const latLng = this._webMercatorToLatLng(coord[0], coord[1]);
              return [latLng.lng, latLng.lat]; // GeoJSON формат [lng, lat]
            })];
          }
          return feature;
        });
      }
      
      return geojsonData;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Request ${requestKey} canceled`);
        return { type: "FeatureCollection", features: [] };
      }
      
      this._logError('getPopulationHexagons', error);
      return { type: "FeatureCollection", features: [] };
    }
  }

  /**
   * Преобразует данные GeoJSON в формат для тепловой карты
   * @private
   * @param {Object} geojsonData Данные в формате GeoJSON
   * @returns {Array} Массив точек для тепловой карты
   */
  _convertGeoJsonToHeatmap(geojsonData) {
    const heatmapData = [];
    
    geojsonData.features.forEach(feature => {
      if (feature.geometry && feature.geometry.type === 'Polygon' && feature.properties.population) {
        // Вычисляем центр полигона
        const coordinates = feature.geometry.coordinates[0];
        
        // Для простоты берем первую точку полигона как приближение
        // В идеале нужно вычислить центроид
        const point = this._calculatePolygonCenter(coordinates);
        
        heatmapData.push({
          lat: point.lat,
          lng: point.lng,
          intensity: feature.properties.population
        });
      }
    });
    
    return heatmapData;
  }
  
  /**
   * Вычисляет центр полигона по его координатам
   * @private
   * @param {Array} coordinates Массив координат полигона
   * @returns {Object} Объект с широтой и долготой центра
   */
  _calculatePolygonCenter(coordinates) {
    // Простое вычисление среднего значения координат
    const sumLat = coordinates.reduce((sum, coord) => sum + parseFloat(coord[1]), 0);
    const sumLng = coordinates.reduce((sum, coord) => sum + parseFloat(coord[0]), 0);
    
    return {
      lat: sumLat / coordinates.length,
      lng: sumLng / coordinates.length
    };
  }
  
  /**
   * Конвертирует координаты из WebMercator (EPSG:3857) в LatLng (EPSG:4326)
   * @private
   * @param {number} x Координата X в WebMercator
   * @param {number} y Координата Y в WebMercator
   * @returns {Object} Объект с координатами {lat, lng}
   */
  _webMercatorToLatLng(x, y) {
    const earthRadius = 6378137; // Радиус Земли в метрах
    
    // Конвертируем x координату из метров в радианы
    const lng = (x / earthRadius) * (180 / Math.PI);
    
    // Конвертируем y координату из метров в радианы
    const lat = (Math.atan(Math.exp(y / earthRadius)) - (Math.PI / 4)) * 2 * (180 / Math.PI);
    
    return { lat, lng };
  }
}

// Экспортируем класс Api по умолчанию
export default Api;
