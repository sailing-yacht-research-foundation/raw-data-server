const axios = require('axios');

const triggerWeatherSlicer = async (raceMetadata) => {
  const slicerHost = process.env.GEO_DATA_SLICER;
  if (raceMetadata && slicerHost) {
    const reqBody = {
      roi: {
        type: 'Feature',
        properties: {},
        geometry: raceMetadata.bounding_box,
      },
      startTimeUnixMS: raceMetadata.approx_start_time_ms,
      endTimeUnixMS: raceMetadata.approx_end_time_ms,
      payload: {
        raceID: raceMetadata.id,
      },
    };
    setImmediate(async () => {
      try {
        await axios.post(`${slicerHost}/api/v1/`, reqBody);
      } catch (err) {
        console.log(
          `Failed in triggering weather slicer for race id ${raceMetadata.id}`,
          err.message,
        );
      }
    });
  }
};

exports.triggerWeatherSlicer = triggerWeatherSlicer;
