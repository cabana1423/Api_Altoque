var mongoose = require("./connect");
var USERSCHEMA = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, "El Nombre es necesario"]
    },
    apellidos: {
        type: String,
        required: [true, "Apellidos son necesarios"]
    },
    email: {
        type: String,
        required: [true, "El email es necesario"],
        validate: {
            validator: (value) => {
                return /^[\w\.]+@[\w\.]+\.\w{3,3}$/.test(value);
            },
            message: props => `${props.value} no es valido` 
        },
        unique:[true, "el correo ingresado ya se encuentra registrado"]
        
    },
    password: {
        type: String,
        required: [true, "El password es necesario"]
    },
    fecha_nac: {
        type: String,
        required: [true, "Falta la fecha de nacimiento"]
    },
    fecha_reg: {
        type: Date,
        default: new Date()
    },
    img_user:[{
        Url:
        {
            type:String,
            default: ""
        },
        key: {
            type: String,
            default: ""
        }
    }]
    /*limite:{
        type:Number,
        default:0 
    },
    tokenFB:{
        type:String,
        default:"" ,
    }*/
});
var USERS = mongoose.model("users", USERSCHEMA);
module.exports = USERS;