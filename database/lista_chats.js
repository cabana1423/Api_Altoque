var mongoose = require("./connect");
var LISTSCHEMA = new mongoose.Schema({
    id_u: {
        type: String,
        required: [true, "El id_1 es necesario"]
    },
    salas:{
        type:Array,
        id_sala: {
            type: String,
            required: [true, "El id_sala es necesario"]
        },
        nombre: {
            type: String,
            required: [true, "El nombre es necesario"]
        },
        url: {
            type: String,
            required: [true, "El url es necesario"]
        }
    },
    fecha_reg: {
        type: Date,
        default: new Date()
    }
});
var LISTCHAT = mongoose.model("listaChat", LISTSCHEMA);
module.exports = LISTCHAT;