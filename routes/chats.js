var express = require("express");
var router = express.Router();
var CHAT = require("../database/chatsDB");
var USER = require("../database/usersDB");
var LISTCHAT = require("../database/lista_chats");
var sha1 = require("sha1");
//var midleware=require("./midleware");

//POST     cuentas
router.post("/", /*midleware,*/ async(req, res) => {
    var obj={};
    params=req.body;
    if (req.query.id_2 == null) {
        res.status(300).json({msn: "El id usuario es necesario"});
             return;
    }
    var opc1=params.id+params.id_prop;
    var opc2=req.query.id_2+params.id_prop;
    var aux=await CHAT.findOne({"id_sala":opc1})
    if(aux!=null){
        addMsg(params.id, opc1,params.mensaje,params.time,req, res);
        //console.log(aux.length);
        return;
    }

    //por si no existiera primer id sala
    var aux=await CHAT.findOne({"id_sala":opc2});
    if(aux!=null){
        addMsg(params.id,opc2, params.mensaje,params.time,req, res);
        return;
    }
    obj["id_sala"]=opc1;
    obj["messages"]={"id_u":params.id,"mensaje":params.mensaje,"time":params.time};
    obj['ZonaTime']={'user1':{"id_u":params.id,"hora":'','zonaHoraria':params.zonahUser1},
   'user2': {"id_u":req.query.id_2,"hora":'','zonaHoraria':params.zonaHuser2}};
    var chatDB = new CHAT(obj);
    chatDB.save((err, docs) => {
        if (err) {
            res.status(300).json(err);
            return;
        }
        res.json(docs);
        console.log(docs);
        ListasChat(params.id,req.query.id_2,params.nombre,params.url,params.nombre2,params.url2,opc1,params.id_prop,req,res);
        return;
    });
});

async function addMsg(id_u,id_sala,mensaje,time,req, res1) {
         
        var chat =  await CHAT.findOne({"id_sala": id_sala});
        const mens=chat.messages;
        var obj={"id_u":id_u,"mensaje":mensaje,"time":time};
        mens.push(obj);
        CHAT.updateOne({"id_sala":id_sala}, 
            {$set: {"messages":mens}}, (err, docs) => {
                if (err) {
                    res1.status(500).json({msn: "Existen problemas en la base de datos"});
                     return;
                 }
                 res1.status(200).json(docs);
             });
            return;
}
async function ListasChat(id1,id2,nombre,url,nombre2,url2,id_sala,id_prop,req,res){
    var list1=await LISTCHAT.findOne({id_u:id1});
    //console.log(list1);
    if (list1==null){
        crearlist(id1,nombre,nombre2,url2,id2,id_sala,id_prop,req,res);
    }
    else{
        pushList(list1,nombre,nombre2,url2,id2,id_sala,id_prop,req,res);
    }
    var list2=await LISTCHAT.findOne({id_u:id2});
    if (list2==null){
        crearlist(id2,nombre2,nombre,url,id1,id_sala,id_prop,req,res);
    }
    else{
        pushList(list2,nombre2,nombre,url,id1,id_sala,id_prop,req,res);
    }
    return;
}
async function crearlist(id,nombre_ori,nombre,url,id2,id_sala,id_prop,res,req){
    var obj={};
    obj["id_u"]=id;
    obj["salas"]={"id_sala":id_sala,"nombre_ori":nombre_ori,"nombre":nombre,"url":url,"id_2":id2,"id_prop_d":id_prop};
    var salaDB = new LISTCHAT(obj);
    salaDB.save((err, docs) => {
        if (err) {
            //res.status(300).json(err);
            console.log(err);
        }
        
    });
}
async function pushList(list,nombre_ori,nombre,url,id1,id_sala,id_prop,res,req){
        const sala=list.salas;
        var obj={"id_sala":id_sala,"nombre_ori":nombre_ori,"nombre":nombre,"url":url,"id_2":id1,"id_prop_d":id_prop};
        sala.push(obj);
        LISTCHAT.updateOne({"id_u":list.id_u}, 
            {$set: {"salas":sala}}, (err, docs) => {
                if (err) {
                    //res1.status(500).json({msn: "Existen problemas en la base de datos"});
                     console.log(err);
                 }
                // console.log(docs);
            });
}


//      GET     chats

router.get("/",/*midleware,*/ (req, res) => {
    var filter={};
    var params= req.query;
    var select="";
    var order = {};
    if(params.id_s!=null){
        var expresion =new RegExp(params.id_s);
        filter["id_sala"]=expresion;
    }
    if(params.filters!=null){
        select=params.filters.replace(/,/g, " ");
    }
    if (params.order != null) {
        var data = params.order.split(",");
        var number = parseInt(data[1]);
        order[data[0]] = number;
    }
    //console.log(filter);
    //console.log("es estes"+select);
    var contDB=CHAT.find(filter).
    select(select).
    sort(order);
    contDB.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        // console.log('aqui chats')
        // console.log(docs)
        return;
    });
  });

  
  //      GET     chats List

router.get("/list",/*midleware,*/ (req, res) => {
    var filter={};
    var params= req.query;
    var select="";
    var order = {};
    if(params.id_u!=null){
        var expresion =new RegExp(params.id_u);
        filter["id_u"]=expresion;
    }
    if(params.filters!=null){
        select=params.filters.replace(/,/g, " ");
    }
    if (params.order != null) {
        var data = params.order.split(",");
        var number = parseInt(data[1]);
        order[data[0]] = number;
    }
    //console.log(filter);
    //console.log("es estes"+select);
    var contDB=LISTCHAT.find(filter).
    select(select).
    sort(order);
    contDB.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
  });

//  DELETE      CHATS     ;)

router.delete("/",/*midleware,*/ async(req, res) => {
    if (req.query.id == null) {
        res.status(300).json({
        msn: "no existe id"
        });
        return;
    }
    var r = await CONT.remove({_id: req.query.id});
    res.status(300).json(r);
});
// GET   unica cuenta

/*        GET prop por id      */

router.get("/id",/*midleware,*/ async(req, res) => {

    var params= req.query;
    if (params.id == null) {
        res.status(300).json({msn: "El parámetro ID es necesario"});
        return;
    }
    var cuenta=await CONT.find({_id:params.id});
    if(cuenta.length==0){
        res.status(300).json({msn: "la cuenta no existe"});
        return;
    }
    var cont= CONT.find({_id:params.id});
    cont.exec((err, docs)=>{
        if(err){
            res.status(500).json({msn: "Error en la coneccion del servidor"});
            return;
        }
        res.status(200).json(docs);
        return;
    });
});

//          MOSTRAR SALA MAS CHATS DATOS
router.get("/salaschat", /*midleware,*/ async(req, res) => {
    var listaMasDatos=[];
    params=req.body;
    var listaSalas=await LISTCHAT.findOne({'id_u':req.query.id});
    if (listaSalas!=null) {
        for(var i=0;i<listaSalas.salas.length;i++){
        var obj={};
        var chats=await CHAT.findOne({'id_sala':listaSalas.salas[i].id_sala});
        var mensaje=chats.messages[chats.messages.length-1].mensaje;
        var time=chats.messages[chats.messages.length-1].time;
        obj=listaSalas.salas[i];
        obj['id_u']=chats.messages[chats.messages.length-1].id_u;
        obj['mensaje']=mensaje;
        obj['time']=time;
        listaMasDatos.push(obj);
        }
        return res.status(200).json(listaMasDatos);
    }
    return res.status(500).json({msn: "No hay datos que mostrar"});
    //console.log(listaMasDatos);
});


router.put("/updateUltm", /*midleware,*/ async(req, res) => {
    var params=req.query;
    if(params.id_u==null){
        return res.status(500).json({msn: "id necesario"});
    }
    var chat= await CHAT.findOne({"id_sala":params.id_s});
    console.log(params)
    //  console.log(params.query.id_u)
    var obj;
    if(chat.ZonaTime.user1.id_u==params.id_u){
        obj={'ZonaTime.user1.hora':req.body.ultm};
    }else{
        obj={'ZonaTime.user2.hora':req.body.ultm};;
    }
    CHAT.update({"id_sala":params.id_s}, 
    {$set: obj}, (err, docs) => {
        if (err) {
            console.log("Existen problemas al ingresar tokenFB");
             return;
         }
         return  res.status(200).json(docs);
     })
});

module.exports = router;