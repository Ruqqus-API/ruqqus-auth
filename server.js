const express = require("express");
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const app = express();
require('dotenv').config();

app.set('views', [path.join(__dirname, 'views'), path.join(__dirname, 'views/partials/')]);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

require('./routes')(app);
require('./helpers/error_handler')(app);

app.use(function (err, req, res, next) {
	console.error(err)
	res.status(500).render('errors/500')
});

app.use(helmet());
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + listener.address().port);
});
