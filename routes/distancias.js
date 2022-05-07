var express = require("express");
var router = express.Router();
var DIST = require("../database/distancias");
var sha1 = require("sha1");
//var midleware=require("./midleware");

//POST     cuentas
router.post("/", /*midleware,*/ async(req, res) => {
    var obj={};
    params=req.body;
    obj["nombre"]=req.body.nombre;
    obj["location"]={coordinates:[req.body.long,req.body.lat]};
    var dist = new DIST(obj);
    dist.save((err, docs) => {
        if (err) {
            res.status(300).json(err);
            return;
        }
        res.json(docs);
return
    });
});




//      GET     chats

router.get("/",/*midleware,*/ (req, res) => {
    // var dist= DIST.find({
    //     "location.coordinates": { 
    //        $geoWithin: { $center: [ [-65.744596, -19.599862], 0.02 ] } } }
    //   ).sort({score: -1});


    var dist=DIST.find({
        location: {
         $near: {
          $maxDistance: 5000,
          $geometry: {
           type: "Point",
           coordinates: [-65.744596, -19.599862]
          }
         }
        }
       });
    dist.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: err});
            return;
        }
        res.status(200).json(docs);
        return;
    });
  });
  
  router.get("/id",/*midleware,*/ async(req, res) => {

    var cont= DIST.find();
    cont.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});
  //      GET     chats List

module.exports = router;