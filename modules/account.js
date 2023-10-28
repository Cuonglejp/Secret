const mongoose = require("mongoose");
const secretSchema = require("./secret").schema;
require("dotenv").config();
const passportLocalMongoose = require('passport-local-mongoose');

const accountSchema = new mongoose.Schema({
    username : {
        type: String
    },
    password : {
        type: String
    },
    provider :{
        type: String
    },
    externalInfos: Object,
    postSecrets : {
        type : [secretSchema]
    }
});
accountSchema.plugin(passportLocalMongoose);

const Account = new mongoose.model("Account",accountSchema);

module.exports= {schema: accountSchema, model : Account};
