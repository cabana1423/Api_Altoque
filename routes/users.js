var express = require('express');
var router = express.Router();
const fileUpload = require('express-fileupload');
const fileUploadService =  require('../services/upload.service');
var AWS = require('aws-sdk');
var sha1 = require("sha1");
const fs = require('fs');
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
    //img user datos
    var uploadRes;
        if(req.files && req.files.media){
            const file= req.files.media;
            uploadRes = await fileUploadService.uploadFileToAws(file, bucketAws);
            //console.log(uploadRes);    
        }
    const keyF=uploadRes.key;
    const urlF=uploadRes.Url;
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
//      Get img users
router.get("/getfile", async(req, res, next) => {
    var params = req.query;
    if (params == null) {
        res.status(300).json({
            msn: "Error es necesario un ID"
        });
        return;
    }
    var user =  await USERS.find({'img_user.sha': params.id});
    console.log(user);
    if (user.length > 0) {
        var path = user[0].img_user[0].pathfile;
        res.sendFile(path);
        return;
    }
    res.status(300).json({
        msn: "Error en la petición"
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
