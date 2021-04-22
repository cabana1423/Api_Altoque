var express = require("express");
var router = express.Router();
var fileUpload = require("express-fileupload")
var PRODUC = require("../database/productosDB");
var PROP = require("../database/propiedadDB");
var sha1 = require("sha1");
const fs = require('fs');
//var midleware=require("./midleware");
router.use(fileUpload({
    fileSize: 1 * 1024 * 1024,
    abortOnLimit: true
}));

//      POST    producto
router.post("/", /*midleware,*/ async(req, res) => {
    var params = req.query;
    obj = req.body;
    if (params.id == null) {
        res.status(300).json({msn: "ID de propiedad es necesaria"});
        return;
    }
    var prop=await PROP.find({_id:params.id});
    if(prop.length==1){
        obj["id_user"]=prop[0].id_user;
    }
    else{
        res.status(300).json({msn: "la propiedad no existe"});
        return;
    }
    var img=req.files.file;
    var path= __dirname.replace(/\/routes/g, "/img_produc");
    var date =new Date();
    var sing  =sha1(date.toString()).substr(1,12);
    var totalpath = path + "/" + sing + "_" + img.name.replace(/\s/g,"_");
    const tamaño=1500000;
    if(img.size>tamaño){
        return res.status(300).send({msn : "el archivo es muy grande"});
    }
    obj["img_produc"]=[{"titulo":sing+ "_" +img.name.replace(/\s/g,"_"),"pathfile":totalpath}];
    obj["id_prop"]=params.id;
    var producDB = new PRODUC(obj);
    producDB.save((err, docs) => {
        if (err) {
            res.status(300).json(err);
            return;
        }
        img.mv(totalpath, async(err) => {
            if (err) {
                return res.status(300).send({msn : "Error al escribir el archivo en el disco duro"});
            }
        });
        res.json(docs);
        return;
    });

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
        res.status(300).json({
        msn: "no existe id"
        });
        return;
    }
    var producto=await PRODUC.find({_id:req.query.id});
    var titulo=producto[0].img_produc[0].titulo;
    var r = await PRODUC.remove({_id: req.query.id});
    try {
        fs.unlinkSync('./img_produc/'+titulo)
        console.log('File removed')
      } catch(err) {
        console.error('Something wrong happened removing the file', err)
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

/*        PUT img PRODUCTOS      */
router.put("/put-img",/*midleware,*/ async(req, res) => {
    var params = req.query;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }//eliminando img
    var producto=await PRODUC.find({_id:params.id});
    var titulo=producto[0].img_produc[0].titulo;
    //new img
    var img=req.files.file;
    var path= __dirname.replace(/\/routes/g, "/img_produc");
    var date =new Date();
    var sing  =sha1(date.toString()).substr(1,12);
    var totalpath = path + "/" + sing + "_" + img.name.replace(/\s/g,"_");
    PRODUC.update({_id:  params.id}, {$set: {"img_produc":[{"titulo":sing+ "_" +img.name.replace(/\s/g,"_"),"pathfile":totalpath}]}}, (err, docs) => {
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
            fs.unlinkSync('./img_produc/'+titulo)
            console.log('File removed')
          } catch(err) {
            console.error('Something wrong happened removing the file', err)
          }
         res.status(200).json(docs);
     });

});
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