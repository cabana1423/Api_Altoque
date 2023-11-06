var express = require("express");
var router = express.Router();
var PRODUC = require("../database/productosDB");
var PROP = require("../database/propiedadDB");
var LIKE = require("../database/likesDB");
const fileUpload = require('express-fileupload');
const fileUploadService =  require('../services/upload.service');
const verificaionFiles =  require('../services/verificar.service');
var AWS = require('aws-sdk');
var sha1 = require("sha1");
const fs = require('fs');
const { arch } = require("os");
const { verificarFile } = require("../services/verificar.service");
const bucketAws ="producto-files"
var midleware=require("./jsonwebtoken");

router.use(fileUpload({
    // useTempFiles:true,
    tempFileDir:'/tmp',
    limits: { fileSize: 10 * 1024 * 1024 },
}
));

async function borrar(Archs){
    AWS.config.update({
        accessKeyId: "AKIAT7B3USE2DARGPK5A",
        secretAccessKey: "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",
        region: "us-east-2",
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

//      POST    producto
router.post("/", /*midleware,*/ async(req, res) => {
    var params = req.query;
    obj = req.body;
    if (params.id == null) {
        res.status(300).json({msn: "ID de propiedad es necesaria"});
        return;
    }
    var prop =  await PROP.find({_id:params.id});

    if(req.files && req.files.media)
    {    if(req.files.media.length==undefined){
            req.files.media=[req.files.media];
        }
        var tamanio=req.files.media.length;
        if(tamanio>5){
            return res.status(300).send({msn : "el numero de archivos exede a lo permitido"});
        }
        vect = new Array(); images=new Array();
        var uploadRes;
        var verificacion;
        for(var i=0;i<tamanio;i++){
            if(req.files && req.files.media[i]){
                const file= req.files.media[i];
                verificacion=await verificaionFiles.verificarFile(file);
                if (verificacion=='baneado') {
                    return res.status(300).json({msn:'esta publicacion va en contra nuestras politicas'});
                }
            }
        }
        for(var i=0;i<tamanio;i++){
            if(req.files && req.files.media[i]){
                const file= req.files.media[i];
                uploadRes = await fileUploadService.uploadFileToAws(file, bucketAws);
                let arch={
                    "Key":uploadRes.key
                }
                vect.push(uploadRes);
                images.push(arch);
            }
         }
         }else{
            return res.status(300).json({msn:'error al subir los archivos'});
        }
    obj["img_produc"]=vect;
    obj["id_prop"]=params.id;
    obj["id_user"]=prop[0].id_user;
    var producDB = new PRODUC(obj);
    producDB.save((err, docs) => {
        if (err) {
            borrar(images);
            res.status(300).json(err);
            console.log(err);
            return;
        }
        res.json(docs);
        return;
    });

});

/*  ADD IMG PRODUCTO    */
router.post("/addimg", /*midleware,*/ async(req, res) => {
    var params = req.query;
    if (params.id == null) {
        res.status(300).json({msn: "El id producto es necesario"});
             return;
    }
    //      VERIFICACION Y SUBIDA DE IMAGENES
    var img=new Array();
    if(req.files && req.files.media){
        
        if (req.files.media.length==undefined) {
            req.files.media=[req.files.media];
        }
        var tamanio=req.files.media.length;
        vect = new Array();
        var uploadRes;
        var verificacion;
        for(var i=0;i<tamanio;i++){
            if(req.files && req.files.media[i]){
                const file= req.files.media[i];
                verificacion=await verificaionFiles.verificarFile(file);
                if (verificacion=='baneado') {
                    return res.status(300).json({msn:'esta publicacion va en contra nuestras politicas'});
                }
            }
        }
        for(var i=0;i<tamanio;i++){
            if(req.files && req.files.media[i]){
                const file= req.files.media[i];
                uploadRes = await fileUploadService.uploadFileToAws(file, bucketAws);
                let arch={
                    "Key":uploadRes.key
                }
                vect.push(arch);
                img.push(uploadRes);
            }
        }
    }else{
        return res.status(300).json({msn:'error al subir los archivos'});
    }
    PRODUC.updateOne({_id:params.id},
        {$push: {"img_produc":{$each:img}}}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
            borrar(vect);
             return;
         }
         if(docs.nModified==0){
            borrar(vect);
         }
         res.status(200).json(img);
         console.log(img);
     });
    return;
});

/**     DELETE IMGS PRODUCTO      */
router.post("/deleteimg", /*midleware,*/ async(req, res) => {
    var params = req.query;
    if (params.k == null) {
        res.status(300).json({msn: "El key es necesario"});
             return;
    }
    //imagen up
    let keys=params.k.split(',');
    var produc =  await PRODUC.find({"img_produc.key":keys[0]});
    var img=produc[0].img_produc;
    for(var i=0;i<keys.length;i++){
        for(var j=0;j<img.length;j++){
            if(keys[i]==img[j].key){
                img.splice(j,1);
                break;
            }
        }
    }
    PRODUC.updateOne({"img_produc.key":keys[0]}, 
    {$set: {"img_produc":img}}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         if(docs.nModified==1){
            for(var i=0;i<keys.length;i++){
                var aux={Key:keys[i]};
                keys[i]=aux;
            }
            borrar(keys);
         }
         res.status(200).json(img);
     });
    return;
});     


/*        GET prod general      */
router.get("/",/*midleware,*/ (req, res) => {
    var filter={};
    filter["estado"]='vigente';
    var params= req.query;
    var select="";
    var order = {};
    if(params.nombre!=null){
        var expresion =new RegExp(params.nombre);
        filter["nombre"]=expresion;

    }if(params.id_p!=null){
        var expresion =new RegExp(params.id_p);
        filter={};
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
  });

  /*        DELETE prop      */
  router.delete("/",/*midleware,*/ async(req, res) => {
    if (req.query.id == null) {
        res.status(300).json({msn: "no existe id"});
        return;
    }
    var producto=await PRODUC.find({_id:req.query.id});
    var img=producto[0].img_produc;
    const vec=new Array();
    for(var i=0;i<img.length;i++){
        let aux={
            Key:img[i].key
        }
        vec.push(aux);
    }
    PRODUC.remove({_id:req.query.id}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         if(docs.deletedCount==1){
            borrar(vec);
         }
         res.status(200).json(docs);
     });
});

    /*        PUT producto     */
 router.put("/",/*midleware,*/ async(req, res) => {
    var params = req.query;
    var bodydata = req.body;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var allowkeylist = ["nombre","precio","descripcion","estado","comision"];
    var keys = Object.keys(bodydata);
    var updateobjectdata = {};
    for (var i = 0; i < keys.length; i++) {
        if (allowkeylist.indexOf(keys[i]) > -1) {
            updateobjectdata[keys[i]] = bodydata[keys[i]];
        }
    }
    PRODUC.update({_id:  params.id}, {$set: updateobjectdata}, (err, docs) => {
       if (err) {
           res.status(500).json({msn: "Existen problemas en la base de datos"});
            return;
        } 
        res.status(200).json(docs);
    });

});
// GET id 
router.get("/id",/*midleware,*/ async(req, res) => {
    var params= req.query;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var produc= PRODUC.findOne({_id:params.id});
    produc.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});
router.get("/idnot",/*midleware,*/ async(req, res) => {
    var params= req.query;
    if (params.id_not == null||params.id_p == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var produc= PRODUC.find({_id:{$ne:params.id_not},"id_prop":params.id_p,});
    produc.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});



//      POST    LIKES producto
router.post("/likes", /*midleware,*/ async(req, res) => {
    console.log(req.body);
    var obj={};
    var aux=await LIKE.findOne({"id_user":req.query.id_u})
    if(aux!=null){
        addLikes(req.query.id_u,req.body.id_producto,req.body.categoria,res,req);
        return;
    }
    obj["id_user"]=req.query.id_u
    obj["listaLikes"]={"id_producto":req.body.id_producto};
    obj["interacciones"]=[req.body.categoria];
    var likeDb = new LIKE(obj);
    likeDb.save((err, docs) => {
        if (err) {
            res.status(300).json(err);
            return;
        }
        sumLikes(req.body.id_producto,res,req);
        res.json({lista:docs.listaLikes,interacciones:docs.interacciones});
        
        return ;
    });

});
async function addLikes(id_user,id_producto,categoria,res,req) {

    //AGREGANDO SOLO UN ELEMENTO    
    LIKE.updateOne({"id_user":id_user}, {$addToSet: {'listaLikes': {"id_producto":id_producto},'interacciones':categoria}}, async(err, docs) => {
            if (err) {
                res.status(500).json({msn: "Existen problemas en la base de datos"});
                 return;
             }
             sumLikes(req.body.id_producto,res,req);
             var listas =  await LIKE.findOne({'id_user':id_user});
             res.status(200).json({msn:docs,lista:listas.listaLikes,interacciones:listas.interacciones});
             console.log(listas);
             return;
         });
    return;
}
async function sumLikes(id_producto,res,req) {
    PRODUC.updateOne({_id:id_producto}, 
        {$inc: {"numLikes":1}}, (err, docs) => {
            if (err) {
                console.log("error");
                 return;
             }
         });
        return;
}
async function restLikes(id_producto,res,req) {
    PRODUC.updateOne({_id:id_producto}, 
        {$inc: {"numLikes":-1}}, (err, docs) => {
            if (err) {
                console.log("error");
                 return;
             }
         });
        return;
}
// GET LIKES BROOOOO
router.get("/likes",/*midleware,*/ (req, res) => {
    var filter={};
    var params= req.query;
    var select="";
    var order = {};
    if(params.id_u!=null){
        var expresion =new RegExp(params.id_u);
        filter["id_user"]=expresion;
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
    var likeDB=LIKE.find(filter).
    select(select).
    sort(order);
    likeDB.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
  });

  router.post("/deletelike", /*midleware,*/ async(req, res) => {
    var params = req.query;
    if (params.id_u == null||params.id_p == null) {
        res.status(300).json({msn: "El id es necesario"});
             return;
    }
    // QUITANDO UN ELEMENTO..
    LIKE.updateOne({"id_user":params.id_u}, 
    {$pull: {"listaLikes":{"id_producto":params.id_p}}}, async(err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         var listas =  await LIKE.findOne({'id_user':params.id_u});
         restLikes(params.id_p,res,req);
         res.status(200).json({msn:docs,lista:listas.listaLikes});
     });
    return;
});

// ANIADIR COMENTARIOS

router.post("/coment", /*midleware,*/ async(req, res) => {
    var params=req.body;
    var coment={'nombre':params.nombre,'url':params.url,
    'comentario':params.comentario,'fecha':params.fecha,'id_u':params.id_u};
    console.log(coment);
    PRODUC.updateOne({"_id":req.query.id},
        {$push: {"comentarios":{$each:[coment]}}}, async(err, docs) => {
            if (err) {
                res.status(500).json({msn: "Existen problemas en la base de datos"});
                 return;
             }
             res.status(200).json(docs);
         });
        return;

});

     //GET PROP SEGUN FILTROS
router.get("/interac", /*midleware,*/ async(req, res) => {
    var params=req.query;
    //console.log(params);
    var limit=0;
    var listaInteraccion=params.categorias.split(",");
    //console.log(listaInteraccion);
    if (params.limite=='limitado') {
        limit=50;
    }
    //console.log(listaInteraccion);
    if (listaInteraccion.length<2) {
        var producDB=PRODUC.find({'nombre':RegExp(''),'estado':'vigente'}).limit(limit);
    } else {
        var filter={'categoria':{$in:listaInteraccion},'estado':'vigente'};
    var producDB=PRODUC.find(filter).
    sort({'fecha_reg':-1}).limit(limit);
    }
    producDB.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        if (params.limite=='limitado') {
            mostrarPopular(docs,res,req);
        }else{
            res.status(200).json(docs);
             return;
        }
    });

});

async function mostrarPopular(docs1,res,req) {
    var producDB=PRODUC.find({'estado':'vigente'}).
    sort({'numLikes':-1}).limit(30);

    producDB.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json({populares:docs,interes:docs1});
        return;
    });
}

router.get("/mostProd", /*midleware,*/ async(req, res) => {
    var params=req.query;
    var masProductosTienda;
    var mismaCatego;
    console.log(params);
    //misma tienda
    if(params.id!=null){
         masProductosTienda =  await PRODUC.find({'id_prop':params.id,'estado':'vigente'});
        if (masProductosTienda==null) {
            masProductosTienda=[];
         }
    }
    //misma categoria
    if(params.cat!=null){
        var mismaCatego =  await PRODUC.find({'categoria':params.cat,'estado':'vigente'}, null, {limit: 20});
        if (mismaCatego==null) {
            // console.log(mismaCatego)
            mismaCatego=[];
         }
    }
    res.status(200).json({masProductos:masProductosTienda
                        ,mismaCatego:mismaCatego});
    return;

});
//          DELETE COMENTARIOS
router.post("/deleteComentario",/*midleware,*/ async(req, res) => {
    var params=req.query
    if (params.idP == null) {
        res.status(300).json({msn: "no existe id COMENTARIO"});
        return;
    }
    PRODUC.updateOne({_id:params.idP},
    {$pull: {"comentarios":{_id:params.idC}}}, async(err, docs) => {
        if (err) {
            res.status(300).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         res.status(200).json(docs);
         //console.log(docs);
     });
    return;
});

router.post("/save", /*midleware,*/ async(req, res) => {
    var params=req.body;
    //console.log(params);
    var listaSave=params.save.split(",");
    var filter={_id:{$in:listaSave}};
    var producDB=PRODUC.find(filter).
    sort({'numLikes':-1})
    producDB.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
            res.status(200).json(docs);
             return;
    });

});


module.exports = router;