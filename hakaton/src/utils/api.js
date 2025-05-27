import axios from 'axios';

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
  }

  /**
   * Получает список учреждений заданного типа в указанных границах
   * @param {string} facilityType Тип учреждения ('school', 'hospital', 'fire_station')
   * @param {Object} bounds Границы области {north, south, east, west}
   * @returns {Promise<Array>} Массив учреждений
   */
  async getFacilities(facilityType, bounds) {
    try {
      const response = await this.client.get(`/facilities/${facilityType}`, {
        params: {
          min_lat: bounds.south,
          min_lon: bounds.west,
          max_lat: bounds.north,
          max_lon: bounds.east
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching facilities:', error);
      
      // Временный мок для разработки
      return this._mockFacilities(facilityType, bounds, 5 + Math.floor(Math.random() * 10));
    }
  }

  /**
   * Получает данные о плотности населения
   * @param {Object} bounds Границы области {north, south, east, west}
   * @returns {Promise<Array>} Данные о плотности населения
   */
  async getPopulationDensity(bounds) {
    try {
      const response = await this.client.get('/population-density', {
        params: {
          min_lat: bounds.south,
          min_lon: bounds.west,
          max_lat: bounds.north,
          max_lon: bounds.east
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching population density:', error);
      
      // Временный мок для разработки
      return this._mockPopulationDensity(bounds, 200);
    }
  }

  /**
   * Получает рекомендации для размещения новых учреждений
   * @param {string} facilityType Тип учреждения
   * @param {Object} bounds Границы области {north, south, east, west}
   * @returns {Promise<Object>} Объект с рекомендациями
   */
  async getRecommendations(facilityType, bounds) {
    try {
      const response = await this.client.post('/recommend', {
        facility_type: facilityType,
        area_bounds: {
          min_lat: bounds.south,
          min_lon: bounds.west,
          max_lat: bounds.north,
          max_lon: bounds.east
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      
      // Временный мок для разработки
      return {
        locations: this._mockRecommendations(bounds, 3 + Math.floor(Math.random() * 3)),
        improvement_score: 25 + Math.random() * 50
      };
    }
  }

  // Вспомогательные методы для создания мок-данных
  
  _mockFacilities(type, bounds, count) {
    const facilities = [];
    const { north, south, east, west } = bounds;
    
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
  }
  
  _mockPopulationDensity(bounds, count) {
    const points = [];
    const { north, south, east, west } = bounds;
    
    for (let i = 0; i < count; i++) {
      points.push({
        lat: south + Math.random() * (north - south),
        lng: west + Math.random() * (east - west),
        intensity: Math.random() * 100
      });
    }
    
    return points;
  }
  
  _mockRecommendations(bounds, count) {
    const recommendations = [];
    const { north, south, east, west } = bounds;
    
    for (let i = 0; i < count; i++) {
      recommendations.push({
        latitude: south + Math.random() * (north - south),
        longitude: west + Math.random() * (east - west),
        score: 0.7 + Math.random() * 0.29
      });
    }
    
    return recommendations;
  }
}

export default new Api(API_URL);
