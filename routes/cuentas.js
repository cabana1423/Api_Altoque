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
    // validando usuraio
    var users=await USERS.find({_id:req.query.id_u});
    if(users.length==0){
        res.status(300).json({msn: "el usuario no existe"});
        return;
    }
    var cont;
    if(params.id.length==params.nombre.length&&params.id.length==params.total.length){
        cont=params.id.length;
    }
    else{
        res.status(300).json({msn: "Arreglos desiguales "});
        return;
    }
    let vec= new Array();
    var sum=0;
    for(var i=0;i<cont;i++)
    {
        let productos = {
            "id_p": params.id[i],
            "nombre_p": params.nombre[i],
            "total_p": params.total[i],
          }
            sum=sum+parseFloat(params.total[i]);
            vec.push(productos);         
    }
    obj["productos"]=vec;
    obj["TOTALP"]=sum;
    obj["id_userPed"]=req.query.id_u;
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