var express = require("express");
var router = express.Router();
const firebase = require ("firebase-admin");
const serviceAccount =require('../privatekey.json');
var USERS = require("../database/usersDB");
var NOTIF = require("../database/notificationsDB");

firebase.initializeApp({
    credential:firebase.credential.cert(serviceAccount),
});

router.post("/", /*midleware,*/async(req, res) =>  {
    //console.log(req.body);
var tokens=await USERS.findOne({_id:req.body.id_2});
//console.log(tokens);
var listTokens=tokens.tokensFBS;
if(tokens==null){
    res.status(500).json({msn: "Existen problemas en la base de datos"});
     return;
}

//const firebaseToken=req.body.token;

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
for(var i=0;i<listTokens.length;i++){
    // console.log('esto esssss $i');
    // console.log(listTokens[i].tokenFB);
    try {
        firebase.messaging().sendToDevice(listTokens[i].tokenFB,payload,options);
    } catch (error) {
        console.log(e);
        return;
    }
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
        addNoti(id_tienda,id_user,title,body,time,tipo,url,id_cont,req,res);
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
async function addNoti(id_tienda,id_user,title,body,time,tipo,url,id_cont,req,res) {
    //AGREGANDO SOLO UN ELEMENTO
     //var vec={'title':title,'body':body,'time':time,'tipo':tipo};
    NOTIF.updateOne({"id_user":id_user}, 
        {$push: {"listaNoti":{$each:[{'id_tienda':id_tienda,'title':title,'body':body,'time':time,'tipo':tipo,'url':url,'id_cont':id_cont,'estado':''}]}}}, (err, docs) => {
            if (err) {
                res.status(500).json({msn: "Existen problemas en la base de datos"});
                 return;
             }
             res.status(200).json(docs);
         });
        return;
}

module.exports = router;

