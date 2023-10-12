const firebase = require ("firebase-admin");
const serviceAccount =require('../privatekey.json');
var USERS = require("../database/usersDB");

firebase.initializeApp({
    credential:firebase.credential.cert(serviceAccount),
});
//VERIFICACION DE TOKENS
  function verificarTokens(lista,id,res){
      for (var i =0;i<lista.length;i++){
        
          var token=lista[i];
          verifyIdToken(token,id).catch((error) => {
            console.log('TOOOOOKEN '+token),
            USERS.updateOne({_id:  id}, {$pull: {'tokensFBS':token}}, (err, docs) => {
              if (err) {
                console.log('ERROR AL BORRAR TOKEN');
                  res.status(500).json({msn: "error en la base de datos"});
                  return;
              }
              console.log('Token eliminado');
              //  res.status(200).json({msn:'token eliminado',docs});
          });
              // console.error(error);
            });
      }
  }

async function verifyIdToken(idToken) {
    const decodedToken = await firebase.auth().verifyIdToken(idToken);
    return decodedToken;
  }

function enviarMensaje(tokens,payload,options){
    firebase.messaging().sendToDevice(tokens,payload,options).then((decodedToken) => {
      // console.log(decodedToken);
    }).catch((error) => {
      console.error(error);
      return;
    });
}


// enviar mensaje


  module.exports={
    verificarTokens,
    enviarMensaje
};
