const express = require('express');

const validateSecret = require('../middlewares/validateSecret');
const db = require('../models');
const { getAllPositions } = require('../subscribers/position');

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

router.get('/position', async function (req, res) {
  const arrayPos = getAllPositions();
  res.json({ msg: 'position', arrayPos });
});

module.exports = router;
