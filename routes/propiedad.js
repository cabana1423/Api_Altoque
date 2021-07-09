var express = require("express");
var router = express.Router();
const fileUpload = require('express-fileupload');
const fileUploadService =  require('../services/upload.service');
var AWS = require('aws-sdk');
var PROP = require("../database/propiedadDB");
var USERS = require("../database/usersDB");
var sha1 = require("sha1");
const fs = require('fs');
const bucketAws ="propiedadfiles"
//var midleware=require("./midleware");
router.use(fileUpload({
    limits: { fileSize: 1 * 1024 * 1024 },
}
));

async function borrar(Archs){
    console.log(Archs);
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
    //imagen up
    var tamanio=req.files.media.length;
    if(tamanio>2){
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
    //prop up
    obj["img_prop"]=vect;
    obj["ubicacion"]=[{"lat":pr.lat,"lon":pr.lon,"calle":pr.calle}];
    obj["id_user"]=params.id;
    var propDB = new PROP(obj);
    propDB.save((err, docs) => {
        if (err) {
            borrar(Archs);
            res.status(300).json(err);
            return;
        }
        res.json(docs);
        return;
    });

});
// PUT image propiedad
router.put("/file", async(req, res, next) => {
    var params = req.query;
    if (params.key == null) {
        res.status(300).json({msn: "Error es necesario el key"});
        return;
    }
    var prop =  await PROP.find({"img_prop.key":params.key});
    console.log(prop);
    var uploadRes;
    if(req.files && req.files.media){
        const file= req.files.media;
        uploadRes = await fileUploadService.uploadFileToAws(file, bucketAws); 
    }
    const keyF=uploadRes.key;
    const urlF=uploadRes.Url;
    PROP.update({"img_prop.key":params.key}, 
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
        res.status(300).json({
        msn: "no existe id"
        });
        return;
    }
    var propiedad=await PROP.find({_id:req.query.id});
    var r = await PROP.remove({_id: req.query.id});
    console.log(propiedad[0].img_prop.length);
    for(var i=0;i<propiedad[0].img_prop.length;i++){
        var pathfiles=propiedad[0].img_prop[i].pathfile;
        try {
            fs.unlinkSync(pathfiles)
            console.log('File removed')
          } catch(err) {
            console.error('Something wrong happened removing the file', err)
          }
    }

    res.status(300).json(r);
});
    
 /*        PUT prop      */

 router.put("/",/*midleware,*/ async(req, res) => {
    var params = req.query;
    var bodydata = req.body;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var allowkeylist = ["nombre","nit","propietario","telefono"];
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
    PROP.update({_id:  params.id}, {$set: updateobjectdata}, (err, docs) => {
       if (err) {
           res.status(500).json({msn: "Existen problemas en la base de datos"});
            return;
        } 
        res.status(200).json(docs);
    });

});

 /*        PUT img propiedades      */

 router.put("/put-img",/*midleware,*/ async(req, res) => {
    var params = req.query;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var propiedad=await PROP.find({_id:params.id});
    var titulo=propiedad[0].img_prop[0].titulo;
    //new img
    var img=req.files.file;
    var path= __dirname.replace(/\/routes/g, "/img_prop");
    var date =new Date();
    var sing  =sha1(date.toString()).substr(1,12);
    var totalpath = path + "/" + sing + "_" + img.name.replace(/\s/g,"_");
    PROP.update({_id:  params.id}, {$set: {"img_prop":[{"titulo":sing+ "_" +img.name.replace(/\s/g,"_"),"pathfile":totalpath}]}}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         img.mv(totalpath, async(err) => {
            if (err) {
                return res.status(300).send({msn : "Error al escribir el archivo en el disco duro"});
            } 
        });
         try {
            fs.unlinkSync('./img_prop/'+titulo)
            console.log('File removed')
          } catch(err) {
            console.error('Something wrong happened removing the file', err)
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
    var prop= PROP.find({_id:params.id});
    prop.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});

// observaciones talves se elimine
router.get("/get_img"/*,midleware*/, async(req, res, next)=>{
    var params=req.query;
    if(params.id==null){
        res.status(300).json({msn: "error es necesario una ID"});
        return;
    }
    var idimg = params.id ;
    var imagen=await PROP.find({"img_prop._id": idimg});
    if(imagen.length==1){
        res.json(imagen[0].img_prop[0].pathfile);
        return;
    }
    res.status(300).json({msn: "error en la peticion"});
    return;
});

module.exports = router;