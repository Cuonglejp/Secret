const mongoose = require("mongoose");
const secretSchema = require("./secret").schema;
require("dotenv").config();
const passportLocalMongoose = require('passport-local-mongoose');

const accountSchema = new mongoose.Schema({
    username : {
        type: String,
        required : true
    },
    password : {
        type: String
    },
    postSecrets : {
        type : [secretSchema]
    }
});
accountSchema.plugin(passportLocalMongoose);

const Account = new mongoose.model("Account",accountSchema);

module.exports= {schema: accountSchema, model : Account};
