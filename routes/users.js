var express = require('express');
var router = express.Router();
const fileUpload = require('express-fileupload');
const fileUploadService =  require('../services/upload.service');
const verificaionFiles =  require('../services/verificar.service');
const mailer =require('../send_email/signup_email');
var AWS = require('aws-sdk');
var sha1 = require("sha1");
var jwt=require("jsonwebtoken");
var USERS = require("../database/usersDB");
const LIKE = require('../database/likesDB');
const bucketAws ="usuariosfiles"
const config = require('./config.json')
var midleware=require("./jsonwebtoken");
const PRODUC = require('../database/productosDB');
const PROP = require('../database/propiedadDB');


router.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
}
));

async function borrar(Archs){
    if (Archs[0]['Key']==null) {
        return;
    }
    AWS.config.update({
        accessKeyId: "AKIAZNICKCXYYPV6L4WA",
        secretAccessKey: "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",
        region: "sa-east-1",
    });
    const s3 = new AWS.S3();
    
    const params = {
        Bucket: bucketAws,
        Delete: {
            Objects:Archs
        }

        }
        try {
            await s3.deleteObjects(params).promise()
            console.log("file deleted Successfully")
        }
        catch (err) {
            console.log("ERROR in file Deleting : " + JSON.stringify(err))
        }
}


//      BORRAR VARIOS ARCHIVOS
async function borrarVarios(Archs,bucket){
    AWS.config.update({
        accessKeyId: "AKIAZNICKCXYYPV6L4WA",
        secretAccessKey: "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",
        region: "sa-east-1",
    });
    const s3 = new AWS.S3();
    
    const params = {
        Bucket: bucket,
        Delete: {
            Objects:Archs
        }
        
        }
        try {
            await s3.deleteObjects(params).promise()
            console.log("file deleted Successfully")
        }
        catch (err) {
            console.log("ERROR in file Deleting : " + JSON.stringify(err))
        }
}



router.get('/secure', midleware,(req,res) => {
    // all secured routes goes here
    res.send('I am secured...')
})

router.post('/token',async (req,res) => {
    var postData = req.body
    var user = await USERS.findOne({_id:postData.id });
    if (user.refreshToken==postData.refreshToken) {
        const user = {
            "email": postData.email,
            "name": postData.nombre
        }
        const token = jwt.sign(user, config.secret, { expiresIn: config.tokenLife})
        const response = {
            "token": token,
        }
        // update the token in the list
        // tokenList[postData.refreshToken].token = token
        res.status(200).json(response);
        console.log(response);
    } else {
        res.status(404).send('error al generar tokens');
    }
});



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
        var verificacion=await verificaionFiles.verificarFile(file);
        if (verificacion=='baneado') {
                return res.status(300).json({msn:'esta imagen va en contra nuestras politicas'});
         }
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
            borrar([{'Key':keyF}]);
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
        var verificacion=await verificaionFiles.verificarFile(file);
        if (verificacion=='baneado') {
                    return res.status(300).json({msn:'esta publicacion va en contra nuestras politicas'});
                }
        uploadRes = await fileUploadService.uploadFileToAws(file, bucketAws); 
    }
    const keyF=uploadRes.key;
    const urlF=uploadRes.Url;
    USERS.updateOne({_id:  params.id}, {$set: {"img_user":[{"Url":urlF,"key":keyF}]}}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         borrar([{'Key':exkey}]);
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
    //      jwt finish

      USERS.update({_id: results.id}, {$addToSet: {'tokensFBS': [{'tokenFB':params.tokenFB}]},$set: {'refreshToken':response.refreshToken}}, (err, docs) => {
                 if (err) {
                    console.log("Existen problemas al ingresar tokenFB");
                    return;
                }
            });
        
        var likes=await LIKE.findOne({"id_user":results._id});
        //console.log(likes);
        if(likes==null){
            likes={'listaLikes':[],'interacciones':[]};
        }
        res.status(200).json({msn: "Bienvenido: "+results.nombre,res:results,listaLike:likes,tokens:response});
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
    const producImg=new Array();
    var productos=await PRODUC.find({'id_user':req.query.id});
    for (let j = 0; j < productos.length; j++) {
        var img=productos[j].img_produc;
        for(var i=0;i<img.length;i++){
            let aux={
                Key:img[i].key
            }
            producImg.push(aux);
        }
    }
    const propImg=new Array();
    var propiedad=await PROP.find({'id_user':req.query.id});
    for (let j = 0; j < propiedad.length; j++) {
        var img=propiedad[j].img_prop;
        for(var i=0;i<img.length;i++){
            let aux={
                Key:img[i].key
            }
            propImg.push(aux);
        }
    }
    const userImg=new Array();
    PRODUC.remove({'id_user':req.query.id }, function(err,docs) {
        if (err) {
            res.status(300  ).json({msn: "Error en eliminar los productos"});
            return;
        }
            if (docs.deletedCount>0) {
                borrarVarios(producImg,'productofiles');
            }
            PROP.remove({'id_user':req.query.id }, async function(err) {
                if (err) {
                    res.status(300).json({msn: "Error en eliminar los propiedad"});
                    return;
                }
                if (docs.deletedCount>0) {
                    borrarVarios(propImg,'propiedadesfiles');
                }
                var user=await USERS.findOne({_id:req.query.id});
                if (user.img_user[0].key!='') {
                    userImg.push({'Key':user.img_user[0].key});
                }
                
                USERS.remove({ _id: req.query.id }, function(err,docs) {
                    if (err) {
                        res.status(300).json({msn: "Error en eliminar al usuario"});
                        return;
                    }
                    //console.log(docs);
                    if (docs.deletedCount>0) {
                        borrar(userImg);
                    }
                    return res.status(200).json({msn:'usuario eliminado'})
                });
            });
    });
});

 /*        PUT users      */

 router.put("/",/*midleware,*/ async(req, res) => {
    var params = req.query;
    var bodydata = req.body;
    console.log(req.body)
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
    if (bodydata.email!=null) {
        var user= await USERS.findOne({email:bodydata.email});
    if (user!=null) {
        res.status(300).json({msn: "Una cuenta ya existe con este correo"});
        return
    }
    }
    if(bodydata.lastpass!=''){
        var user= await USERS.findOne({_id:params.id});
        //console.log(user)
        if(sha1(bodydata.lastpass)!=user.password){
            res.status(300).json({msn: "Contraseña actual no es correcta"});
            return;
        }
    }
    var allowkeylist = ["estado","zonaHoraria","nombre","apellidos","password","tokenFB","email","fecha_nac","telefono"];
    var keys = Object.keys(bodydata);
    var updateobjectdata = {};
    for (var i = 0; i < keys.length; i++) {
        if (allowkeylist.indexOf(keys[i]) > -1) {
            updateobjectdata[keys[i]] = bodydata[keys[i]];
        }
    }
    //console.log(updateobjectdata);
    USERS.updateOne({_id:  params.id}, {$set: updateobjectdata}, (err, docs) => {
       if (err) {
           res.status(500).json({msn: "Existen problemas en la base de datos"});
           console.log(err)
            return;
        } 
        //console.log(bodydata.estado)
        if (bodydata.estado!=null) {
            if(bodydata.estado=='verificada')bodydata.estado='vigente'
            actualizarDemas(params.id,bodydata.estado, res,req);
        }else{
            res.status(200).json(docs);
        }
    });

});

async function actualizarDemas(id_user,estado,res,req) {
    PROP.updateMany({'id_user':  id_user}, {$set: {'estado':estado}}, (err, docs) => {
        if (err) {
            res.status(300).json({msn: "Existen problemas en la base de datos"});
             return;
         } 
         PRODUC.updateMany({'id_user':id_user}, {$set: {'estado':estado}}, (err, docs) => {
            if (err) {
                res.status(300).json({msn: "Existen problemas en la base de datos"});
                 return;
             } 
             res.status(200).json({msn:'datos actualizados'});
         });
     });
}





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
    else{    const person = {
        "email": user.email,
        "name": user.nombre
    }
    const token = jwt.sign(person, config.secret, { expiresIn: config.tokenLife})
    const refreshToken = jwt.sign(person, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife})
    const response = {
        "status": "Logged in",
        "token": token,
        "refreshToken": refreshToken,
    }
    //      jwt finish

        if (params.tkFB!='') {
            
      USERS.update({_id: user.id}, {$addToSet: {'tokensFBS': [{'tokenFB':params.tokenFB}]},$set: {'refreshToken':response.refreshToken}}, (err, docs) => {
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
        res.status(200).json({msn:'Bienvenido: '+user.nombre,res:user,listaLike:likes,tokens:response});
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
        const person = {
            "email": user.email,
            "name": user.nombre
        }
        const token = jwt.sign(person, config.secret, { expiresIn: config.tokenLife})
        const refreshToken = jwt.sign(person, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife})
        const response = {
            "status": "Logged in",
            "token": token,
            "refreshToken": refreshToken,
        }
        //      jwt finish
    
          USERS.update({_id: user.id}, {$addToSet: {'tokensFBS': [{'tokenFB':params.tokenFB}]},$set: {'refreshToken':response.refreshToken}}, (err, docs) => {
                     if (err) {
                        console.log("Existen problemas al ingresar tokenFB");
                        return;
                    }
                });
        var likes=await LIKE.findOne({"id_user":user._id});
        if(likes==null){
            likes={'listaLikes':[],'interacciones':[]};
        }
        res.status(200).json({res:user,listaLike:likes,tokens:response});
        return;
    }
});
 //async function _send_datas(user){}

 router.post("/verifi-mail", async(req, res, next) => {
    var params = req.body;
    //console.log(params);
    var usuario=await  USERS.findOne({_id:params.id});
    var parametro = usuario.estado;
    // console.log(usuario.estado);
    if (usuario==null) {
        res.status(300).json({msn: "El usuario no esta registrado"});
        return
    }
    //console.log(usuario);
    var auxiliar={'estado':"verificada"};
    if (params.tipo!=null&&params.tipo=='password') {
        parametro=usuario.verificacion;
        var auxiliar={'verificacion':"pass actualizado"};
    }
    if(parametro==params.codigo){
        USERS.updateOne({_id:  params.id}, {$set: auxiliar}, (err, docs) => {
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
    console.log(req.body)
    var params = req.body;
    var aleatorio = Math.round(Math.random()*999999);
    var variable={"estado":aleatorio};
    if (params.parametro!=null&&params.parametro=='password') {
        console.log('no entro')
        variable={"verificacion":aleatorio};
    }
    
    mailer.enviar_mail(params.email,aleatorio,params.nombre,res);
    console.log(variable);
    USERS.updateOne({_id:  params.id}, {$set: variable}, (err, docs) => {
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
