var express = require('express');
var router = express.Router();
var sha1 = require("sha1");
//var JWT=require("jsonwebtoken");
var USERS = require("../database/usersDB");
//var midleware=require("./midleware");

/*        POST users       */
router.post("/", async(req, res) => {
  var obj={};
var userRest = req.body;
  if (userRest.password == null) {
    res.status(300).json({msn: "El password es necesario pra continuar con el registro"});
    return;
}
if ((userRest.password.length < 6)) {
    res.status(300).json({msn: "passwword debe tener almenos 6 caracteres"});
    return;
}
if (!/[A-Z]+/.test(userRest.password)) {
    res.status(300).json({msn: "El password necesita una letra Mayuscula"});
    
    return;
}
/*if (!/[\!\"\=\?\¡\¿\$\^\@\&\(\)\{\}\#]+/.test(userRest.password)) {
    res.status(300).json({msn: "Necesita un caracter especial"});
    return;
}*/
userRest.password = sha1(userRest.password);
obj=userRest;
var userDB = new USERS(obj);
userDB.save((err, docs) => {
    if (err) {
        res.status(300).json(err);
        return;
    }
    res.json(docs);
    return;
});
});

/*        POST users login       */

router.post("/login", async(req, res) => {
  var body = req.body;
  if (body.email == null) {
      res.status(300).json({msn: "El email es necesario"});
           return;
  }
  if (body.password == null) {
      res.status(300).json({msn: "El password es necesario"});
      return;
  }
  var results = await USERS.find({email: body.email, password: sha1(body.password)});
  if (results.length == 1) {
      /*var token =JWT.sign({
          exp:Math.floor(Date.now()/1000)+(60*60*60),
          data:results[0].id
      }, 'PedroCabanaBautistaPotosiBolivia2020');*/
      res.status(200).json({msn: "Bienvenido al sistema " + body.email + " :) "/*,token:token,id:results[0].id*/});
      return;
  }
  res.status(200).json({msn: "Credenciales incorrectas"});
});

/*        GET users      */

router.get("/",/*midleware,*/ (req, res) => {
  var filter={};
  var params= req.query;
  var select="";
  var order = {};
  if(params.email!=null){
      var expresion =new RegExp(params.email);
      filter["email"]=expresion;
  }
  if(params.filters!=null){
      select=params.filters.replace(/,/g, " ");
  }
  if (params.order != null) {
      var data = params.order.split(",");
      var number = parseInt(data[1]);
      order[data[0]] = number;
  }
  //console.log(filter);
  //console.log("es estes"+select);
  var userDB=USERS.find(filter).
  select(select).
  sort(order);
  userDB.exec((err, docs)=>{
      if(err){
          res.status(500).json({msn: "Error en la coneccion del servidor"});
          return;
      }
      res.status(200).json(docs);
      return;
  });
});

/*        DELETE users      */

router.delete("/",/*midleware,*/ async(req, res) => {
    if (req.query.id == null) {
        res.status(300).json({
        msn: "no existe id"
        });
        return;
    }
        var r = await USERS.remove({_id: req.query.id});
        res.status(300).json(r);
    });

 /*        PUT users      */

 router.put("/",/*midleware,*/ async(req, res) => {
    var params = req.query;
    var bodydata = req.body;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    else{

    }
    
    if(bodydata.password!=null){
        if ((bodydata.password.length < 6)) {
            res.status(300).json({msn: "passwword debe tener almenos 6 caracteres"});
            return;
        }
        if (!/[A-Z]+/.test(bodydata.password)) {
            res.status(300).json({msn: "El password necesita una letra Mayuscula"});
            
            return;
        }
        bodydata.password = sha1(bodydata.password);
    }
    var allowkeylist = ["nombre","apellidos","password","tokenFB"];
    var keys = Object.keys(bodydata);
    var updateobjectdata = {};
    for (var i = 0; i < keys.length; i++) {
        if (allowkeylist.indexOf(keys[i]) > -1) {
            updateobjectdata[keys[i]] = bodydata[keys[i]];
        }
    }
    USERS.update({_id:  params.id}, {$set: updateobjectdata}, (err, docs) => {
       if (err) {
           res.status(500).json({msn: "Existen problemas en la base de datos"});
            return;
        } 
        res.status(200).json(docs);
    });

});

/*        GET users por id      */

router.get("/id",/*midleware,*/ (req, res) => {

    var params= req.query;
    var user=USERS.find({_id:params.id});
    user.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});

module.exports = router;
