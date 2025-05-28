import React from 'react';
import '../components/Facility/Facility.css';

/**
 * Панель с возможностью перетаскивания различных типов учреждений на карту
 */
const FacilityPanel = () => {
  // Типы учреждений, которые можно перетаскивать на карту
  const facilities = [
    { id: 'school', name: 'Школа' },
    { id: 'hospital', name: 'Больница' },
    { id: 'clinic', name: 'Поликлиника' },
    { id: 'kindergarten', name: 'Детский сад' },
    { id: 'university', name: 'Университет' },
    { id: 'college', name: 'Колледж' },
    { id: 'fire_station', name: 'Пожарная станция' }
  ];

  /**
   * Обработчик начала перетаскивания
   * @param {Event} event Событие перетаскивания
   * @param {string} type Тип учреждения
   */
  const handleDragStart = (event, type) => {
    event.dataTransfer.setData('facilityType', type);
  };

  return (
    <div className="draggable-panel">
      {facilities.map(facility => (
        <div 
          key={facility.id} 
          className="facility-item"
          draggable
          onDragStart={(event) => handleDragStart(event, facility.id)}
          title={`Перетащите ${facility.name} на карту`}
        >
          {facility.name}
        </div>
      ))}
    </div>
  );
};

export default FacilityPanel;
