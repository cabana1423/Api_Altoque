var express = require('express');
var router = express.Router();
var sha1 = require("sha1");
const DENUN = require('../database/denunciasDB');
var PROP = require("../database/propiedadDB");
var PRODUC = require("../database/productosDB");

//var JWT=require("jsonwebtoken");

//var midleware=require("./midleware");

/*        POST users       */

router.post("/", async(req, res, next) => {
    var obj={};
    var propInfo = req.body;
    var params=req.query;
    if(params.id_u==null||params.id_p==null){
        
        res.status(300).json({msn: "error es necesario una ID de usuario o producto"});
        return;
    }
    obj=propInfo;
    obj["tipo"]={'id':params.id_p,'clase':propInfo.clase};
    obj["id_user"]=params.id_u;
    console.log(obj)
    var denunDB = new DENUN(obj);
    denunDB.save((err, docs) => {
        if (err) {
            //console.log(err);
            res.status(300).json(err);
            return;
        }
        //console.log(docs);
        res.status(200).json(docs);
        if (propInfo.clase=='propiedad') {
            sumDenunProp(params.id_p,res,req);
        } else {
            sumDenunProduc(params.id_p,res,req);
        }
        
    });
});

async function sumDenunProduc(id_producto,res,req) {
    PRODUC.updateOne({_id:id_producto}, 
        {$inc: {"denuncias":1}}, (err, docs) => {
            if (err) {
                console.log("error");
                 return;
             }
         });
        return;
}
async function sumDenunProp(id_producto,res,req) {
    PROP.updateOne({_id:id_producto}, 
        {$inc: {"denuncias":1}}, (err, docs) => {
            if (err) {
                console.log("error");
                 return;
             }
         });
        return;
}



router.get("/",/*midleware,*/ (req, res) => {
    var filter={};
    var params= req.query;
    var select="";
    var order = {};
    if(params.id!=null){
        var expresion =new RegExp(params.id);
        filter["tipo.id"]=expresion;
    }
    if(params.filters!=null){
        select=params.filters.replace(/,/g, " ");
    }
    if (params.order != null) {
        var data = params.order.split(",");
        var number = parseInt(data[1]);
        order[data[0]] = number;
    }
    /*// si se usa rangos de alguna variables
    if (params.mayque != null) {
        var gt = parseInt(params.mayque);
        aux["$gt"] =  gt;
    }
    if (params.menque != null) {
        var gl = parseInt(params.menque);
        aux["$lt"] =  gl;
    }
    if (aux != {}) {
        filter["age"] = aux;
    }
    //fin rangos*/
    console.log(filter)
    var userDB=DENUN.find(filter).
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

  //        delete denuncias
  router.delete("/",/*midleware,*/ async(req, res) => {
    if (req.query.id_p == null) {
        res.status(300).json({msn: "no existe id_pp"});
        return;
    }
    var r = await DENUN.remove({"id_propiedad": req.query.id_p});
    res.status(300).json(r);
});

module.exports = router;