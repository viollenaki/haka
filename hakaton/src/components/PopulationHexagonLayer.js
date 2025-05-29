import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'your_mapbox_token_here';

/**
 * Компонент для отображения плотности населения в виде гексагональной сетки
 */
const PopulationHexagonLayer = ({ visible, geojsonData, opacity = 0.7 }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!visible) return;

    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [74.6122, 42.8740],
      zoom: 12
    });

    map.current.on('load', () => {
      if (!geojsonData) return;

      map.current.addSource('hexagons', {
        type: 'geojson',
        data: geojsonData
      });

      map.current.addLayer({
        id: 'hexagons-fill',
        type: 'fill',
        source: 'hexagons',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'population'],
            0, '#0571b0',
            0.2, '#6baed6',
            0.4, '#74c476',
            0.6, '#fd8d3c',
            0.8, '#de2d26'
          ],
          'fill-opacity': opacity
        }
      });

      map.current.on('click', 'hexagons-fill', (e) => {
        const feature = e.features[0];
        const coordinates = e.lngLat;
        const { h3, population } = feature.properties;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<h4>Информация о зоне</h4><p><strong>H3 индекс:</strong> ${h3}</p><p><strong>Население:</strong> ${population}</p>`)
          .addTo(map.current);
      });

      map.current.on('mouseenter', 'hexagons-fill', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'hexagons-fill', () => {
        map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [visible, geojsonData, opacity]);

  if (!visible) {
    return null;
  }

  return <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />;
};

export default PopulationHexagonLayer;
