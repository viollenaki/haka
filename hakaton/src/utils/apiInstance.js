import Api from './api';

// Базовый URL для API
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

// Создаем экземпляр API
const api = new Api(BASE_URL);

export default api;
