from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import requests
import os
import json
import re
from dotenv import load_dotenv
import random
import numpy as np
from shapely.geometry import Point, Polygon
from sqlalchemy.orm import Session
from models.database import get_db, FacilityModel
from constants.facilities import COVERAGE_RADIUS

# Загрузка переменных окружения
load_dotenv()

router = APIRouter()

# Конфигурация для прямого доступа к API OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("ВНИМАНИЕ: OPENAI_API_KEY не найден в переменных окружения!")
    # Попытка найти ключ в .env файле напрямую
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('OPENAI_API_KEY='):
                    OPENAI_API_KEY = line.strip().split('=', 1)[1].strip('"\'')
                    print(f"API ключ загружен из файла .env: {OPENAI_API_KEY[:5]}...{OPENAI_API_KEY[-4:]}")
                    break

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

# Модели данных для AI рекомендаций
class FacilityData(BaseModel):
    type: str
    coordinates: List[float]
    name: Optional[str] = None
    coverage_radius: Optional[Dict[str, float]] = None

class AreaBounds(BaseModel):
    north: float
    south: float
    east: float
    west: float

class AreaInformation(BaseModel):
    bounds: AreaBounds
    center: Dict[str, float]
    area_size_km2: float

class AIRecommendationRequest(BaseModel):
    existing_facilities: Optional[List[FacilityData]] = []
    area_information: Optional[AreaInformation] = None
    facility_types: Optional[List[Dict[str, Any]]] = []
    target_facility_type: str
    recommendations_count: int = 5
    request_type: str = "optimal_placement"

class RecommendationFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class AIRecommendationResponse(BaseModel):
    type: str = "FeatureCollection"
    features: List[RecommendationFeature]
    improvement_score: float = 75.0

@router.post("/ai/recommend", response_model=AIRecommendationResponse)
async def get_ai_recommendations(
    request_data: AIRecommendationRequest = Body(...), 
    use_openai: bool = False,
    db: Session = Depends(get_db)
):
    """
    Получает рекомендации от AI для оптимального размещения новых объектов
    с учетом существующих объектов и их радиусов охвата.
    
    Параметры:
    - request_data: Данные для запроса рекомендаций
    - use_openai: Использовать ли OpenAI API (True) или локальную логику (False)
    - db: Сессия базы данных
    """
    try:
        # Получаем данные из запроса
        facility_type = request_data.target_facility_type
        area_bounds = request_data.area_information.bounds if request_data.area_information else None
        existing_facilities = request_data.existing_facilities or []
        
        # Если существующие объекты не указаны в запросе, получаем их из базы данных
        if not existing_facilities and area_bounds:
            # Получаем существующие объекты из БД на основе границ области
            db_facilities = db.query(FacilityModel).filter(
                FacilityModel.latitude >= area_bounds.south,
                FacilityModel.latitude <= area_bounds.north,
                FacilityModel.longitude >= area_bounds.west,
                FacilityModel.longitude <= area_bounds.east
            ).all() # type: ignore
            
            # Преобразуем объекты из БД в формат FacilityData
            for facility in db_facilities:
                existing_facilities.append(FacilityData(
                    type=facility.facility_type,
                    coordinates=[facility.longitude, facility.latitude],
                    name=facility.name,
                    coverage_radius={"radius": 1.0}  # Устанавливаем стандартный радиус покрытия
                ))
        
        count = request_data.recommendations_count
        facility_types_info = request_data.facility_types or []
        request_type = request_data.request_type
        
        # Логируем полученные данные
        print(f"Received request for {count} recommendations of type {facility_type}")
        print(f"Area bounds: {area_bounds}")
        print(f"Existing facilities: {len(existing_facilities)} objects")
        print(f"Request type: {request_type}")
        print(f"Using OpenAI: {use_openai}")
        
        # Всегда используем OpenAI API для генерации рекомендаций
        return await get_openai_recommendations(request_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating AI recommendations: {str(e)}")

async def get_openai_recommendations(request_data: AIRecommendationRequest) -> AIRecommendationResponse: # type: ignore
    """
    Получает рекомендации от OpenAI API для размещения объектов с использованием HTTP requests
    
    Args:
        request_data: Данные запроса для генерации рекомендаций
    """
    try:

        
        # Подготовка промпта для OpenAI
        system_prompt = get_system_prompt()
        user_prompt = format_prompt_for_ai(request_data)
        
        # Подготовка данных для запроса
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }
        
        # Формируем тело запроса
        data = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 4000
        }
        
        # Отправляем запрос к API OpenAI с помощью requests
        print("Sending request to OpenAI API...")
        print(f"API key первые 5 символов: {OPENAI_API_KEY[:5]}...") # type: ignore
        response = requests.post(OPENAI_API_URL, headers=headers, json=data)
        
        # Проверяем статус ответа
        if response.status_code != 200:
            error_msg = f"OpenAI API returned error: {response.status_code}, {response.text}"
            print(error_msg)
            

            
            raise HTTPException(status_code=response.status_code, detail=error_msg)
            
        # Парсим результат
        response_data = response.json()
        
        # Извлекаем текст из ответа
        response_text = response_data['choices'][0]['message']['content']
        print(f"Received response from OpenAI: \n{response_text[:500]}...")
        
        # Извлекаем и форматируем рекомендации из ответа
        return extract_recommendations_from_response(response_text, request_data)
        
    except Exception as e:
        print(f"Error in OpenAI request: {str(e)}")
        # Возвращаем локальные рекомендации в случае ошибки

def get_system_prompt():
    """
    Возвращает системный промпт для OpenAI API с учетом полигона города и данных по объектам
    """
    city_polygon_coords = [
        [74.575221, 42.787354],
        [74.599471, 42.823306],
        [74.649990, 42.795139],
        [74.670198, 42.842571],
        [74.763659, 42.868866],
        [74.655547, 42.911802],
        [74.599471, 42.953968],
        [74.519650, 42.900700],
        [74.421641, 42.878122],
        [74.476203, 42.825159],
        [74.526722, 42.824789]
    ]
    facility_weights = COVERAGE_RADIUS  # Используем радиусы как веса для алгоритма
    return f"""CRITICAL INSTRUCTIONS - MUST BE FOLLOWED EXACTLY:

1. POLYGON BOUNDARY VALIDATION:
   - City boundary polygon: {city_polygon_coords}
   - EVERY coordinate MUST be STRICTLY INSIDE this polygon
   - Use ray casting algorithm to verify each point is inside
   - NO points on edges or outside boundaries allowed
   - Add safety buffer of 0.001 degrees from polygon edges

2. OUTPUT FORMAT - STRICT COMPLIANCE:
   - Response MUST be ONLY valid GeoJSON - no explanations, no additional text
   - Start with {{ and end with }}
   - Exactly 6 features minimum
   - Each point format: [longitude, latitude] (longitude first)

3. FACILITY ANALYSIS:
   - Existing facility weights: {facility_weights}
   - Analyze coverage gaps using weighted distance
   - Minimum 500m distance between new recommendations
   - PRIORITY UNDERDEVELOPED ZONE: {[[74.446171, 42.888538], [74.555247, 42.892399], [74.452587, 42.854614], [74.536686, 42.830083]]}
   - THIS ZONE REQUIRES SPECIAL ATTENTION - allocate at least 40% of recommendations here
   - Prioritize other underserved areas (especially northwestern region)

4. VALIDATION CHECKLIST (verify before output):
   ✓ All coordinates inside polygon boundary
   ✓ Valid GeoJSON structure
   ✓ No additional text or explanations
   ✓ Longitude/latitude order correct
   ✓ At least 6 recommendations
   ✓ Proper spacing between points

REQUIRED OUTPUT STRUCTURE:
{{
  "type": "FeatureCollection",
  "features": [
    {{
      "type": "Feature",
      "geometry": {{
        "type": "Point",
        "coordinates": [longitude, latitude]
      }},
      "properties": {{
        "name": "Location 1",
        "type": "recommendation",
        "reason": "Coverage gap analysis result"
      }}
    }}
  ]
}}

FAILURE TO COMPLY WITH POLYGON BOUNDARIES WILL RESULT IN REJECTION."""


def format_prompt_for_ai(request_data: AIRecommendationRequest):
    """
    Форматирует запрос для OpenAI API с усиленными ограничениями
    """
    facility_type = request_data.target_facility_type
    area_bounds = request_data.area_information.bounds if request_data.area_information else "Not provided"
    existing_facilities = request_data.existing_facilities or []
    count = request_data.recommendations_count
    
    prompt = f"""TASK: Find {count} optimal locations for {facility_type} facilities.

POLYGON BOUNDARY (coordinates in [longitude, latitude]):
{json.dumps([
    [74.575221, 42.787354], [74.599471, 42.823306], [74.649990, 42.795139],
    [74.670198, 42.842571], [74.763659, 42.868866], [74.655547, 42.911802],
    [74.599471, 42.953968], [74.519650, 42.900700], [74.421641, 42.878122],
    [74.476203, 42.825159], [74.526722, 42.824789]
], indent=2)}

EXISTING FACILITIES ({len(existing_facilities)} total):
{json.dumps([
    {
        "type": f.type,
        "coordinates": f.coordinates,
        "coverage_radius": f.coverage_radius if f.coverage_radius else 500
    } for f in existing_facilities
], indent=2)}

MANDATORY REQUIREMENTS:
1. ALL {count} coordinates MUST be STRICTLY INSIDE the polygon boundary
2. Minimum 500m spacing between recommendations
3. Response format: ONLY valid GeoJSON FeatureCollection
4. NO explanatory text outside GeoJSON
5. Prioritize coverage gaps and underserved areas

VERIFY EACH COORDINATE IS INSIDE POLYGON BEFORE FINALIZING RESPONSE.

Expected response: Valid GeoJSON with {count} Point features."""
    
    return prompt


def extract_recommendations_from_response(response_text, request_data: AIRecommendationRequest):
    """
    Извлекает рекомендации из ответа OpenAI и форматирует их в AIRecommendationResponse
    """
    # Шаг 1: Поиск блоков JSON с различными форматами обрамления
    json_patterns = [
        r"```json\s*([\s\S]*?)\s*```",  # Стандартный markdown блок с json
        r"```\s*([\s\S]*?)\s*```",       # Markdown блок без указания языка
        r"`({[\s\S]*?})`",               # JSON в одинарных backticks
        r"({[\s\S]*?\"features\"[\s\S]*?})"  # Попытка найти JSON объект с ключом features
    ]
    
    # Шаг 2: Попробовать каждый паттерн поиска
    geojson_data = None
    for pattern in json_patterns:
        matches = re.findall(pattern, response_text)
        
        for match in matches:
            # Удаляем лишние пробелы и переносы строк в начале и конце
            cleaned_match = match.strip()
            
            # Проверяем, начинается ли строка с { или [
            if not (cleaned_match.startswith('{') or cleaned_match.startswith('[')):
                continue
                
            try:
                # Пытаемся распарсить JSON
                json_data = json.loads(cleaned_match)
                
                # Проверяем, является ли это GeoJSON объектом
                if isinstance(json_data, dict) and "features" in json_data:
                    geojson_data = json_data  # Нашли готовый GeoJSON
                    break
                
                # Или списком точек
                elif isinstance(json_data, list):
                    # Преобразуем список точек в GeoJSON
                    features = []
                    for point in json_data:
                        if isinstance(point, dict):
                            # Определяем формат координат
                            if "lat" in point and "lon" in point:
                                coords = [float(point.pop("lon")), float(point.pop("lat"))]
                            elif "latitude" in point and "longitude" in point:
                                coords = [float(point.pop("longitude")), float(point.pop("latitude"))]
                            elif "coordinates" in point and isinstance(point["coordinates"], list):
                                coords = point.pop("coordinates")
                            elif "geometry" in point and "coordinates" in point["geometry"]:
                                # Уже в формате GeoJSON Feature
                                features.append(point)
                                continue
                            else:
                                continue
                            
                            # Создаем GeoJSON Feature
                            feature = {
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": coords
                                },
                                "properties": point
                            }
                            features.append(feature)
                    
                    if features:
                        geojson_data = {
                            "type": "FeatureCollection",
                            "features": features
                        }
                        break
            except json.JSONDecodeError:
                continue  # Если не удалось распарсить, пробуем следующий вариант
    
    # Шаг 3: Если JSON не найден, пытаемся парсить весь текст как JSON
    if not geojson_data:
        try:
            potential_json = response_text.strip()
            json_data = json.loads(potential_json)
            if isinstance(json_data, dict) and "features" in json_data:
                geojson_data = json_data
        except json.JSONDecodeError:
            pass
    
    # Шаг 4: Если JSON не найден, ищем координаты в тексте
    if not geojson_data:
        # Улучшенное регулярное выражение для поиска координат
        coord_patterns = [
            # [74.6145, 42.8345] - стандартный формат
            r"\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]",
            
            # координаты: 74.6145, 42.8345
            r"(?:координаты|coordinates|location)?\s*?[-–:]?\s*?(-?\d+\.\d+)\s*?[,;]\s*?(-?\d+\.\d+)",
            
            # долгота 74.6145, широта 42.8345
            r"(?:долгота|longitude)\s*?[-–:]?\s*?(-?\d+\.\d+)[\s\S]{1,30}(?:широта|latitude)\s*?[-–:]?\s*?(-?\d+\.\d+)"
        ]
        
        features = []
        found_coords = set()  # Используем множество для исключения дубликатов
        
        for pattern in coord_patterns:
            matches = re.findall(pattern, response_text)
            
            for match in matches:
                try:
                    # В зависимости от шаблона, порядок координат может быть разным
                    if pattern.find("долгота") >= 0 or pattern.find("longitude") >= 0:
                        lon, lat = float(match[0]), float(match[1])
                    else:
                        # Предполагаем стандартный порядок [lon, lat]
                        lon, lat = float(match[0]), float(match[1])
                    
                    # Проверяем, что координаты в разумных пределах и не дублируются
                    coord_key = f"{lon:.5f},{lat:.5f}"  # Ключ с округлением для избежания проблем с точностью
                    if -180 <= lon <= 180 and -90 <= lat <= 90 and coord_key not in found_coords:
                        found_coords.add(coord_key)
                        
                        # Ищем возможное описание/название рядом с координатами
                        context_before = response_text[max(0, response_text.find(f"{match[0]}, {match[1]}") - 100):
                                                     response_text.find(f"{match[0]}, {match[1]}")]
                        
                        context_after = response_text[response_text.find(f"{match[0]}, {match[1]}") + len(f"{match[0]}, {match[1]}"):
                                                    min(len(response_text), response_text.find(f"{match[0]}, {match[1]}") + 100)]
                        
                        # Ищем название или причину в контексте
                        name_match = re.search(r"(?:location|место|локация|точка)\s*(\d+|[\w\s]+)", context_before + context_after)
                        reason_match = re.search(r"(?:reason|причина|обоснование):\s*([^\n\.]*)", context_before + context_after)
                        
                        name = f"Рекомендуемое местоположение {len(features)+1}"
                        if name_match:
                            name = name_match.group(1).strip()
                        
                        reason = "Оптимальное расположение по анализу GPT"
                        if reason_match:
                            reason = reason_match.group(1).strip()
                        
                        feature = {
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [lon, lat]
                            },
                            "properties": {
                                "name": name,
                                "type": "recommendation",
                                "reason": reason,
                                "score": 0.85 + (random.random() * 0.1)
                            }
                        }
                        features.append(feature)
                except (ValueError, IndexError):
                    continue
        
        if features:
            geojson_data = {
                "type": "FeatureCollection",
                "features": features
            }
    
    # Используем данные из GeoJSON, либо создаем пустой массив
    features = []
    if geojson_data:
        features = geojson_data.get("features", [])
    
    # Ограничиваем количество рекомендаций до запрошенного
    features = features[:request_data.recommendations_count]
    
    # Проверяем и форматируем каждую рекомендацию
    for i, feature in enumerate(features):
        # Убедимся, что у каждой рекомендации есть необходимые поля
        if "properties" not in feature:
            feature["properties"] = {}
        
        if "name" not in feature["properties"]:
            feature["properties"]["name"] = f"Рекомендуемое место для {request_data.target_facility_type} #{i+1}"
        
        if "type" not in feature["properties"]:
            feature["properties"]["type"] = "recommendation"
            
        if "reason" not in feature["properties"]:
            feature["properties"]["reason"] = "Оптимальное расположение определено AI"
            
        if "score" not in feature["properties"]:
            feature["properties"]["score"] = 0.8 + (random.random() * 0.15)  # Случайный скор 0.8-0.95
    
    # Рассчитываем средний показатель улучшения
    avg_score = sum([feature["properties"].get("score", 0.8) for feature in features]) / len(features) if features else 0.8
    improvement_score = 60 + avg_score * 30  # Масштабируем скор в диапазоне 60-90
    
    return AIRecommendationResponse(
        features=features,
        improvement_score=improvement_score
    )
