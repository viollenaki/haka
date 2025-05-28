import React from 'react';
import { Circle, Tooltip } from 'react-leaflet';
import { createCoverageLayers } from '../utils/mapUtils';
import { FACILITY_COLORS } from '../constants/facilities';

/**
 * Цветовая схема для разных типов объектов инфраструктуры
 */
const typeColors = FACILITY_COLORS;

/**
 * Компонент для отображения кругов зон охвата инфраструктурных объектов
 * @param {Array} data Данные о зонах охвата
 * @param {boolean} showLabels Отображать ли подписи к кругам
 */
const CoverageCircles = ({ data, showLabels = true }) => {
  if (!data || !data.length) return null;
  
  // Преобразуем данные инфраструктуры в слои кругов
  const coverageLayers = createCoverageLayers(data);
  
  return (
    <>
      {coverageLayers.map((layer, idx) => {
        const color = typeColors[layer.type] || typeColors.default;
        
        return (
          <React.Fragment key={`coverage-${idx}`}>
            {/* Внешний круг (максимальный радиус) */}
            <Circle
              center={layer.center}
              radius={layer.maxRadius}
              pathOptions={{ 
                fillColor: color, 
                fillOpacity: 0.1, 
                color: color, 
                opacity: 0.3,
                weight: 1
              }}
            >
              {showLabels && (
                <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                  <div>
                    <strong>{layer.name}</strong>
                    <p>Тип: {layer.type}</p>
                    <p>Максимальный радиус: {layer.maxRadius/1000} км</p>
                    {layer.notes && <p>{layer.notes}</p>}
                  </div>
                </Tooltip>
              )}
            </Circle>
            
            {/* Внутренний круг (минимальный радиус) */}
            <Circle
              center={layer.center}
              radius={layer.minRadius}
              pathOptions={{ 
                fillColor: color, 
                fillOpacity: 0.3, 
                color: color, 
                opacity: 0.6,
                weight: 1
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default CoverageCircles;
