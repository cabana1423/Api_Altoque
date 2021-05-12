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
        res.status(300).json({msn: "faltan datos"});
        return;
    }
    var vec= new Array();
    var aux={};var sum=0;
    for(var i=0;i<cont;i++)
    {
            aux["id"]=params.id[i]; aux["nombre"]=params.nombre[i];
            aux["total"]=params.total[i];
            sum=sum+parseFloat(params.total[i]);
            //console.log(params.total[i]);
            vec[i]=aux;
    }
    obj["productos"]=vec;
    //console.log(sum);
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

module.exports = router;