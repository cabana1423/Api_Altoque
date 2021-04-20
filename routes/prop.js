var express = require("express");
var router = express.Router();
var fileUpload = require("express-fileupload")
var PROP = require("../database/propDB");
var sha1 = require("sha1");
const fs = require('fs');
//var midleware=require("./midleware");
router.use(fileUpload({
    fileSize: 1 * 1024 * 1024,
    abortOnLimit: true
}));

//  POST prop

router.post("/", /*midleware,*/ async(req, res) => {
    var params = req.query;
    var pr=req.body;
    if (params.id == null) {
        res.status(300).json({msn: "El id usuario es necesario"});
             return;
    }
    //imagen up
    var img=req.files.file;
    var path= __dirname.replace(/\/routes/g, "/img_prop");
    var date =new Date();
    var sing  =sha1(date.toString()).substr(1,12);
    var totalpath = path + "/" + sing + "_" + img.name.replace(/\s/g,"_");
    img.mv(totalpath, async(err) => {
        if (err) {
            return res.status(300).send({msn : "Error al escribir el archivo en el disco duro"});
        }
    });
    //prop up
    obj = req.body;
    obj["hubicacion"]=[{"lat":pr.lat,"lon":pr.lon,"calle":pr.calle}];
    obj["img_prop"]=[{"titulo":sing+ "_" +img.name,"pathfile":totalpath}];
    obj["id_user"]=params.id;
    var propDB = new PROP(obj);
    propDB.save((err, docs) => {
        if (err) {
            res.status(300).json(err);
            try {
                fs.unlinkSync('./img_prop/'+sing+ "_" +img.name)
                console.log('File removed')
              } catch(err) {
                console.error('Something wrong happened removing the file', err)
              }
            return;
        }
        res.json(docs);
        return;
    });

});

module.exports = router;