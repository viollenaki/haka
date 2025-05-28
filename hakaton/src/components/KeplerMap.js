import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import KeplerGl from 'kepler.gl';
import { addDataToMap } from 'kepler.gl/actions';

const KeplerMap = ({ data, config }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (data) {
      dispatch(
        addDataToMap({
          datasets: data,
          options: {
            centerMap: true,
          },
          config
        })
      );
    }
  }, [dispatch, data, config]);

  return (
    <div style={{ height: '800px', width: '100%' }}>
      <KeplerGl
        id="kepler-map"
        mapboxApiAccessToken={"pk.eyJ1IjoiYWt1dXN0aWsiLCJhIjoiY21iNzJodTc1MDA1dTJxcjEwYzkwMm5kcCJ9.i8IWICH8gIGv1BCkynT9sw"}
        width={window.innerWidth}
        height={800}
      />
    </div>
  );
};

export default KeplerMap;
