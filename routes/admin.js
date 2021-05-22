var express = require('express');
var router = express.Router();
var sha1 = require("sha1");
//var JWT=require("jsonwebtoken");
var ADMIN = require("../database/adminDB");
//var midleware=require("./midleware");

/*        POST users       */

router.post("/", async(req, res) => {

    // user datos
    var obj={};
    var adminInfo = req.body;
    if (adminInfo.password == null) {
        res.status(300).json({msn: "El password es necesario pra continuar con el registro"});
        return;
    }
    if ((adminInfo.password.length < 6)) {
        res.status(300).json({msn: "passwword debe tener almenos 6 caracteres"});
        return;
    }
    if (!/[A-Z]+/.test(adminInfo.password)) {
        res.status(300).json({msn: "El password necesita una letra Mayuscula"});
        
        return;
    }
    if (!/[\!\"\=\?\¡\¿\$\^\@\&\(\)\{\}\#]+/.test(adminInfo.password)) {
        res.status(300).json({msn: "Necesita un caracter especial"});
        return;
    }
    adminInfo.password = sha1(adminInfo.password);
    obj=adminInfo;
    var admin = new ADMIN(obj);
    admin.save((err, docs) => {
        if (err) {
            res.status(300).json(err);
            return;
        }
        res.json(docs);
        return;
    });
});

module.exports = router;