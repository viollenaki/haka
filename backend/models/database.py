from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Параметры подключения к базе данных
DB_USER = os.getenv("MYSQL_USER", "root")
DB_PASSWORD = os.getenv("MYSQL_PASSWORD", "1234")
DB_HOST = os.getenv("MYSQL_HOST", "localhost")
DB_PORT = os.getenv("MYSQL_PORT", "3306") 
DB_NAME = os.getenv("MYSQL_DB", "haka_db")

# Строка подключения к MySQL
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Создание движка SQLAlchemy
engine = create_engine(DATABASE_URL)

# Создание базового класса для моделей
Base = declarative_base()

# Модель таблицы facilities
class FacilityModel(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    facility_type = Column(String(50), nullable=False)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)


# Создание таблиц в базе данных
Base.metadata.create_all(bind=engine) # type: ignore

# Создание сессии
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Функция для получения сессии DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
