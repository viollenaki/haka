from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from models.facility import Facility, FacilityCreate
from models.database import get_db, FacilityModel

router = APIRouter()


@router.post("/facilities/", response_model=Facility, tags=["facilities"])
def create_facility(facility: FacilityCreate, db: Session = Depends(get_db)):
    """
    Создание нового объекта инфраструктуры.
    """
    db_facility = FacilityModel(
        name=facility.name,
        address=facility.address,
        latitude=facility.latitude,
        longitude=facility.longitude,
        facility_type=facility.facility_type,
        city=facility.city,
        country=facility.country
    )
    
    db.add(db_facility)
    db.commit()
    db.refresh(db_facility)
    return db_facility


@router.get("/facilities/", response_model=List[Facility], tags=["facilities"])
def get_facilities(
    min_lat: Optional[float] = Query(None, description="Минимальная широта"),
    max_lat: Optional[float] = Query(None, description="Максимальная широта"),
    min_lon: Optional[float] = Query(None, description="Минимальная долгота"),
    max_lon: Optional[float] = Query(None, description="Максимальная долгота"),
    facility_type: Optional[str] = Query(None, description="Тип объекта (school, hospital, fire_station)"),
    city: Optional[str] = Query(None, description="Город"),
    country: Optional[str] = Query(None, description="Страна"),
    db: Session = Depends(get_db)
):
    """
    Получение списка объектов с возможностью фильтрации по координатам и типам.
    """
    query = db.query(FacilityModel)
    
    # Применяем фильтры если они указаны
    if min_lat is not None:
        query = query.filter(FacilityModel.latitude >= min_lat)
    if max_lat is not None:
        query = query.filter(FacilityModel.latitude <= max_lat)
    if min_lon is not None:
        query = query.filter(FacilityModel.longitude >= min_lon)
    if max_lon is not None:
        query = query.filter(FacilityModel.longitude <= max_lon)
    if facility_type is not None:
        query = query.filter(FacilityModel.facility_type == facility_type)
    if city is not None:
        query = query.filter(FacilityModel.city == city)
    if country is not None:
        query = query.filter(FacilityModel.country == country)
    
    facilities = query.all()
    return facilities


@router.get("/facilities/{facility_id}", response_model=Facility, tags=["facilities"])
def get_facility(facility_id: int, db: Session = Depends(get_db)):
    """
    Получение объекта по ID.
    """
    facility = db.query(FacilityModel).filter(FacilityModel.id == facility_id).first()
    if facility is None:
        raise HTTPException(status_code=404, detail="Объект не найден")
    return facility


@router.get("/facilities/type/{facility_type}", response_model=List[Facility], tags=["facilities"])
def get_facilities_by_type(
    facility_type: str, 
    min_lat: Optional[float] = Query(None),
    max_lat: Optional[float] = Query(None),
    min_lon: Optional[float] = Query(None),
    max_lon: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Получение списка объектов определенного типа с возможностью фильтрации по координатам.
    """
    query = db.query(FacilityModel).filter(FacilityModel.facility_type == facility_type)
    
    # Применяем географические фильтры
    if min_lat is not None:
        query = query.filter(FacilityModel.latitude >= min_lat)
    if max_lat is not None:
        query = query.filter(FacilityModel.latitude <= max_lat)
    if min_lon is not None:
        query = query.filter(FacilityModel.longitude >= min_lon)
    if max_lon is not None:
        query = query.filter(FacilityModel.longitude <= max_lon)
    
    facilities = query.all()
    return facilities
