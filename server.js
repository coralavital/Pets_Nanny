const express = require('express');
const app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var session = require('express-session');
const flash=require('express-flash-messages') 
var upload = multer();

const port = 4000;

// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 
//form-urlencoded

// for parsing multipart/form-data
app.use(upload.array()); 
app.use(express.static('public'));

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static("public"));

// use res.render to load up an ejs view file

require('./routes')(app);

app.listen(port);
console.log(`Server is listening on port ${port}`);