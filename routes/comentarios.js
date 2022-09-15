
// var express = require("express");
// var router = express.Router();
// var COMENT = require("../database/comentariosDB");

// router.post("/", /*midleware,*/ async(req, res) => {
//     var obj={};
//     idP=req.query;
//     params=req.body;
//     var comentarioList=await COMENT.findOne({"id_producto":})
//     if(comentarioList!=null){
//         addMsg(params.id, opc1,params.mensaje,params.time,req, res);
//         //console.log(aux.length);
//         return;
//     }
//     obj["productos"]=vec;
//     obj["TOTALP"]=params.totalcont;
//     obj["nota"]=params.nota;
//     obj["id_userPed"]=req.query.id_u;
//     obj["id_destino"]=params.id_dest;
//     var contDB = new CONT(obj);
//     contDB.save((err, docs) => {
//         if (err) {
//             res.status(300).json(err);
//             return;
//         }
//         res.status(200).json({id_cont:docs._id});
//         return;
//     });
// });