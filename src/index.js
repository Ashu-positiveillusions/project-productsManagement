const express = require('express');
var bodyParser = require('body-parser');
const multer = require('multer');
const route = require('../src/router/route');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());


const mongoose = require('mongoose');


mongoose.connect("mongodb+srv://Ashu-positiveillusions:TPXgNbKjCwkqz4Ax@cluster0.yf3ho.mongodb.net/SHOPPING-CART-group22?retryWrites=true&w=majority", {useNewUrlParser: true})
    .then(() => console.log('mongodb running and connected'))
    .catch(err => console.log(err))


app.use('/', route);


app.listen(process.env.PORT || 3000, function() {
	console.log('Express app running on port ' + (process.env.PORT || 3000))
});