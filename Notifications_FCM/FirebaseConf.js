var express = require("express");
var router = express.Router();
const firebase = require ("firebase-admin");
const serviceAccount =require('../privatekey.json');
var USERS = require("../database/usersDB");

firebase.initializeApp({
    credential:firebase.credential.cert(serviceAccount),
});

router.post("/", /*midleware,*/async(req, res) =>  {

var tokens=await USERS.findOne({_id:req.body.id_2});
var listTokens=tokens.tokensFBS;

const firebaseToken=req.body.token;
console.log(req.body.title.toString());
const payload={
    notification:{
        title:req.body.title,
        body:req.body.body,
        click_action:'FLUTTER_NOTIFICATION_CLICK'
    },
    data:{
        data1:req.body.page,
        // data2:'data2 value',
    },
}
const options={priority:'high',timeTolive:60*60*24,};
for(var i=0;i<listTokens.length;i++){
    firebase.messaging().sendToDevice(listTokens[i].tokenFB,payload,options);
}
res.status(200).json("mensaje yes");
return;
});
module.exports = router;

