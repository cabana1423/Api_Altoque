var express = require("express");
var router = express.Router();
const serviceAccount =require('../privatekey.json');
var USERS = require("../database/usersDB");
var NOTIF = require("../database/notificationsDB");
var firebase= require('./firebaseTokens');
var PROP = require("../database/propiedadDB");



router.post("/", /*midleware,*/async(req, res) =>  {
    //console.log(req.body);
var tokens=await USERS.findOne({_id:req.body.id_2});
//console.log(tokens);
if(tokens==null){
    res.status(500).json({msn: "Existen problemas en la base de datos"});
     return;
}
var listTokens=tokens.tokensFBS;



const payload={
    notification:{
        title:req.body.title,
        body:req.body.body,
        click_action:'FLUTTER_NOTIFICATION_CLICK'
    },
    data:{
        data1:req.body.page,
        //data2:cad,
    },
}
const options={priority:'high',timeTolive:60*60*24,};

    try {
        firebase.enviarMensaje(listTokens,payload,options);
    } catch (error) {
        console.log(error);
        return;
    }


if(req.body.page=="mensajeria"){
    //postNoti(req.body.id_2,req.body.title,req.body.body,req.body.time,req.body.page,req.body.url,req.body.id_cont,req,res);
    return;
}
else {
    postNoti(req.body.id_tienda,req.body.id_2,req.body.title,req.body.body,req.body.time,req.body.page,req.body.url,req.body.id_cont,req,res);
    return;
}
// res.status(200).json("mensaje yes");
 //return;
});

async function postNoti(id_tienda,id_user,title,body,time,tipo,url,id_cont,req, res) {
    var obj={};
    var aux=await NOTIF.findOne({"id_user":id_user});
    //console.log(aux);
    if(aux!=null){
        addNoti(id_tienda,id_user,title,body,time,tipo,url,id_cont,'',req,res);
        return;
    }
    var lista={};
    obj["id_user"]=id_user
    obj["listaNoti"]={'id_tienda':id_tienda,'title':title,'body':body,'time':time,'tipo':tipo,'url':url,'id_cont':id_cont,'estado':''};
    var notiDb = new NOTIF(obj);
    notiDb.save((err, docs) => {
        if (err) {
            //res.status(300).json(err);
            console.log(err);
            return;
        }
        res.json(docs);
        return ;
    });

}

async function addNoti(id_tienda,id_user,title,body,time,tipo,url,id_cont,estado,req,res) {
    //AGREGANDO SOLO UN ELEMENTO
     //var vec={'title':title,'body':body,'time':time,'tipo':tipo};
    NOTIF.updateOne({"id_user":id_user}, 
        {$push: {"listaNoti":{$each:[{'id_tienda':id_tienda,'title':title,'body':body,'time':time,'tipo':tipo,'url':url,'id_cont':id_cont,'estado':estado}]}}}, (err, docs) => {
            if (err) {
                res.status(500).json({msn: "Existen problemas en la base de datos"});
                 return;
             }
             res.status(200).json(docs);
         });
        return;
}


router.post("/notRep", /*midleware,*/async(req, res) =>  {
    
    var obj={};
    body=req.body;
    var aux=await NOTIF.findOne({"id_user":body.id_user});
    //console.log(aux);
    if(aux!=null){
        addNoti(body.id_tienda,body.id_user,body.title,body.body,body.time,body.tipo,body.url,body.id_cont,body.estado,req,res);
        return;
    }
    obj["id_user"]=body.id_user
    obj["listaNoti"]={'id_tienda':body.id_tienda,'title':body.title,'body':body.body,'time':body.time,'tipo':body.tipo,'url':body.url,'id_cont':body.id_cont,'estado':body.estado};
    var notiDb = new NOTIF(obj);
    notiDb.save((err, docs) => {
        if (err) {
            //res.status(300).json(err);
            console.log(err);
            return;
        }
        res.json(docs);
        return ;
    });

});

router.post("/sendRep", /*midleware,*/async(req, res) =>  {
    
    var tienda=await PROP.findOne({_id:req.body.id_tienda});
    // console.log(req.body.datos);
    var result;
    var params= req.query; 
    var distan=8000
    if(params.dist!=null){
       distan=params.dist
        // console.log(distan);
    }
    var dist= USERS.find(
    {
        'tipo':'repartidor',
        locacion: {
         $near: {
          $maxDistance: distan,
          $geometry: {
           type: "Point",
            coordinates: [tienda.location.coordinates[0], tienda.location.coordinates[1]]
          }
         }
        }
       },'tokensFBS'
       );
    //    console.log(dist);
    dist.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: err});
            console.log(err);
            return;
        }
        // console.log(docs);
        const tokens = docs.map(val => val.tokensFBS);
        result = tokens.flat().reduce((acc, curr) => acc.concat(curr), []);
        //  console.log(result);
         if (result.length!=[]) {
            // console.log(result)
            sendFMC(result)
         }
         
        res.end();
    });
    function sendFMC(result) {
        const payload={
            notification:{
                title:req.body.title,
                body:req.body.body,
                click_action:'FLUTTER_NOTIFICATION_CLICK'
            },
            data:{
                data1:req.body.page,
                datas2:req.body.datos,
                long:tienda.location.coordinates[0].toString(),
                lat:tienda.location.coordinates[1].toString()
            },
        }
        const options={priority:'high',timeTolive:60*60*24,};
    
        try {
            firebase.enviarMensaje(result,payload,options);
        } catch (error) {
            console.log(error);
            return;
        }
    }
    
});

router.post("/fcmOtros", /*midleware,*/async(req, res) =>  {
    var tokens=await USERS.findOne({_id:req.body.id_user});
    //console.log(tokens);
    if(tokens==null){
        res.status(500).json({msn: "Existen problemas en la base de datos"});
        return;
    }
    var listTokens=tokens.tokensFBS;
    console.log(listTokens);
        const payload={
            notification:{
                title:req.body.title,
                body:req.body.body,
                click_action:'FLUTTER_NOTIFICATION_CLICK'
            },
            data:{
                data1:req.body.page,
            },
        }
        const options={priority:'high',timeTolive:60*60*24,};
    
        try {
            firebase.enviarMensaje(listTokens,payload,options);
            return res.end()
        } catch (error) {
            console.log(error);
            return res.end();
        }
    }
    
);


module.exports = router;

