# GovFacility Recommender

Рекомендательная система размещения государственных учреждений на основе данных и пространственного анализа.

## Описание проекта

Приложение анализирует данные о населении, существующей инфраструктуре и транспортной доступности, предлагая оптимальные места для строительства новых государственных учреждений (школ, больниц, пожарных пунктов).

## Технологический стек

### Фронтенд (React)
- **React** - основа пользовательского интерфейса
- **React Router** - маршрутизация в приложении
- **Mapbox GL** - альтернативные карты с 3D возможностями
- **Chart.js / React-Chartjs-2** - визуализация данных
- **Material-UI** - компоненты пользовательского интерфейса
- **Axios** - HTTP-запросы к API

### Бэкенд (FastAPI)
- **FastAPI** - фреймворк для API
- **OSMnx** - работа с данными OpenStreetMap
- **H3** - геопространственная индексация
- **NetworkX** - анализ графов для дорожных сетей
- **MySQL** с **PostGIS** - хранение и обработка геоданных

## Источники данных

- **OpenStreetMap (OSM)** - данные об инфраструктуре и дорожной сети
- **Humanitarian Data Exchange (HDX)** - данные о населении, учреждениях
  - [https://data.humdata.org](https://data.humdata.org)
- **WorldPop** - данные о плотности населения
  - [https://www.worldpop.org](https://www.worldpop.org)
- **NASA SEDAC** - социально-экономические данные
  - [https://sedac.ciesin.columbia.edu](https://sedac.ciesin.columbia.edu)
- **OpenRouteService** - API для расчета времени доезда
  - [https://openrouteservice.org](https://openrouteservice.org)
- **Портал открытых данных РФ**
  - [https://data.gov.ru](https://data.gov.ru)
- **Региональные порталы открытых данных**

## Установка и запуск

### Бэкенд (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

### Фронтенд (React)

```bash
cd hakaton
npm install
npm start
```

## Структура проекта

```
/
├── backend/               # Бэкенд на FastAPI
│   ├── app.py            # Основной файл API
│   ├── services/         # Сервисы бизнес-логики
│   ├── models/           # Модели данных
│   └── utils/            # Вспомогательные функции
│
└── hakaton/              # Фронтенд на React
    ├── public/           # Статические файлы
    └── src/              # Исходный код React
        ├── components/   # Компоненты React
        ├── pages/        # Страницы приложения
        ├── utils/        # Вспомогательные функции
        └── App.js        # Основной компонент
```
