// por si acaso         :)
var mongoose = require("./connect");
var COMENTSCHEMA = new mongoose.Schema({
    id_producto: {
        type: String,
        required: [true, "El id_u es necesario"]
    },
    listaLikes:[{
        nombre:
        {
            type:String,
            required:[true, "nombre requerdio"]
        },
        url: {
            type:String,
            required:[true, "url requerdio"]
        },
        comentario:{
            type:String,
            required:[true, "coment requerdio"]
        },
        fecha: {
            type: String,
            default:''
        }
    },]
});
var Coment = mongoose.model("comentarios", COMENTSCHEMA);
module.exports = Coment;