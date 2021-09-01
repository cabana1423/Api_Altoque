var express = require("express");
var router = express.Router();
var PRODUC = require("../database/productosDB");
var PROP = require("../database/propiedadDB");
const fileUpload = require('express-fileupload');
const fileUploadService =  require('../services/upload.service');
var AWS = require('aws-sdk');
var sha1 = require("sha1");
const fs = require('fs');
const bucketAws ="productofiles"
//var midleware=require("./midleware");

router.use(fileUpload({
    limits: { fileSize: 8 * 1024 * 1024 },
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

//      POST    producto
router.post("/", /*midleware,*/ async(req, res) => {
    var params = req.query;
    obj = req.body;
    if (params.id == null) {
        res.status(300).json({msn: "ID de propiedad es necesaria"});
        return;
    }
    var prop =  await PROP.find({_id:params.id});
    var tamanio=req.files.media.length;
    if(tamanio>4){
        return res.status(300).send({msn : "el numero de archivos exede a lo permitido"});
    }
    vect = new Array(); Archs=new Array();
    var uploadRes;
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
    obj["img_produc"]=vect;
    obj["id_prop"]=params.id;
    obj["id_user"]=prop[0].id_user;
    var producDB = new PRODUC(obj);
    producDB.save((err, docs) => {
        if (err) {
            borrar(Archs);
            res.status(300).json(err);
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
    //imagen up
    var produc =  await PRODUC.find({_id:params.id});
    var img=produc[0].img_produc;
    var tamanio=req.files.media.length;
    vect = new Array();
    var uploadRes;
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
    PRODUC.update({_id:params.id}, 
    {$set: {"img_produc":img}}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
            borrar(vect);
             return;
         }
         if(docs.nModified==0){
            borrar(vect);
         }
         res.status(200).json(docs);
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
    PRODUC.update({"img_produc.key":keys[0]}, 
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
    //console.log("es estes"+select);
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
});;

    /*        PUT prop      */
 router.put("/",/*midleware,*/ async(req, res) => {
    var params = req.query;
    var bodydata = req.body;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var allowkeylist = ["nombre","precio","descripcion"];
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
    var produc= PRODUC.find({_id:params.id});
    produc.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});
module.exports = router;