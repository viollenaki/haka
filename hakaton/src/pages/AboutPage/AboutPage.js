import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <h1>О проекте "PopMap Recommender"</h1>
      
      <section>
        <h2>Цель проекта</h2>
        <p>
          Система рекомендаций для оптимального размещения государственных учреждений 
          (школ, больниц, пожарных станций) на основе пространственного анализа данных.
        </p>
      </section>
      
      <section>
        <h2>Используемые технологии</h2>
        <h3>Фронтенд</h3>
        <ul>
          <li>React - библиотека для создания интерфейсов</li>
          <li>React Leaflet - интерактивные карты</li>
          <li>Chart.js - для визуализации данных анализа</li>
          <li>Material-UI - компоненты пользовательского интерфейса</li>
        </ul>
        
        <h3>Бэкенд</h3>
        <ul>
          <li>FastAPI - асинхронный веб-фреймворк для API</li>
          <li>GeoPandas - обработка геопространственных данных</li>
          <li>OSMnx - работа с данными OpenStreetMap</li>
          <li>Scikit-learn - для алгоритмов пространственного анализа</li>
        </ul>
      </section>
      
      <section>
        <h2>Источники данных</h2>
        <ul>
          <li>OpenStreetMap - существующие объекты инфраструктуры</li>
          <li>Humanitarian Data Exchange (HDX) - данные о населении</li>
          <li>WorldPop - плотность населения</li>
          <li>OpenRouteService - сервис для анализа времени доезда</li>
        </ul>
      </section>
      
      <div style={{ marginTop: '30px' }}>
        <Link to="/">
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
