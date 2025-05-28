from pydantic import BaseModel, Field
from typing import Optional


class FacilityBase(BaseModel):
    """Базовая модель для объектов инфраструктуры"""
    name: str
    address: str
    latitude: float
    longitude: float
    facility_type: str
    city: str
    country: str


class FacilityCreate(FacilityBase):
    """Модель для создания нового объекта"""
    pass


class Facility(FacilityBase):
    """Полная модель объекта с ID"""
    id: int

    class Config:
        orm_mode = True


class FacilityFilter(BaseModel):
    """Модель для фильтрации объектов"""
    min_lat: Optional[float] = None
    max_lat: Optional[float] = None
    min_lon: Optional[float] = None
    max_lon: Optional[float] = None
    facility_type: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
