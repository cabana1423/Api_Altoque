var express = require("express");
var router = express.Router();
var CONT = require("../database/cuentasDB");
var PROP = require("../database/propiedadDB");
var PRODUC = require("../database/productosDB");
var NOTI = require("../database/notificationsDB");
var sha1 = require("sha1");
const fs = require('fs');
//var midleware=require("./midleware");

//POST     cuentas
router.post("/", /*midleware,*/ async(req, res) => {
    var obj={};
    let vecAddVentas= new Array();
    params=req.body;
    if (req.query.id_u == null) {
        res.status(300).json({msn: "El id usuario es necesario"});
             return;
    }
    params.nombre=params.nombre.split(',');
    params.id=params.id.split(',');
    params.total=params.total.split(',');
    let vec= new Array();
    for(var i=0;i<params.nombre.length;i++)
    {
        vecAddVentas.push({'id':params.id[i],"numVentas":1});
        let productos = {
            "id_p": params.id[i],
            "nombre_p": params.nombre[i],
            "total_p": params.total[i],
          }
            vec.push(productos);
    }
    obj["productos"]=vec;
    obj["TOTALP"]=params.totalcont;
    obj["nota"]=params.nota;
    obj["id_userPed"]=req.query.id_u;
    obj["id_destino"]=params.id_dest;
    var contDB = new CONT(obj);
    contDB.save((err, docs) => {
        if (err) {
            res.status(300).json({msn: "error al registrar cuentas"});
            return;
        }
        //actualizar  muchos documentos
        const bulkOps = vecAddVentas.map(obj => {
            return {
              updateOne: {
                filter: {
                  _id: obj.id
                },
                update: {$inc: {
                   'numVentas': obj['numVentas']
                }}
              }
            }
          })

          PRODUC.bulkWrite(bulkOps).then((res,err) => {
            if (err) {
                res.status(300).json({msn: "error al aumentar ventas"});
            return;
            }
          })
        res.status(200).json({id_cont:docs._id});
        return;
    });
});

//  ------PUT NOTIFICACIONES-----

router.put("/",/*midleware,*/ async(req, res) => {
    var params = req.query;
    var bodydata = req.body;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var allowkeylist = ["estado"];
    var keys = Object.keys(bodydata);
    var updateobjectdata = {};
    for (var i = 0; i < keys.length; i++) {
        if (allowkeylist.indexOf(keys[i]) > -1) {
            updateobjectdata[keys[i]] = bodydata[keys[i]];
        }
    }
    //console.log(updateobjectdata);
    CONT.updateOne({_id:  params.id}, {$set: updateobjectdata}, (err, docs) => {
       if (err) {
           res.status(500).json({msn: "Existen problemas en la base de datos"});
            return;
        }
        NOTI.findOneAndUpdate({_id: params.idNot},
            {
              $set: {[`listaNoti.$[outer].estado`]: bodydata.estado}
            },
            {
              "arrayFilters": [{ "outer.id_cont": params.id }]
            },(err, docs) => {
                        if (err) {
                            console.log('error en la bd notificaciones')
                            return;
                        }
            });
        res.status(200).json(docs);
        return;
    });
});

//      GET     cuentas

router.get("/",/*midleware,*/ (req, res) => {
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
    var contDB=CONT.find(filter).
    select(select).
    sort(order);
    contDB.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
  });

//  DELETE      cuentas     ;)

router.delete("/",/*midleware,*/ async(req, res) => {
    if (req.query.id == null) {
        res.status(300).json({
        msn: "no existe id"
        });
        return;
    }
    var r = await CONT.remove({_id: req.query.id});
    res.status(300).json(r);
});
// GET   unica cuenta

/*        GET prop por id      */

router.get("/id",/*midleware,*/ async(req, res) => {

    var params= req.query;
    console.log(params);
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var propiedad=await PROP.findOne({_id:params.idT});
    console.log(propiedad);
    
    var cuent= CONT.findOne({_id:params.id});
    cuent.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json({cuentas:docs,propiedad:propiedad});
        return;
    });
});

module.exports = router;