var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();
//##      VARIABLES  socket
var http=require("http");
const cors =require("cors");
//const portSocket=process.env.PORT||5000;

var server =http.createServer(app);
var io=require("socket.io")(server,{
  cors:{
    origin:"*"
  }
});



//###  RUTES ##

var usersRouter = require('./routes/users');
var usersProp = require('./routes/propiedad');
var usersProduc = require('./routes/productos');
var usersCuentas = require('./routes/cuentas');
var admin = require('./routes/admin');
var denuncia = require('./routes/denuncias');
var chats = require('./routes/chats');
var fcm = require('./Notifications_FCM/FirebaseConf');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**   LOGICA SOCKET.IO */

// var client={}
// app.use(cors());
// io.on("connection",(socket)=>{
//   console.log("conecatdo :)");
//   console.log(socket.id,"esta conectado");
//   socket.on("signin",(id)=>{
//     console.log(id);
//     client[id]=socket;
//     console.log(client);
//     socket.on("message",(msg)=>{
//       console.log(msg);
//       let targetId =msg.targetId;
//       if(client[targetId])
//         client[targetId].emit("message",msg);
//     });
//   });
// });

io.on('connection', function(socket) {
  socket.on("signin",(chatID)=>{
      //Get the chatID of the user and join in a room of the same chatID
  //chatID = socket.handshake.query.chatID;
  socket.join(chatID);
  console.log(socket.id);

  //Leave the room if the user closes the socket
  socket.on('disconnect', () => {
      socket.leave(chatID);
  })

  //Send message to only a particular user
  socket.on('send_message', message => {
    console.log(message);
      id_fin = message.id_fin;
      id_origen = message.id_origen;
      content = message.content;
      time =message.time;

      //Send message to only that particular room
      socket.in(id_fin).emit('receive_message',message)
  })
  });
  
});

//###   VARIAVLES RUTES ###

app.use('/users', usersRouter);
app.use('/prop', usersProp);
app.use('/produc', usersProduc);
app.use('/cont', usersCuentas);
app.use('/admin', admin);
app.use('/denun', denuncia);
app.use('/chat', chats);
app.use('/fcm', fcm);


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
server.listen(port,"0.0.0.0",()=>{
  console.log("servidor socket iniciado");
});
// app.listen(port, () => {
//   console.log("Corriendo " + port);
// });

module.exports = app;
