const express = require('express');

const validateSecret = require('../middlewares/validateSecret');
const db = require('../models');
const { getAllLiveDataPoint } = require('../subscribers/dataPoint');

var router = express.Router();
router.use(validateSecret);

router.get('/', async function (req, res) {
  const iSailRaces = await db.iSailRace.findAll({
    raw: true,
  });
  res.json({
    description: 'Endpoint for testing data persistence from EFS volume',
    iSailRaces,
  });
});

router.get('/data-points', async function (req, res) {
  const data = await getAllLiveDataPoint();
  res.json({ msg: 'data points', data });
});

module.exports = router;
