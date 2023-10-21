const mongoose = require("mongoose");

const secretSchema = new mongoose.Schema({
    content :{
        type : String
    }
});
const Secret = new mongoose.model("Secret",secretSchema);

module.exports = {schema: secretSchema, model : Secret};