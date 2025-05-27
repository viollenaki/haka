import geopandas as gpd
import pandas as pd
import numpy as np
from shapely.geometry import Point, LineString
from typing import Dict, List, Tuple
import osmnx as ox
from sklearn.cluster import DBSCAN
import h3
from rtree import index

class AnalysisService:
    def __init__(self):
        pass
    
    def calculate_access_areas(self, 
                              facilities: gpd.GeoDataFrame, 
                              max_distance: float = 5000) -> gpd.GeoDataFrame:
        """
        Рассчитывает зоны доступности вокруг существующих учреждений
        
        :param facilities: GeoDataFrame с учреждениями
        :param max_distance: Максимальное расстояние в метрах
        :return: GeoDataFrame с буферными зонами
        """
        # Проецируем в метрическую СК для расчета буферов
        facilities_proj = facilities.to_crs(epsg=3857)
        
        # Создаем буферы
        buffers = facilities_proj.geometry.buffer(max_distance)
        
        # Возвращаем результат в WGS84
        return gpd.GeoDataFrame(geometry=buffers).to_crs(epsg=4326)
    
    def find_underserved_areas(self, 
                              study_area: gpd.GeoDataFrame,
                              access_areas: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """
        Находит недообслуживаемые участки, где нет доступа к учреждению
        
        :param study_area: GeoDataFrame с границей изучаемой области
        :param access_areas: GeoDataFrame с зонами доступности
        :return: GeoDataFrame с недообслуживаемыми участками
        """
        # Объединяем все буферы
        if len(access_areas) > 0:
            all_buffers = access_areas.unary_union
            # Находим разницу между изучаемой областью и буферами
            underserved = study_area.geometry.difference(all_buffers)
            return gpd.GeoDataFrame(geometry=underserved)
        else:
            return study_area.copy()
    
    def calculate_improvement_score(self, 
                                   old_access_areas: gpd.GeoDataFrame,
                                   new_access_areas: gpd.GeoDataFrame,
                                   population: gpd.GeoDataFrame) -> float:
        """
        Рассчитывает, насколько улучшится доступность после добавления новых учреждений
        
        :param old_access_areas: GeoDataFrame с существующими зонами доступности
        :param new_access_areas: GeoDataFrame с новыми зонами доступности
        :param population: GeoDataFrame с данными о населении
        :return: Процент улучшения (0-100)
        """
        # Объединяем старые и новые зоны
        if len(old_access_areas) > 0:
            old_union = old_access_areas.unary_union
        else:
            old_union = None
            
        new_union = new_access_areas.unary_union
        
        # Считаем население в каждой зоне
        pop_count = len(population)
        if pop_count == 0:
            return 0
            
        if old_union:
            old_pop_covered = sum(population.geometry.within(old_union))
        else:
            old_pop_covered = 0
            
        new_pop_covered = sum(population.geometry.within(new_union))
        
        # Вычисляем улучшение
        if old_pop_covered == pop_count:
            return 0
        else:
            improvement = (new_pop_covered - old_pop_covered) / (pop_count - old_pop_covered) * 100
            return max(0, min(100, improvement))
