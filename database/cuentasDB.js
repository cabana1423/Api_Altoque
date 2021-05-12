var mongoose = require("./connect");
var CUENTASCHEMA = new mongoose.Schema({
    fecha_reg: {
        type: Date,
        default: new Date()
    },
    productos:{
        type:Array,
        default:[]
    },
    TOTALP: {
        type: Number,
        required: [true, "necesario el total"]
    },
    /*hubicacion:[{
        lat: {
            type: String, 
            required: [true, "falta log"]
        },
        lon: {
            type: String, 
            required: [true, "falta lat"]
        }
    }],*/
    id_userPed: {
        type: String,
        required: [true, "el usuario que realiza el pedido es necesario"]
    }
});
var CUENTAS = mongoose.model("cuentas", CUENTASCHEMA);
module.exports = CUENTAS;