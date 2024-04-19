var mongoose = require("./connect");
var CUENTASCHEMA = new mongoose.Schema({
    fecha_reg: {
        type: Date,
        default: new Date()
    },
    productos:{
        type:Array,
        id_p:
        {
                type:String,
                required:[true, "el id del producto es requerida"]
        },
        cantidad:{
            type:String,
        },
        nombre_p:
        {
                type:String,
                required:[true, "el nombre del producto es requerida"]
        },
        total_p:
        {
                type:String,
                required:[true,"el precio total es requerida"]
        },
        
    },
    TOTALP: {
        type: Number,
        required: [true, "necesario el total"]
    },
    nota: {
        type: String,
        default:""
    },
    time: {
        type: String,
    },
    estado: {
        type: String,
        default:""
    },
    nombreTienda: {
        type: String,
    },
    ubicacion:{
        lon_u: {
            type: Number, 
        },
        lat_u: {
            type: Number, 
        },
        lon_t: {
            type: Number, 
        },
        lat_t: {
            type: Number, 
        }
    },
    user:{
        nombre:{
            type:String,
        },
        url:{
            type:String,
        },
    },
    id_userPed: {
        type: String,
        required: [true, "el usuario que realiza el pedido es necesario"]
    },
    id_destino: {
        type: String,
        required: [true, "el usuario que rcibio el pedido es necesario"]
    },
    idTienda: {
        type: String,
        required: [true, "la tienda que recibio el pedido es necesario"]
    },
    repartidor:{
        id:{
            type:String,
        },
        nombre:{
            type:String,
        },
        estado:{
            type:String,
        },
        tokenFcm:{
            type:String,
        },
        cuenta:{
            type:String,
        },
    },
    tipoDePago: {
        tipo:{
            type:String,
        },
        cuenta:{
            type:String,
        },
    },
    // clave: {
    //     type: String,
    //     required: [true, "el usuario que realiza el pedido es necesario"]
    // }
});
var CUENTAS = mongoose.model("cuentas", CUENTASCHEMA);
module.exports = CUENTAS;