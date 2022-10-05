var mongoose = require("./connect");
var LIKESCHEMA = new mongoose.Schema({
    id_user: {
        type: String,
        required: [true, "El id_u es necesario"]
    },
    listaLikes:{
        type:Array,
    },
    interacciones:[
    ]
    
});
var LIKE = mongoose.model("likes", LIKESCHEMA);
module.exports = LIKE;