var express = require("express");
var router = express.Router();
var CONT = require("../database/cuentasDB");
var USERS = require("../database/usersDB");
var sha1 = require("sha1");
const fs = require('fs');
//var midleware=require("./midleware");

//POST     cuentas
router.post("/", /*midleware,*/ async(req, res) => {
    var obj={};
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
            res.status(300).json(err);
            return;
        }
        res.json(docs);
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
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var cuenta=await CONT.find({_id:params.id});
    if(cuenta.length==0){
        res.status(300).json({msn: "la cuenta no existe"});
        return;
    }
    var cont= CONT.find({_id:params.id});
    cont.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});

module.exports = router;