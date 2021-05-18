require('dotenv').config();

const createServer = require('./server');
const port = process.env.PORT || 3030;

const app = createServer();
app.listen(port, () => {
  console.log(`Server has started! Listening on ${port}`);
});
