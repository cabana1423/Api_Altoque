var express = require('express');
var router = express.Router();
const fileUpload = require('express-fileupload');
const fileUploadService =  require('../services/upload.service');
var AWS = require('aws-sdk');
var sha1 = require("sha1");
//var JWT=require("jsonwebtoken");
var USERS = require("../database/usersDB");
const bucketAws ="usuariosfiles"

router.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
}
));

async function borrar(keyF){
    AWS.config.update({
        accessKeyId: "AKIAZNICKCXYYPV6L4WA",
        secretAccessKey: "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",
        region: "sa-east-1",
    });
    const s3 = new AWS.S3();
    
    const params = {
            Bucket: bucketAws,
            Key: keyF //if any sub folder-> path/of/the/folder.ext
    }
    try {
        await s3.headObject(params).promise()
        console.log("File Found in S3")
        try {
            await s3.deleteObject(params).promise()
            console.log("file deleted Successfully")
        }
        catch (err) {
             console.log("ERROR in file Deleting : " + JSON.stringify(err))
        }
    } catch (err) {
            console.log("File not Found ERROR : " + err.code)
    }
}

router.post("/", async(req, res,next) => {
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
    //carga de archivo
    var uploadRes;
    if(req.files && req.files.media){
        const file= req.files.media;
        uploadRes = await fileUploadService.uploadFileToAws(file, bucketAws);
        //console.log(uploadRes);    
    }
    const keyF=uploadRes.key;
    const urlF=uploadRes.Url;
    obj["img_user"]=[{"Url":urlF,"key":keyF}];
    var userDB = new USERS(obj);
    userDB.save(async(err, docs) => {
        if (err) {
            //delete file
            borrar(keyF);
            res.status(300).json(err);
            return;
        }
        res.json(docs);
        return;
    });
});
//      PUT img users
router.put("/file", async(req, res, next) => {
    var params = req.query;
    if (params.id == null) {
        res.status(300).json({msn: "Error es necesario un ID"});
        return;
    }
    var user =  await USERS.find({_id: params.id});
    const exkey=user[0].img_user[0].key;
    var uploadRes;
    if(req.files && req.files.media){
        const file= req.files.media;
        uploadRes = await fileUploadService.uploadFileToAws(file, bucketAws); 
    }
    const keyF=uploadRes.key;
    const urlF=uploadRes.Url;
    USERS.updateOne({_id:  params.id}, {$set: {"img_user":[{"Url":urlF,"key":keyF}]}}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         borrar(exkey);
         res.status(200).json(docs);
     });
    return;
});

/*        POST users login       */

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
  var results = await USERS.find({email: params.email, password: sha1(params.password)});
  console.log(results.length);
  if (results.length == 1) {
      /*var token =JWT.sign({
          exp:Math.floor(Date.now()/1000)+(60*60*60),
          data:results[0].id
      }, 'PedroCabanaBautistaPotosiBolivia2020');*/
      res.status(200).json({msn: "Bienvenido al sistema " + params.email + " :) ",
                            idU:results[0]._id/*,token:token,id:results[0].id*/});
      return;
  }
  res.status(300).json({msn: "Credenciales incorrectas"});
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
    var imguser=user[0].img_user[0].key;
    var r = await USERS.remove({_id: req.query.id});
    borrar(imguser);
    console.log(imguser);
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
    USERS.updateOne({_id:  params.id}, {$set: updateobjectdata}, (err, docs) => {
       if (err) {
           res.status(500).json({msn: "Existen problemas en la base de datos"});
            return;
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

module.exports = router;
