var express = require("express");
var router = express.Router();
var fileUpload = require("express-fileupload")
var PROP = require("../database/propiedadDB");
var USERS = require("../database/usersDB");
var sha1 = require("sha1");
const fs = require('fs');
//var midleware=require("./midleware");
router.use(fileUpload({
    fileSize: 1 * 1024 * 1024,
    abortOnLimit: true
}));

//  POST prop

router.post("/", /*midleware,*/ async(req, res) => {
    var params = req.query;
    var pr=req.body;
    if (params.id == null) {
        res.status(300).json({msn: "El id usuario es necesario"});
             return;
    }
    // validando usuraio
    var users=await USERS.find({_id:params.id});
    if(users.length==0){
        res.status(300).json({msn: "el usuario no existe"});
        return;
    }
        //imagen up
    var img=req.files.file;
    var path= __dirname.replace(/\/routes/g, "/img_prop");
    var date =new Date();
    var sing  =sha1(date.toString()).substr(1,12);
    var totalpath = path + "/" + sing + "_" + img.name.replace(/\s/g,"_");
    const tamaño=1500000;
    if(img.size>tamaño){
        return res.status(300).send({msn : "el archivo es muy grande"});
    }
            //prop up
    obj = req.body;
    obj["hubicacion"]=[{"lat":pr.lat,"lon":pr.lon,"calle":pr.calle}];
    obj["img_prop"]=[{"titulo":sing+ "_" +img.name.replace(/\s/g,"_"),"pathfile":totalpath}];
    obj["id_user"]=params.id;
    var propDB = new PROP(obj);
    propDB.save((err, docs) => {
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
    var titulo=propiedad[0].img_prop[0].titulo;
    var r = await PROP.remove({_id: req.query.id});
    try {
        fs.unlinkSync('./img_prop/'+titulo)
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
    var idimg = params.id ;
    var imagen=await PROP.find({"img_prop._id": idimg});
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