var mongoose = require("./connect");
var NOTIFICATIONS = new mongoose.Schema({
    id_user: {
        type: String,
        required: [true, "El id_u es necesario"]
    },
    listaNoti:{
        type:Array,
        title:
        {
            type:String,
            required:[true, "el title es requerida"]
        },
        body:
        {
            type:String,
            required:[true, "el body es requerida"]
        },
        time:
        {
            type:String,
            required:[true, "el hora es requerida"]
        },
        tipo:
        {
            type:String,
            required:[true, "el tipo es requerida"]
        }
    },
});
var NOTI = mongoose.model("notificactions", NOTIFICATIONS);
module.exports = NOTI;