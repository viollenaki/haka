import React from 'react';

const RecommendationPanel = ({ recommendations }) => {
  if (recommendations.length === 0) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score > 0.9) return '#4CAF50'; // Зеленый для высоких оценок
    if (score > 0.8) return '#8BC34A';
    if (score > 0.7) return '#FFC107';
    return '#FF9800'; // Оранжевый для низких оценок
  };

  const calculateImprovementPercentage = (recs) => {
    if (recs.length === 0) return 0;
    // В реальном приложении здесь был бы алгоритм расчета улучшения
    // Для демонстрации просто используем среднее значение оценок
    const avgScore = recs.reduce((sum, rec) => sum + rec.score, 0) / recs.length;
    return Math.round(avgScore * 35); // 35% максимальное предполагаемое улучшение
  };
  
  return (
    <div className="recommendation-panel">
      <h2>Рекомендуемые локации</h2>
      <p>Найдено {recommendations.length} подходящих мест:</p>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {recommendations.map((rec, idx) => (
          <div key={idx} className="recommendation-item">
            <strong>Локация #{idx + 1}</strong>
            <div>Координаты: {rec.latitude.toFixed(5)}, {rec.longitude.toFixed(5)}</div>
            <div>Оценка: <span style={{ color: getScoreColor(rec.score) }}>{(rec.score * 100).toFixed(1)}%</span></div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '15px' }}>
        <strong>Улучшение охвата: </strong> 
        {calculateImprovementPercentage(recommendations)}% населения
      </div>
    </div>
  );
};

export default RecommendationPanel;
