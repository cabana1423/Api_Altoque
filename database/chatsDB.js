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
            type: String,
            default:'',
        }
    },
    ZonaTime:{
        user1:{
                id_u:
            {
                type:String,
                required:[true, "el id_u es requerida"]
            },
            zonaHoraria: {
                type: String,
            },
            hora: {
                type: String,
            },
        },
        user2:{
                id_u:
            {
                type:String,
                required:[true, "el id_u es requerida"]
            },
            zonaHoraria: {
                type: String,
            },
            hora: {
                type: String,
            },
        }
    },
    fecha_reg: {
        type: Date,
        default: new Date()
    },
});
var CHAT = mongoose.model("chats", CHATSCHEMA);
module.exports = CHAT;