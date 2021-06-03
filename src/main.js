require('dotenv').config();
const db = require('./models');

const createServer = require('./server');
const port = process.env.PORT || 3030;

(async () => {
  try {
    const app = createServer();

    await db.sequelize.sync();
    app.listen(port, () => {
      console.log(`Server has started! Listening on ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
})();
