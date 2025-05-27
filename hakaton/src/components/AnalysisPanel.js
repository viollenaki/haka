import React from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Регистрация компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AnalysisPanel = ({ facilities, facilityType }) => {
  const facilityTypeLabels = {
    'school': 'школ',
    'hospital': 'больниц',
    'fire_station': 'пожарных станций'
  };
  
  const chartData = {
    labels: ['Количество учреждений', 'Среднее расстояние (км)', 'Охват населения (%)'],
    datasets: [
      {
        label: 'Текущий анализ',
        data: [
          facilities.length,
          facilities.length ? (5 + Math.random() * 3).toFixed(1) : 0, // Имитация среднего расстояния
          facilities.length ? Math.min(100, (facilities.length * 10 + Math.random() * 20)).toFixed(1) : 0 // Имитация охвата населения
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)'
        ]
      }
    ]
  };
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Анализ текущих учреждений'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  
  return (
    <div className="analysis-panel panel">
      <h2>Анализ текущей ситуации</h2>
      {facilities.length > 0 ? (
        <>
          <p>В выбранном регионе найдено {facilities.length} {facilityTypeLabels[facilityType] || 'учреждений'}.</p>
          <div style={{ height: '200px' }}>
            <Bar data={chartData} options={options} />
          </div>
        </>
      ) : (
        <p>Нет данных для анализа. Выберите регион и нажмите "Показать текущие учреждения".</p>
      )}
    </div>
  );
};

export default AnalysisPanel;
