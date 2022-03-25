const { query } = require("express");
var express = require("express");
const path =require('path');
var router = express.Router();
router.use(express.static('public'));
const azauth=require('azauth');
router.use(azauth.auth);
azauth.setOrigin(/(.*?)/);
//router.use(express.static(path.join(__dirname,'public/login_google')));
//var CONT = require("../database/cuentasDB");
//var USERS = require("../database/usersDB");
//var midleware=require("./midleware");

router.get("/", /*midleware,*/ (req, res) => {
    //console.log(req?.azAuth?.data);
    res.send(`hi ${req.azAuth.data.emails[0].value} `);
    
});

module.exports = router;