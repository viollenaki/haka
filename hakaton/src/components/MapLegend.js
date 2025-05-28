import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

/**
 * Компонент легенды для карты
 * @param {Object} options Настройки легенды
 */
const MapLegend = ({ options = {} }) => {
  const map = useMap();
  
  const defaultOptions = {
    position: 'bottomright',
    title: 'Легенда',
    infrastructureTypes: [
      { type: 'school', name: 'Школа', color: '#4CAF50' },
      { type: 'clinic', name: 'Поликлиника', color: '#2196F3' },
      { type: 'hospital', name: 'Больница', color: '#F44336' },
      { type: 'kindergarten', name: 'Детский сад', color: '#FF9800' },
      { type: 'university', name: 'Университет', color: '#9C27B0' },
      { type: 'college', name: 'Колледж', color: '#795548' },
    ],
    showHeatmapLegend: true,
    showGeoJSONLegend: false
  };
  
  const legendOptions = { ...defaultOptions, ...options };
  
  useEffect(() => {
    if (!map) return;
    
    // Создаем контрол для легенды
    const legend = L.control({ position: legendOptions.position });
    
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.backgroundColor = 'white';
      div.style.padding = '10px';
      div.style.border = '1px solid #ccc';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
      
      let html = `<h4 style="margin:0 0 10px 0;">${legendOptions.title}</h4>`;
      
      // Типы инфраструктурных объектов
      html += '<div style="margin-bottom:10px;"><strong>Типы объектов:</strong></div>';
      
      legendOptions.infrastructureTypes.forEach(item => {
        html += `
          <div style="display:flex; align-items:center; margin-bottom:5px;">
            <div style="
              width:15px; 
              height:15px; 
              background-color:${item.color}; 
              border-radius:50%; 
              margin-right:5px;
            "></div>
            <span>${item.name}</span>
          </div>
        `;
      });
      
      // Тепловая карта
      if (legendOptions.showHeatmapLegend) {
        html += `
          <div style="margin:10px 0;"><strong>Зоны охвата:</strong></div>
          <div style="display:flex; flex-direction:column;">
            <div style="margin-bottom:5px;">
              <div style="display:flex; align-items:center;">
                <div style="width:15px; height:15px; background-color:#FF0000; margin-right:5px;"></div>
                <span>Высокая интенсивность</span>
              </div>
            </div>
            <div style="margin-bottom:5px;">
              <div style="display:flex; align-items:center;">
                <div style="width:15px; height:15px; background-color:#FFFF00; margin-right:5px;"></div>
                <span>Средняя интенсивность</span>
              </div>
            </div>
            <div style="margin-bottom:5px;">
              <div style="display:flex; align-items:center;">
                <div style="width:15px; height:15px; background-color:#00FF00; margin-right:5px;"></div>
                <span>Низкая интенсивность</span>
              </div>
            </div>
            <div>
              <span style="font-size:12px; color:#666;">* Более темные области показывают пересечения зон охвата</span>
            </div>
          </div>
        `;
      }
      
      // Данные из GeoJSON
      if (legendOptions.showGeoJSONLegend) {
        html += `
          <div style="margin:15px 0 10px 0;"><strong>Данные из GeoJSON:</strong></div>
          <div style="display:flex; flex-direction:column;">
            <div style="margin-bottom:5px;">
              <div style="display:flex; align-items:center;">
                <div style="width:15px; height:15px; background-color:#FF0000; margin-right:5px;"></div>
                <span>Высокая плотность населения</span>
              </div>
            </div>
            <div style="margin-bottom:5px;">
              <div style="display:flex; align-items:center;">
                <div style="width:15px; height:15px; background-color:#FFFF00; margin-right:5px;"></div>
                <span>Средняя плотность населения</span>
              </div>
            </div>
            <div>
              <span style="font-size:12px; color:#666;">* Данные из файла bishkek_filtered.geojson</span>
            </div>
          </div>
        `;
      }
      
      div.innerHTML = html;
      return div;
    };
    
    legend.addTo(map);
    
    // Очистка при размонтировании
    return () => {
      legend.remove();
    };
  }, [map, legendOptions]);
  
  return null;
};

export default MapLegend;
