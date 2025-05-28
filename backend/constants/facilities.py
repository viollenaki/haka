"""
Константы для объектов инфраструктуры
"""

# Радиусы охвата для разных типов объектов (в км)
COVERAGE_RADIUS = {
    "school": 2,
    "hospital": 3,
    "clinic": 2,
    "kindergarten": 1.5,
    "college": 2,
    "university": 3,
    "fire_station": 3
}

# Названия типов объектов
FACILITY_NAMES = {
    "school": "Школа",
    "hospital": "Больница",
    "clinic": "Клиника",
    "kindergarten": "Детский сад",
    "college": "Колледж",
    "university": "Университет",
    "fire_station": "Пожарная станция"
}

# Цветовая схема для отображения
FACILITY_COLORS = {
    "school": "#4CAF50",
    "hospital": "#F44336",
    "clinic": "#FF9800",
    "kindergarten": "#9C27B0",
    "college": "#2196F3",
    "university": "#3F51B5",
    "fire_station": "#FF5722"
}

# Конфигурация для гексагонального отображения данных
HEXAGON_CONFIG = {
    "resolution": 8,     # Разрешение гексагонов H3 (7-9 оптимально для городов)
    "opacity": 0.7,      # Прозрачность гексагонов
    "color_scale": {     # Цветовая шкала для отображения плотности населения
        "low": "#0571b0",
        "medium_low": "#6baed6",
        "medium": "#74c476",
        "medium_high": "#fd8d3c",
        "high": "#de2d26"
    }
}
