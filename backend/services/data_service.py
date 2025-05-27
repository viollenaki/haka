import geopandas as gpd
import pandas as pd
import numpy as np
import osmnx as ox
from shapely.geometry import Point, Polygon
import requests
from typing import Dict, List, Tuple, Union

class DataService:
    def __init__(self):
        # Можно инициализировать подключения к базам данных или другие ресурсы
        pass
    
    def get_osm_facilities(self, facility_type: str, bounds: Dict[str, float]) -> gpd.GeoDataFrame:
        """
        Получает данные о существующих учреждениях из OpenStreetMap
        
        :param facility_type: Тип учреждения (например, 'school', 'hospital', 'fire_station')
        :param bounds: Границы области (min_lat, min_lon, max_lat, max_lon)
        :return: GeoDataFrame с учреждениями
        """
        # Создаем словарь тегов для разных типов учреждений
        tags: Dict[str, Dict[str, Union[bool, str, List[str]]]] = {
            'school': {'amenity': ['school']},
            'hospital': {'amenity': ['hospital']},
            'pharmacy': {'amenity': ['pharmacy']},
            'fire_station': {'amenity': ['fire_station']}
        }
        
        if facility_type not in tags:
            raise ValueError(f"Unsupported facility type: {facility_type}")
        
        # Получаем данные из OSM
        north, south, east, west = bounds['max_lat'], bounds['min_lat'], bounds['max_lon'], bounds['min_lon']
        gdf = ox.features.features_from_bbox((north, south, east, west), tags=tags[facility_type])
        
        if gdf.empty:
            return gpd.GeoDataFrame(geometry=[])
        
        # Преобразуем в более простой формат
        result = gpd.GeoDataFrame(geometry=gdf.geometry)
        if 'name' in gdf.columns:
            result['name'] = gdf['name']
        else:
            result['name'] = [f"{facility_type}_{i}" for i in range(len(gdf))]
        
        result['type'] = facility_type
        
        return result
    
    def get_population_density(self, bounds: Dict[str, float]) -> gpd.GeoDataFrame:
        """
        Получает данные о плотности населения
        
        :param bounds: Границы области (min_lat, min_lon, max_lat, max_lon)
        :return: GeoDataFrame с плотностью населения
        """
        # Здесь должен быть код для получения плотности населения
        # Например, через WorldPop API или местные источники данных
        # Для прототипа можно создать случайные данные
        
        # Создаем сетку
        x = np.linspace(bounds['min_lon'], bounds['max_lon'], 50)
        y = np.linspace(bounds['min_lat'], bounds['max_lat'], 50)
        xx, yy = np.meshgrid(x, y)
        
        # Генерируем случайные данные плотности
        density = np.random.exponential(scale=1000, size=xx.shape)
        
        # Создаем GeoDataFrame
        points = [Point(xi, yi) for xi, yi in zip(xx.flatten(), yy.flatten())]
        data = {'density': density.flatten()}
        return gpd.GeoDataFrame(data, geometry=points, crs="EPSG:4326")
    
    def find_optimal_locations(self, 
                              facility_type: str, 
                              bounds: Dict[str, float], 
                              existing_facilities: gpd.GeoDataFrame,
                              population: gpd.GeoDataFrame,
                              num_recommendations: int = 5) -> List[Dict]:
        """
        Находит оптимальные места для размещения новых учреждений
        
        :param facility_type: Тип учреждения
        :param bounds: Границы области
        :param existing_facilities: GeoDataFrame с существующими учреждениями
        :param population: GeoDataFrame с плотностью населения
        :param num_recommendations: Количество рекомендаций
        :return: Список словарей с координатами рекомендуемых мест
        """
        # Для прототипа вернем случайные точки
        # В настоящей системе здесь должен быть алгоритм оптимизации
        
        # Создаем полигон из границ
        polygon = Polygon([
            (bounds['min_lon'], bounds['min_lat']),
            (bounds['min_lon'], bounds['max_lat']),
            (bounds['max_lon'], bounds['max_lat']),
            (bounds['max_lon'], bounds['min_lat'])
        ])
        
        # Генерируем случайные точки внутри полигона
        recommendations = []
        while len(recommendations) < num_recommendations:
            minx, miny, maxx, maxy = polygon.bounds
            p = Point(np.random.uniform(minx, maxx), np.random.uniform(miny, maxy))
            if polygon.contains(p):
                recommendations.append({
                    'latitude': p.y,
                    'longitude': p.x,
                    'score': np.random.uniform(0.7, 0.99)  # Случайный скор
                })
        
        return recommendations
