import React from 'react';
import './Facility.css';

const facilityTypes = ['school', 'hospital', 'clinic', 'kindergarten', 'university', 'fire_station'];
const labels = {
  school: 'Школа',
  hospital: 'Больница',
  clinic: 'Клиника',
  kindergarten: 'Детский сад',
  university: 'Университет',
  fire_station: 'Пожарная станция'
};

const FacilityPanel = () => (
  <div className="draggable-panel">
    {facilityTypes.map(type => (
      <div
        key={type}
        className="facility-item"
        draggable
        onDragStart={e => e.dataTransfer.setData('facilityType', type)}
      >
        {labels[type]}
      </div>
    ))}
  </div>
);

export default FacilityPanel;
