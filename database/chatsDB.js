var mongoose = require("./connect");
var CHATSCHEMA = new mongoose.Schema({
    id_sala: {
        type: String,
        required: [true, "El id_1 es necesario"]
    },
    messages:{
        type:Array,
        id_u:
        {
            type:String,
            required:[true, "el id_u es requerida"]
        },
        mensaje: {
            type: String,
        },
        time: {
            type: Date,
            default:Date.now,
        }
    },
    ultimaConeccion:{
        type:Array,
        id_u:
        {
            type:String,
            required:[true, "el id_u es requerida"]
        },
        hora: {
            type: String,
        },
    },
    fecha_reg: {
        type: Date,
        default: new Date()
    }
});
var CHAT = mongoose.model("chats", CHATSCHEMA);
module.exports = CHAT;