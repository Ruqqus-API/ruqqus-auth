const express = require("express");
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const app = express();

app.set('views', [path.join(__dirname, 'views'), path.join(__dirname, 'views/partials/')]);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet());

/*
app.get("/", (request, response) => {
  console.log(path.dirname(require.main.filename))
  throw("500 Internal Server Error")
});
*/

require('./routes')(app);
require('./helpers/error_handler')(app);

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
