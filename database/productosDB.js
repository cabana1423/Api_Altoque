var mongoose = require("./connect");
var PRODUC_SCHEMA = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, "El Nombre es necesario"]
    },
    precio: {
        type: Number,
        required: [true, "El precio es necesaria"]
    },
    descripcion: {
        type: String,
        required: [true, "La descripcion del menu es nesesaria es necesario"]
    },
    img_produc:[{
        titulo:
        {
            type:String,
            required:[true, "el titulo de la imagen es requerida"]
        },
        pathfile: {
            type: String,
            required: [true, "la ruta de la imagen es necesaria"]
        }
    }],
    id_user: {
        type: String,
        required: [true, "el usuario es necesario"]
    },
    id_prop: {
        type: String,
        required: [true, "la propiedad es necesaria"]
    },
    fecha_reg: {
        type: Date,
        default: new Date()
    }
});
var PRODUC = mongoose.model("productos", PRODUC_SCHEMA);
module.exports = PRODUC;