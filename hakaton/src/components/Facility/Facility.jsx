import React from "react";
import "./Facility.css";

const facilityTypes = [
  "school",
  "hospital",
  "clinic",
  "kindergarten",
  "college",
  "university",
  "fire_station",
];
const labels = {
  school: "Школа",
  hospital: "Больница",
  clinic: "Клиника",
  kindergarten: "Детский сад",
  college: "Колледж",
  university: "Университет",
  fire_station: "Пожарная станция",
};

const FacilityPanel = () => (
  <div className="draggable-panel">
    {facilityTypes.map((type) => (
      <div
        key={type}
        className="facility-item"
        data-type={type}
        draggable
        onDragStart={(e) => e.dataTransfer.setData("facilityType", type)}
        title={`Перетащите ${labels[type]} на карту`}
      >
        {labels[type]}
      </div>
    ))}
  </div>
);

export default FacilityPanel;
