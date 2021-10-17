var mongoose = require("./connect");
var LIKESCHEMA = new mongoose.Schema({
    id_user: {
        type: String,
        required: [true, "El id_u es necesario"]
    },
    listaLikes:{
        type:Array,
        id_producto:
        {
            type:String,
            required:[true, "el id_p es requerida"]
        },
        fecha_reg: {
            type: Date,
            default: new Date()
        }
    },
    
});
var LIKE = mongoose.model("likes", LIKESCHEMA);
module.exports = LIKE;