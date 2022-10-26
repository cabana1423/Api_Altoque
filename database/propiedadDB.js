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
            type: String,
            required: [true, "El telefono es necesario"]
        },
        location: {
            type: {
                type: String,
                default: 'Point',
            },
            coordinates: {
                type: [Number]
            }
        },
        calle: {
            type: String,
            required: [true, "La direccion es necesaria"]
        },
        img_prop:{
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
            required: [true, "El id usuario es necesario"]
        },
        fecha_reg: {
            type: Date,
            default: new Date()
        },
        estado: {
            type: String,
            default:"vigente"
        },
        entregas: {
            type: String,
            default:"deshabilitado"
        }
});
PROP_SCHEMA.index({ location: "2dsphere" });
var PROP = mongoose.model("propiedad", PROP_SCHEMA);
module.exports = PROP;