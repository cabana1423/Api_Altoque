var mongoose = require("mongoose");
mongoose.connect('mongodb+srv://cabana_1:Mundo14231423@cluster0.loapouy.mongodb.net/proyect?retryWrites=true&w=majority', {useNewUrlParser: true});

var db  = mongoose.connection;
db.on("error", () => {
    console.log("ERRO no se puede conectar al servidor");
});
db.on("open", () => {
    console.log("Conexion exitosa");
});
module.exports = mongoose;