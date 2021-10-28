var express = require("express");
var router = express.Router();
const firebase = require ("firebase-admin");
const serviceAccount =require('../privatekey.json');

firebase.initializeApp({
    credential:firebase.credential.cert(serviceAccount),
});

router.post("/", /*midleware,*/(req, res) => {

    const firebaseToken=req.body.token;

const payload={
    notification:{
        title:'Notification Title',
        body:'esto es un ejemplo de notificion',
        click_action:'FLUTTER_NOTIFICATION_CLICK'
    },
    data:{
        data1:'data1 value',
        data2:'data2 value',
    },
}
const options={priority:'high',timeTolive:60*60*24,};

firebase.messaging().sendToDevice(firebaseToken,payload,options);

res.status(200).json("mensaje yes");
    
});
module.exports = router;

