var mongoose = require("./connect");
var DENUSCHEMA = new mongoose.Schema({
    id_user: {
        type: String,
        required: [true, "El id es necesario"]
    },
    id_propiedad: {
        type: String,
        required: [true, "id propiedad son necesarios"]
    },
    denuncia: {
        type: String,
        required: [true, "El password es necesario"]
    },
    fecha_reg: {
        type: Date,
        default: new Date()
    }
});
var DENUN = mongoose.model("denuncias", DENUSCHEMA);
module.exports = DENUN;