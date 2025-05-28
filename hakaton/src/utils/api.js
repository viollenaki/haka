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
      const response = await this.client.get(`/facilities/type/${facilityType}`, {
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
   * @param {boolean} useAI Использовать ли AI для получения рекомендаций
   * @returns {Promise<Object>} Объект с рекомендациями
   */
  async getRecommendations(facilityType, bounds, useAI = false) {
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
          params: { use_openai: useAI }
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
        console.error('API Error:', apiError);
        if (apiError.response) {
          console.error('Response data:', apiError.response.data);
          console.error('Response status:', apiError.response.status);
        }
        throw new Error(apiError.response?.data?.detail || 'Ошибка сервера при получении рекомендаций');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      
      // Временный мок для разработки
      return {
        locations: this._mockRecommendations(bounds, 3 + Math.floor(Math.random() * 3)),
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
    try {
      const response = await this.client.get('/facilities/', {
        params: {
          min_lat: bounds.south,
          min_lon: bounds.west,
          max_lat: bounds.north,
          max_lon: bounds.east
        }
      });
      
      // Отфильтровать только нужные типы объектов
      const validTypes = ['school', 'clinic', 'hospital', 'college', 'kindergarten', 'university'];
      return response.data.filter(facility => validTypes.includes(facility.facility_type));
    } catch (error) {
      console.error('Error fetching map facilities:', error);
      
      // Генерируем мок-данные разных типов
      const allFacilities = [];
      const types = ['school', 'clinic', 'hospital', 'college', 'kindergarten', 'university'];
      
      types.forEach(type => {
        const count = 2 + Math.floor(Math.random() * 5); // 2-6 объектов каждого типа
        const facilities = this._mockFacilities(type, bounds, count);
        allFacilities.push(...facilities);
      });
      
      return allFacilities;
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

const api = new Api(API_URL);
export default api;
