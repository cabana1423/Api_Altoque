var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');  

//###  RUTES ##

var usersRouter = require('./routes/users');
var usersProp = require('./routes/propiedad');
var usersProduc = require('./routes/productos');
var usersCuentas = require('./routes/cuentas');
var admin = require('./routes/admin');
var denuncia = require('./routes/denuncias');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//###   VARIAVLES RUTES ###

app.use('/users', usersRouter);
app.use('/prop', usersProp);
app.use('/produc', usersProduc);
app.use('/cont', usersCuentas);
app.use('/admin', admin);
app.use('/denun', denuncia);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var port = 8000;
app.listen(port, () => {
  console.log("Corriendo " + port);
});

module.exports = app;
