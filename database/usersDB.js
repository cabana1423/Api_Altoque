var mongoose = require("./connect");
var USERSCHEMA = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, "El Nombre es necesario"]
    },
    apellidos: {
        type: String,
        default:""
        //required: [true, "Apellidos son necesarios"]
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
    locacion: {
        type: {
            type: String,
            default: 'Point',
        },
        coordinates: {
            type: [Number]
        }
    },
    password: {
        type: String,
        required: [true, "El password es necesario"]
    },
    fecha_nac: {
        type: String,
        default:''
        //required: [true, "Falta la fecha de nacimiento"]
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
    }],
    tokensFBS: {
        type:Array,
        // tokenFB:
        // {
        //     type: String,
        //     required: [true, "El tokenFB es necesario"]
        // }
    },
    estado: {
        type: String,
        default:''    },
    tipo: {
        type: String,
        default:'normal'
        //required: [true, "Falta la fecha de nacimiento"]
    },
    zonaHoraria: {
        type: String,
        default:''
    },

    verificacion: {
        type: String,
        default:''
    },
    telefono: {
        type: String,
        default:''
    },
    ci: {
        type: String,
    },
    direccion: {
        type: String,
    },
    vehiculo: {
        type: String,
    },
    refreshToken: {
        type: String,
        default:''
    },
    /*limite:{
        type:Number,
        default:0 
    },*/
    documentos:{
        type:Array,
        tipo:
        {
            type:String,
            required:[true, "el titulo de la imagen es requerida"]
        },
        url:
        {
            type:String,
            required:[true, "el titulo de la imagen es requerida"]
        },
        key: {
            type: String,
            required: [true, "la ruta de la imagen es necesaria"]
        }
    },
});
USERSCHEMA.index({ locacion: "2dsphere" });
var USERS = mongoose.model("users", USERSCHEMA);
module.exports = USERS;