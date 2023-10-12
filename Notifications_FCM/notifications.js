var express = require("express");
var router = express.Router();
var CONT = require("../database/cuentasDB");
var PROP = require("../database/propiedadDB");
var NOTIF = require("../database/notificationsDB");
var PRODUC = require("../database/productosDB");

router.post("/", /*midleware,*/ async(req, res) => {
    var obj={};
    var aux=await NOTIF.findOne({"id_user":req.query.id_u});
    if(aux!=null){
        addLikes(req.query.id_u,req.body.title,req.body.body,req.body.time,req.body.tipo,req.body.url,res,req);
        return;
    }
    obj["id_user"]=req.query.id_u
    obj["listaNoti"]=req.body;
    var notiDb = new NOTIF(obj);
    notiDb.save((err, docs) => {
        if (err) {
            res.status(300).json(err);
            return;
        }
        res.json(docs);
        return ;
    });

});
async function addLikes(id_user,title,body,time,tipo,url,res,req) {
    //AGREGANDO SOLO UN ELEMENTO
     //var vec={'title':title,'body':body,'time':time,'tipo':tipo};
    NOTIF.updateOne({"id_user":id_user},
        {$push: {"listaNoti":{$each:[{'title':title,'body':body,'time':time,'tipo':tipo,'url':url}]}}}, (err, docs) => {
            if (err) {
                res.status(500).json({msn: "Existen problemas en la base de datos"});
                 return;
             }
             res.status(200).json(docs);
         });
        return;
}
// GET NOTIFICACIONES BROOOOO
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
    var likeDB=NOTIF.find(filter).
    select(select).
    sort(order);
    likeDB.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        // console.log(docs[0].listaNoti)
        res.status(200).json(docs);
        return;
    });
  });

  router.post("/deletenoti", /*midleware,*/ async(req, res) => {
    var params = req.query;
    if (params.id_u == null||params.id_p == null) {
        res.status(300).json({msn: "El id es necesario"});
             return;
    }
    // QUITANDO UN ELEMENTO..
    NOTIF.updateOne({"id_user":params.id_u},
    {$pull: {"listaNoti":{"id_producto":params.id_p}}}, (err, docs) => {
        if (err) {
            res.status(500).json({msn: "Existen problemas en la base de datos"});
             return;
         }
         res.status(200).json(docs);
         restLikes(params.id_p,res,req);
     });
    return;
});

module.exports = router;