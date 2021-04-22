var express = require('express');
var fileUpload = require("express-fileupload")
var router = express.Router();
var sha1 = require("sha1");
const fs = require('fs');
//var JWT=require("jsonwebtoken");
var USERS = require("../database/usersDB");
//var midleware=require("./midleware");

router.use(fileUpload({
    fileSize: 1 * 1024 * 1024,
    abortOnLimit: true
}));

/*        POST users       */

router.post("/", async(req, res) => {
    //img user datos
    var img=req.files.file;
    var path= __dirname.replace(/\/routes/g, "/img");
    var date =new Date();
    var sing  =sha1(date.toString()).substr(1,12);
    var totalpath = path + "/" + sing + "_" + img.name.replace(/\s/g,"_");
    const tamaño=1500000;
    if(img.size>tamaño){
        return res.status(300).send({msn : "el archivo es muy grande"});
    }
    // user datos
    var obj={};
    var userInfo = req.body;
    if (userInfo.password == null) {
        res.status(300).json({msn: "El password es necesario pra continuar con el registro"});
        return;
    }
    if ((userInfo.password.length < 6)) {
        res.status(300).json({msn: "passwword debe tener almenos 6 caracteres"});
        return;
    }
    if (!/[A-Z]+/.test(userInfo.password)) {
        res.status(300).json({msn: "El password necesita una letra Mayuscula"});
        
        return;
    }
    /*if (!/[\!\"\=\?\¡\¿\$\^\@\&\(\)\{\}\#]+/.test(userRest.password)) {
        res.status(300).json({msn: "Necesita un caracter especial"});
        return;
    }*/
    userInfo.password = sha1(userInfo.password);
    obj=userInfo;
    obj["img_user"]=[{"titulo":sing+ "_" +img.name.replace(/\s/g,"_"),"pathfile":totalpath}];
    var userDB = new USERS(obj);
    userDB.save((err, docs) => {
        if (err) {
            res.status(300).json(err);
            return;
        }
        img.mv(totalpath, async(err) => {
            if (err) {
                return res.status(300).send({msn : "Error al escribir el archivo en el disco duro"});
            }
            console.log(totalpath);
            //imgU["relativepath"] = "/api/1.0/getfile/?id=" + obj["hash"];
        });
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
    var user=await USERS.find({_id:req.query.id});
    var titulo=user[0].img_user[0].titulo;
    var r = await USERS.remove({_id: req.query.id});
    try {
        fs.unlinkSync('./img/'+titulo)
        console.log('File removed')
      } catch(err) {
        console.error('Snot file removed', err)
      }
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
    console.log(updateobjectdata);
    USERS.update({_id:  params.id}, {$set: updateobjectdata}, (err, docs) => {
       if (err) {
           res.status(500).json({msn: "Existen problemas en la base de datos"});
            return;
        } 
        res.status(200).json(docs);
    });

});

 /*        PUT img users      */

 router.put("/put-img",/*midleware,*/ async(req, res) => {
    var params = req.query;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }//eliminando img part 1
    var user=await USERS.find({_id:params.id});
    var titulo=user[0].img_user[0].titulo;
    //new img
    var img=req.files.file;
    var path= __dirname.replace(/\/routes/g, "/img");
    var date =new Date();
    var sing  =sha1(date.toString()).substr(1,12);
    var totalpath = path + "/" + sing + "_" + img.name.replace(/\s/g,"_");
    USERS.update({_id:  params.id}, {$set: {"img_user":[{"titulo":sing+ "_" +img.name.replace(/\s/g,"_"),"pathfile":totalpath}]}}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         img.mv(totalpath, async(err) => {
            if (err) {
                return res.status(300).send({msn : "Error al escribir el archivo en el disco duro"});
            }
            console.log(totalpath);  
        });
         //elimando part 2
         try {
            fs.unlinkSync('./img/'+titulo)
            console.log('File removed')
          } catch(err) {
            console.error('Something wrong happened removing the file', err)
          }
         res.status(200).json(docs);
     });

});

/*        GET users por id      */

router.get("/id",/*midleware,*/ async(req, res) => {

    var params= req.query;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var user= USERS.find({_id:params.id});
    user.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});
router.get("/get_img"/*,midleware*/, async(req, res, next)=>{
    var params=req.query;
    if(params.id==null){
        res.status(300).json({msn: "error es necesario una ID"});
        return;
    }
    var idimg = params.id ;
    var imagen=await USERS.find({"img_user._id": idimg});
    if(imagen.length==1){
        res.json(imagen[0].img_user[0].pathfile);
        return;
    }
    res.status(300).json({msn: "error en la peticion"});
    return;
});

module.exports = router;
