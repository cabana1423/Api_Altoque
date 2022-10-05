var mongoose = require("./connect");
var PRODUC_SCHEMA = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, "El Nombre es necesario"]
    },
    precio: {
        type: String,
        required: [true, "El precio es necesaria"]
    },
    descripcion: {
        type: String,
    },
    img_produc:{
        type:Array,
        Url:
        {
            type:String,
            required:[true, "el titulo de la imagen es requerida"]
        },
        key: {
            type: String,
            required: [true, "la ruta de la imagen es necesaria"]
        }
    },
    id_user: {
        type: String,
        required: [true, "el usuario es necesario"]
    },
    id_prop: {
        type: String,
        required: [true, "la propiedad es necesaria"]
    },
    numLikes: {
        type: Number,
        default:0
    },
    fecha_reg: {
        type: Date,
        default: new Date()
    },
    categoria: {
        type: String,
        required: [true, "La categoria del producto es nesesaria "]
    },
    comentarios:[{
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
var PRODUC = mongoose.model("productos", PRODUC_SCHEMA);
module.exports = PRODUC;