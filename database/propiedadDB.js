var mongoose = require("./connect");
var PROP_SCHEMA = new mongoose.Schema({
        nombre: {
            type: String,
            required: [true, "El Nombre es necesario"]
        },
        nit: {
            type: Number,
            required: [true, "El NIT es necesaria"]
        },
        propietario: {
            type: String,
            required: [true, "propietario es necesario"]
        },
        telefono: {
            type: Number,
            required: [true, "El telefono es necesario"]
        },
        ubicacion:[{
            lat: {
                type: String, 
                required: [true, "falta log"]
            },
            lon: {
                type: String, 
                required: [true, "falta lat"]
            },
            calle: {
                type: String,
                required: [true, "La direccion es necesaria"]
            },
        }],
        img_prop:{
            type:Array,
            sha:
            {
                type:String,
                required:[true, "el titulo de la imagen es requerida"]
            },
            pathfile: {
                type: String,
                required: [true, "la ruta de la imagen es necesaria"]
            },
            relativepath:
            {
                type:String,
                required:[true, "la ruta total de imagen es requerida"]
            }
        },
        id_user: {
            type: String,
            required: [true, "El id usuario es necesario"]
        },
        fecha_reg: {
            type: Date,
            default: new Date()
        },
        estado: {
            type: String,
            default:"vigente"
        }


});
var PROP = mongoose.model("propiedad", PROP_SCHEMA);
module.exports = PROP;