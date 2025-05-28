from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import geopandas as gpd
import pandas as pd
import numpy as np
from shapely.geometry import Point, shape
import osmnx as ox
from pydantic import BaseModel
from typing import List, Optional, Dict
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# Подключаем роутеры
from routers.facilities import router as facilities_router
from routers.ai_recommendations import router as ai_recommendations_router  # Добавляем импорт роутера AI рекомендаций

# Загрузка переменных окружения
load_dotenv()

app = FastAPI(title="InfraMap")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели данных
class FacilityType(BaseModel):
    type: str
    name: str
    description: str

class Facility(BaseModel):
    id: int
    name: str
    type: str
    latitude: float
    longitude: float
    
class RecommendationRequest(BaseModel):
    facility_type: str
    area_bounds: Dict[str, float]
    
class RecommendationResponse(BaseModel):
    locations: List[Dict[str, float]]
    improvement_score: float

# Маршруты API
@app.get("/")
async def root():
    return {"message": "Welcome to GovFacility Recommender API"}

# Подключаем роутеры
app.include_router(facilities_router, prefix="")
app.include_router(ai_recommendations_router, prefix="")  # Подключаем роутер AI рекомендаций

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
