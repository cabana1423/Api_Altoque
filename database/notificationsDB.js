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
        },
        url:
        {
            type:String,
            required:[true, "el url es requerida"]
        },
        id_cont:
        {
            type:String,
            default:""
        },
        id_tienda:
        {
            type:String,
            required:[true, "el id tienda es requerida"]
        },
        estado:
        {
            type:String,
            default:''
        },
    },
});
var NOTI = mongoose.model("notificactions", NOTIFICATIONS);
module.exports = NOTI;