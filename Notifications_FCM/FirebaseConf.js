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
var tokens=await USERS.findOne({_id:req.body.id_2});
var listTokens=tokens.tokensFBS;
//console.log(tokens)

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
    firebase.messaging().sendToDevice(listTokens[i].tokenFB,payload,options);
}

if(req.body.page=="mensajeria"){
    postNoti(req.body.id_2,req.body.title,req.body.body,req.body.time,req.body.page,req.body.url,req.body.id_cont,req,res);
    return;
}
else if(req.body.page=="atender_p"){
    postNoti(req.body.id_2,req.body.title,req.body.body,req.body.time,req.body.page,req.body.url,req.body.id_cont,req,res);
    return;
}
// res.status(200).json("mensaje yes");
// return;
});

async function postNoti(id_user,title,body,time,tipo,url,id_cont,req, res) {
    var obj={};
    var aux=await NOTIF.findOne({"id_user":id_user});
    //console.log(aux);
    if(aux!=null){
        addNoti(id_user,title,body,time,tipo,url,id_cont,req,res);
        return;
    }
    var lista={};
    obj["id_user"]=id_user
    obj["listaNoti"]={'title':title,'body':body,'time':time,'tipo':tipo,'url':url,'id_cont':id_cont};
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
async function addNoti(id_user,title,body,time,tipo,url,id_cont,req,res) {
    //AGREGANDO SOLO UN ELEMENTO
     //var vec={'title':title,'body':body,'time':time,'tipo':tipo};
    NOTIF.updateOne({"id_user":id_user}, 
        {$push: {"listaNoti":{$each:[{'title':title,'body':body,'time':time,'tipo':tipo,'url':url,'id_cont':id_cont}]}}}, (err, docs) => {
            if (err) {
                res.status(500).json({msn: "Existen problemas en la base de datos"});
                 return;
             }
             res.status(200).json(docs);
         });
        return;
}

module.exports = router;

