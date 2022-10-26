var express = require("express");
var router = express.Router();
const fileUpload = require('express-fileupload');
const fileUploadService =  require('../services/upload.service');
const verificaionFiles =  require('../services/verificar.service');
var AWS = require('aws-sdk');
var PROP = require("../database/propiedadDB");
var PRODUC = require("../database/productosDB");
var USERS = require("../database/usersDB");
const bucketAws ="propiedadesfiles"
//var midleware=require("./midleware");
router.use(fileUpload({
    limits: { fileSize: 1 * 1024 * 1024 },
}
));

async function borrar(Archs){
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

//  POST prop

router.post("/", /*midleware,*/ async(req, res) => {
    var params = req.query;
    var obj={};
    obj = req.body;
    var pr=req.body;
    if (params.id == null) {
        res.status(300).json({msn: "El id usuario es necesario"});
             return;
    }
    //imagen up :)

    if(req.files && req.files.media){
        if(req.files.media.length==undefined){
            req.files.media=[req.files.media];
        }
        var tamanio=req.files.media.length;
        if(tamanio>2){
            return res.status(300).send({msn : "el numero de archivos exede a lo permitido"});
        }
        vect = new Array(); Archs=new Array();
        var uploadRes;
        for(var i=0;i<tamanio;i++){
            if(req.files && req.files.media[i]){
                const file= req.files.media[i];
                var verificacion=await verificaionFiles.verificarFile(file);
                if (verificacion=='baneado') {
                    return res.status(300).json({msn:'esta usando imagenes que van en contra de nuestras politicas'});
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
                Archs.push(arch);
            }
        }
    }else{
        return res.status(300).json({msn:'error al subir los archivos'});
    }   

    //prop up
    obj["img_prop"]=vect;
    obj["location"]={coordinates:[req.body.long,req.body.lat]};
    obj["id_user"]=params.id;
    var propDB = new PROP(obj);
    //console.log(obj);
    propDB.save((err, docs) => {
        if (err) {
            borrar(Archs);
            return res.status(300).json(err);
        }
        res.json(docs);
        USERS.updateOne({_id:params.id}, {$set: {"tipo":'propietario'}}, (err, docs) => {
        if (err) {
            console.log("Existen problemas al ingresar ZonaHoraria");
             return;
         } 
         });
        return;
    });

});

/*  ADD IMG PROPIEDADES*/
router.post("/addimg", /*midleware,*/ async(req, res) => {
    var params = req.query;
    if (params.id == null) {
        res.status(300).json({msn: "El id propiedad es necesario"});
             return;
    }
    //imagen up
    var prop =  await PROP.find({_id:params.id});
    var img=prop[0].img_prop;
    var uploadRes;
    if(req.files && req.files.media){
        const file= req.files.media;
         var verificacion=await verificaionFiles.verificarFile(file);
                if (verificacion=='baneado') {
                    return res.status(300).json({msn:'esta usando imagenes que van en contra de nuestras politicas'});
                }
        uploadRes = await fileUploadService.uploadFileToAws(file, bucketAws);
        img.push(uploadRes);   
    }
    PROP.update({_id:params.id}, 
    {$set: {"img_prop":img}}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
            var ke=[{"Key":uploadRes.key}];
            borrar(ke);
             return;
         }
         if(docs.nModified==0){
            var ke=[{"Key":uploadRes.key}];
            borrar(ke);
         }
         res.status(200).json({msn:img[1]});
         console.log(img[1]);
     });
    return;
});

/** DELETE  IMG PROPIEDAD */
router.post("/deleteimg", /*midleware,*/ async(req, res) => {
    var params = req.query;
    if (params.k == null) {
        res.status(300).json({msn: "El key es necesario"});
             return;
    }
    //imagen up
    var prop =  await PROP.find({"img_prop.key":params.k});
    //console.log(prop);
    var img=prop[0].img_prop;
    for(var i=0;i<img.length;i++){
        if(img[i].key==params.k){
            img.splice(i,1);
            break;
        }
    }
    //console.log(img);
    PROP.update({"img_prop.key":params.k},
    {$set: {"img_prop":img}}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         if(docs.nModified==1){
            var ke=[{"Key":params.k}];
            borrar(ke);
         }
         res.status(200).json(docs);
     });
    return;
});

// PUT image propiedad
router.put("/file", async(req, res, next) => {
    var params = req.query;
    if (params.key == null) {
        res.status(300).json({msn: "Error es necesario el key"});
        return;
    }
    //var prop =  await PROP.find({"img_prop.key":params.key});
    //console.log(prop);
    var uploadRes;
    if(req.files && req.files.media){
        const file= req.files.media;
        var verificacion=await verificaionFiles.verificarFile(file);
             if (verificacion=='baneado') {
                    return res.status(300).json({msn:'esta usando imagenes que van en contra de nuestras politicas'});
            }
        uploadRes = await fileUploadService.uploadFileToAws(file, bucketAws); 
    }
    const keyF=uploadRes.key;
    const urlF=uploadRes.Url;
    PROP.updateOne({"img_prop.key":params.key}, 
    {$set: {"img_prop.$[elem]":{"Url":urlF,"key":keyF}}},
    { multi: true,arrayFilters: [{'elem.key': params.key}]}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
            var ke=[{"Key":keyF}];
            borrar(ke);
             return;
         }
         if(docs.nModified==1){
            var ke=[{"Key":params.key}];
            borrar(ke);
         }else{
            var ke=[{"Key":keyF}];
         borrar(ke);
         }
         res.status(200).json(docs);
     });
    return;
});



/*        GET prop      */

router.get("/",/*midleware,*/ (req, res) => {
    var filter={};
    var params= req.query;
    var select="";
    var order = {};
    if(params.nombre!=null){
        var expresion =new RegExp(params.nombre);
        filter["nombre"]=expresion;
    }if(params.id_u!=null){
        var expresion =new RegExp(params.id_u);
        filter["id_user"]=expresion;
    }
    if(params.id_vig!=null){
        var expresion =new RegExp(params.id_vig);
        filter["id_user"]=expresion;
        filter["estado"]={$in:['vigente','suspendido']};
    }
    if(params.estado!=null){
        var expresion =new RegExp(params.estado);
        filter["estado"]=expresion;
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
    var propDB=PROP.find(filter).
    select(select).
    sort(order);
    propDB.exec((err, docs)=>{
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
    var propiedad=await PROP.find({_id:req.query.id});
    var img=propiedad[0].img_prop;
    const vec=new Array();
    for(var i=0;i<img.length;i++){
        let aux={
            Key:img[i].key
        }
        vec.push(aux);
    }
    PROP.remove({_id:req.query.id}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         if(docs.deletedCount==1){
            borrar(vec);
         }
         delete_productos(req.query.id)
         res.status(200).json(docs);
     });
});

//      BORAR PRODUCTOS SEGUN PROP//
async function delete_productos(id_prop){
    PRODUC.remove({"id_prop":id_prop}, (err, docs) => {
        if (err) {
            console.log(err);
            // res.status(500).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         console.log(docs);
         //res.status(200).json(docs);
     });

}
    
 /*        PUT prop      */

 router.put("/",/*midleware,*/ async(req, res) => {
    var params = req.query;
    var bodydata = req.body;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var allowkeylist = ["nombre","nit","propietario","telefono","estado",'entregas'];
    var keys = Object.keys(bodydata);
    var updateobjectdata = {};
    for (var i = 0; i < keys.length; i++) {
        if (allowkeylist.indexOf(keys[i]) > -1) {
            updateobjectdata[keys[i]] = bodydata[keys[i]];
        }
    }
    /*if(bodydata.calle!=null){
        updateobjectdata["hubicacion"]=[{"calle":bodydata.calle,"lat":bodydata.lat,"lon":bodydata.lon}];
    }*/
    PROP.updateOne({_id:  params.id}, {$set: updateobjectdata}, (err, docs) => {
       if (err) {
           res.status(500).json({msn: "no se pudo completar la operación"});
            return;
        } 
        res.status(200).json(docs);
    });

});


/*        GET prop por id      */

router.get("/id",/*midleware,*/ async(req, res) => {

    var params= req.query;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var prop= PROP.findOne({_id:params.id});
    prop.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});

//      GET POR DISTANCIA
//var exp=new RegExp(params.dist);
router.get("/dist",/*midleware,*/(req, res) => {
    //var obj={}
    var params= req.query; 
    var distan=9000
    if(params.dist!=null){
       distan=params.dist
        console.log(distan);
    }
    var dist=PROP.find(
    {"nombre":RegExp(params.pal),
        location: {
         $near: {
          $maxDistance: distan,
          $geometry: {
           type: "Point",
           coordinates: [params.long, params.lat]
          }
         }
        }
       },
       );
    dist.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: err});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});


module.exports = router;