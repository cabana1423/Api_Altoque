var express = require('express');
var router = express.Router();
var sha1 = require("sha1");
var jwt=require("jsonwebtoken");
const config = require('./config.json')
//var JWT=require("jsonwebtoken");
var ADMIN = require("../database/adminDB");
var PRODUC = require("../database/productosDB");

//var midleware=require("./midleware");

/*        POST users       */

router.post("/", async(req, res) => {

    // user datos
    var obj={};
    var adminInfo = req.body;
    console.log(req.body);
    if (adminInfo.password == null) {
        res.status(300).json({msn: "El password es necesario pra continuar con el registro"});
        return;
    }
    if ((adminInfo.password.length < 6)) {
        res.status(300).json({msn: "passwword debe tener almenos 6 caracteres"});
        return;
    }
    if (!/[A-Z]+/.test(adminInfo.password)) {
        res.status(300).json({msn: "El password necesita una letra Mayuscula"});
        
        return;
    }
    if (!/[\!\"\=\?\¡\¿\$\^\@\&\(\)\{\}\#]+/.test(adminInfo.password)) {
        res.status(300).json({msn: "Necesita un caracter especial"});
        return;
    }
    adminInfo.password = sha1(adminInfo.password);
    obj=adminInfo;
    var admin = new ADMIN(obj);
    admin.save((err, docs) => {
        if (err) {
            res.status(300).json({msn:err});
            console.log(err)
            return;
        }
        res.json(docs);
        return;
    });
});

//      LOGIN 
router.post("/login", async(req, res) => {
    var params = req.body;
    if (params.email == null) {
        res.status(300).json({msn: "El email es necesario"});
             return;
    }
    if (params.password == null) {
        res.status(300).json({msn: "El password es necesario"});
        return;
    }
    var results = await ADMIN.findOne({email: params.email, password: sha1(params.password)});
    console.log(results);
    if (results != null) {
  
        // if (results.estado!='verificada') {
        //   res.status(300).json({msn: "la cuenta no esta verificada",res:results});
        //   return;
        // }
      //      jwt init
  
      const person = {
          "email": results.email,
          "name": results.nombre
      }
      const token = jwt.sign(person, config.secret, { expiresIn: config.tokenLife})
      const refreshToken = jwt.sign(person, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife})
      const response = {
          "status": "Logged in",
          "token": token,
          "refreshToken": refreshToken,
      }
      console.log(response)
      //      jwt finish
  
        ADMIN.update({_id: results.id}, {$set: {'refreshToken':response.refreshToken}}, (err, docs) => {
                   if (err) {
                      console.log("Existen problemas al ingresar token");
                      return;
                  }
              });
        res.status(200).json({msn: "Bienvenido: "+results.nombre,res:results,tokens:response});
        return;
    }
    res.status(300).json({msn: "Usuario no Registrado"});
    return
  });
  router.get("/",/*midleware,*/ (req, res) => {
    var filter={};
    var params= req.query;
    var order = {};
    //console.log(res.body.estado);
    if(params.email!=null){
        var expresion =new RegExp(params.email);
        filter["email"]=expresion;
        console.log(filter);
    }
    if(params.nombre!=null){
        var expresion =new RegExp(params.nombre);
        filter["nombre"]=expresion;
        console.log(filter);
    }
    if (params.order != null) {
        var data = params.order.split(",");
        var number = parseInt(data[1]);
        order[data[0]] = number;
    }
    var userDB=ADMIN.find(filter).
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
  router.get("/prd", (req, res) => {
    var filter={};
    var params= req.query;
    var select="";
    var order = {};
    if(params.nombre!=null){
        var expresion =new RegExp(params.nombre);
        filter["nombre"]=expresion;

    }if(params.id_p!=null){
        var expresion =new RegExp(params.id_p);
        filter["id_prop"]=expresion;

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
    var producDB=PRODUC.find(filter).
    select(select).
    sort(order);
    producDB.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
  })
module.exports = router;