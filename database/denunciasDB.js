var mongoose = require("./connect");
var DENUSCHEMA = new mongoose.Schema({
    id_user: { 
        type: String,
        required: [true, "El id user es necesario"]
    },
    tipo: {
        id:
            {
                type:String,
                required:[true, "id es requerida"]
            },
        clase:
            {
                type:String,
                required:[true, "clase es requerida"]
            },
    },
    denuncia: {
        type: String,
        required: [true, "denuncia es necesaria"]
    },
    fecha_reg: {
        type: Date,
        default: new Date()
    }
});
var DENUN = mongoose.model("denuncias", DENUSCHEMA);
module.exports = DENUN;