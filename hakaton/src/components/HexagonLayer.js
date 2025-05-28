import React, { useState, useEffect } from 'react';
import { GeoJSON, Popup, Tooltip } from 'react-leaflet';
import { getHexagonStyle } from '../utils/hexagonUtils';

/**
 * Компонент для отображения слоя гексагонов с данными о населении
 */
const HexagonLayer = ({ geojsonData, maxPopulation, showTooltips = true }) => {
  const [selectedHexagon, setSelectedHexagon] = useState(null);

  // Обработка события при клике на гексагон
  const onEachFeature = (feature, layer) => {
    // Добавляем всплывающую подсказку
    if (showTooltips) {
      layer.bindTooltip(() => {
        return `Население: ${feature.properties.population}`;
      }, { sticky: true });
    }
    
    // Добавляем обработчик клика
    layer.on({
      click: () => {
        setSelectedHexagon(feature);
      }
    });
  };

  // Настраиваем стиль для гексагона в зависимости от населения
  const style = (feature) => {
    const population = feature.properties.population;
    return getHexagonStyle(population, maxPopulation);
  };

  // Сброс выбранного гексагона при изменении данных
  useEffect(() => {
    setSelectedHexagon(null);
  }, [geojsonData]);

  // Если данные отсутствуют, ничего не рендерим
  if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
    return null;
  }

  return (
    <>
      <GeoJSON 
        data={geojsonData} 
        style={style} 
        onEachFeature={onEachFeature}
      />
      {selectedHexagon && (
        <Popup
          position={[
            selectedHexagon.geometry.coordinates[0][0][1], 
            selectedHexagon.geometry.coordinates[0][0][0]
          ]}
          onClose={() => setSelectedHexagon(null)}
        >
          <div>
            <h4>Информация о зоне</h4>
            <p><strong>H3 индекс:</strong> {selectedHexagon.properties.h3}</p>
            <p><strong>Население:</strong> {selectedHexagon.properties.population}</p>
          </div>
        </Popup>
      )}
    </>
  );
};

export default HexagonLayer;
