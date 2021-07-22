var mongoose = require("mongoose");
mongoose.connect("mongodb+srv://cabana_2:Mundo1423@pruebas.9mauq.mongodb.net/proyect?retryWrites=true&w=majority", {useNewUrlParser: true});
var db  = mongoose.connection;
db.on("error", () => {
    console.log("ERRO no se puede conectar al servidor");
});
db.on("open", () => {
    console.log("Conexion exitosa");
});
module.exports = mongoose;