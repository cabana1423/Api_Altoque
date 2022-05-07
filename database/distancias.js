var mongoose = require("./connect");
var DISTSCHEMA = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, "nombrea  es nesesaria "]
    },
    location: {
        type: {
            type: String,
            default: 'Point',
        },
        coordinates: {
            type: [Number]
        }
    },
});
//DISTSCHEMA.index({ location: "2dsphere" });
var DIST = mongoose.model("distancias", DISTSCHEMA);
module.exports = DIST;