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
        nombre_p:
        {
                type:String,
                required:[true, "el nombre del producto es requerida"]
        },
        total_p:
        {
                type:String,
                required:[true, "el precio total es requerida"]
        }
    },
    TOTALP: {
        type: Number,
        required: [true, "necesario el total"]
    },
    nota: {
        type: String,
        default:""
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