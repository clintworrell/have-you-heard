var express = require('express');
var app = express();
const PORT = process.env["PORT"];

app.use(express.static('./'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, function () {
  console.log(`Server listening on port ${PORT}...`);
});
