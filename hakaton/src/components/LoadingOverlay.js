import React from 'react';
import '../styles/LoadingOverlay.css';

/**
 * Компонент для отображения анимации загрузки во время работы AI.
 * @param {boolean} visible - Видимость оверлея
 * @param {string} message - Сообщение для отображения
 * @returns {JSX.Element|null} React компонент
 */
const LoadingOverlay = ({ visible, message }) => {
  if (!visible) return null;
  
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-animation">
          <div className="circles-container">
            <div className="circle"></div>
            <div className="circle"></div>
            <div className="circle"></div>
            <div className="circle"></div>
          </div>
          <div className="brain-icon">
            <i className="icon">🧠</i>
          </div>
        </div>
        <h3 className="loading-title">AI анализирует данные</h3>
        <p className="loading-message">{message || "Поиск оптимальных мест для новых объектов..."}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
