var express = require('express');
var router = express.Router();
const fileUpload = require('express-fileupload');
const fileUploadService =  require('../services/upload.service');
const mailer =require('../send_email/signup_email');
var AWS = require('aws-sdk');
var sha1 = require("sha1");
//var JWT=require("jsonwebtoken");
var USERS = require("../database/usersDB");
const LIKE = require('../database/likesDB');
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
    var params = req.body;
    if (params.password == null) {
        res.status(300).json({msn: "El password es necesario pra continuar con el registro"});
        return;
    }
    if ((params.password.length < 6)) {
        res.status(300).json({msn: "passwword debe tener almenos 6 caracteres"});
        return;
    }
    if (!/[A-Z]+/.test(params.password)) {
        res.status(300).json({msn: "El password necesita una letra Mayuscula"});
        
        return;
    }
    /*if (!/[\!\"\=\?\¡\¿\$\^\@\&\(\)\{\}\#]+/.test(userRest.password)) {
        res.status(300).json({msn: "Necesita un caracter especial"});
        return;
    }*/
    params.password = sha1(params.password);
    obj=params;
    //carga de archivo
    var uploadRes;
    var keyF;
    var urlF;
    if(req.files && req.files.media){
        const file= req.files.media;
        uploadRes = await fileUploadService.uploadFileToAws(file, bucketAws);
         keyF=uploadRes.key;
         urlF=uploadRes.Url;
        //console.log(uploadRes);    
    }
    //console.log(userInfo.url_img)
    
    if(params.url_img==null||params.url_img==undefined){
        obj["img_user"]=[{"Url":urlF,"key":keyF}];
    }else{
        obj["img_user"]=[{"Url":params.url_img}];
    }
    var aleatorio;
    if(params.est==''){
         aleatorio = Math.round(Math.random()*999999);
    obj['estado']=String(aleatorio);}
    
    var userDB = new USERS(obj);
    userDB.save(async(err, docs) => {
        if (err) {
            //delete file
            borrar(keyF);
            res.status(300).json(err);
            //console.log(err)
            return;
        }
        if (params.est=='') {
            mailer.enviar_mail(params.email,aleatorio,params.nombre,res);
        }
        res.status(200).json(docs);
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
  var results = await USERS.findOne({email: params.email, password: sha1(params.password)});
  //console.log(results);
  if (results != null) {

      if (results.estado!='verificada') {
        res.status(300).json({msn: "la cuenta no esta verificada",res:results});
        return;
      }

      USERS.update({_id: results.id}, {$addToSet: {'tokensFBS': [{'tokenFB':params.tokenFB}]}}, (err, docs) => {
                 if (err) {
                    console.log("Existen problemas al ingresar tokenFB");
                    return;
                }
            });
        var likes=await LIKE.findOne({"id_user":results._id});
        console.log(likes);
        if(likes==null){
            likes={'listaLikes':[],'interacciones':[]};
        }
        res.status(200).json({msn: "Bienvenido: "+results.nombre,res:results,listaLike:likes/*,token:token,id:results[0].id*/});
        return;
  }
  res.status(300).json({msn: "noExiste"});
  return
});

/*        GET users      */

router.get("/",/*midleware,*/ (req, res) => {
  var filter={};
  var params= req.query;
  var select="";
  var order = {};
  //console.log(res.body.estado);
  if(params.email!=null){
      var expresion =new RegExp(params.email);
      filter["email"]=expresion;
      console.log(filter);
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
    //console.log(bodydata);
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
    var user= await USERS.findOne({email:bodydata.email});
    if (user!=null) {
        res.status(300).json({msn: "Una cuenta ya existe con este correo"});
        return
    }
    if(bodydata.lastpass!=''){
        var user= await USERS.findOne({_id:params.id});
        //console.log(user)
        if(sha1(bodydata.lastpass)!=user.password){
            res.status(300).json({msn: "Contraseña actual no es correcta"});
            return;
        }
    }
    var allowkeylist = ["zonaHoraria","nombre","apellidos","password","tokenFB","email","fecha_nac"];
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
           console.log(err)
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
    var user= USERS.findOne({_id:params.id});
    user.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});
/**         LOGIN SOCIAL */
router.get("/social_login",/*midleware,*/ async(req, res) => {
    console.log(req.query);
    var params= req.query;
    if (params.email == null) {
        res.status(300).json({msn: "El parámetro email es necesario"});
        return;
    }
    var user= await USERS.findOne({email:params.email});
    if(user==null){
        res.status(300).json({msn: "no_existe"});
        return;
    }
    else{

        if (params.tkFB!='') {
            USERS.update({_id: user.id}, {$addToSet: {'tokensFBS': [{'tokenFB':params.tkFB}]}}, (err, docs) => {
                if (err) {
                   console.log("Existen problemas al ingresar tokenFB");
                   return;
               }
           });
        }
        var likes=await LIKE.findOne({"id_user":user._id});
        if(likes==null){
            likes={'listaLikes':[],'interacciones':[]};
        }
        res.status(200).json({msn:'Bienvenido: '+user.nombre,res:user,listaLike:likes});
        return;
    }
});

//      DATOS   GET COMPROBAR STORAGE
router.post("/compStorage",/*midleware,*/ async(req, res) => {

    var params= req.body;
    var user= await USERS.findOne({_id:params.id,email:params.email});
    if(user==null){
        res.status(300).json({msn: "no_existe"});
        return;
    }
    else{

        USERS.update({_id: user.id}, {$addToSet: {'tokensFBS': [{'tokenFB':params.tokenFB}]}}, (err, docs) => {
            if (err) {
               console.log("Existen problemas al ingresar tokenFB");
               return;
           }
       });
        var likes=await LIKE.findOne({"id_user":user._id});
        if(likes==null){
            likes={'listaLikes':[],'interacciones':[]};
        }
        res.status(200).json({res:user,listaLike:likes});
        return;
    }
});
 //async function _send_datas(user){}

 router.post("/verifi-mail", async(req, res, next) => {
    var params = req.body;
    //console.log(params);
    var usuario=await  USERS.findOne({_id:params.id});
    // console.log(usuario.estado);
    if (usuario==null) {
        res.status(300).json({msn: "El usuario no esta registrado"});
        return
    }
    //console.log(usuario);
    if(usuario.estado==params.codigo){
        USERS.updateOne({_id:  params.id}, {$set: {'estado':"verificada"}}, (err, docs) => {
            if (err) {
                res.status(500).json({msn: "error en la base de datos"});
                 return;
             } 
             res.status(200).json({msn:'cuenta verificada'});
         });
    }else{
        res.status(300).json({msn: "codigo incorrecto"});
    }
    return;

});

router.post("/reverifi", async(req, res, next) => {
    var params = req.body;
    var aleatorio = Math.round(Math.random()*999999);
    mailer.enviar_mail(params.email,aleatorio,params.nombre,res);
    //console.log(aleatorio);
    USERS.updateOne({_id:  params.id}, {$set: {'estado':aleatorio}}, (err, docs) => {
            if (err) {
                res.status(500).json({msn: "error en la base de datos"});
                 return;
             } 
             res.status(200).json({msn:'codigo actualizado'});
         });

});

router.post("/delToken", async(req, res, next) => {
    var params = req.body;
    console.log(params);
    USERS.updateOne({_id:  params.id}, {$pull: {'tokensFBS':{'tokenFB':params.tokenFB}}}, (err, docs) => {
            if (err) {
                res.status(500).json({msn: "error en la base de datos"});
                 return;
             } 
             res.status(200).json({msn:'codigo actualizado',docs});
         });

});

module.exports = router;
