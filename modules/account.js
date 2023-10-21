const mongoose = require("mongoose");
const secretSchema = require("./secret").schema;
const encrypt = require("mongoose-encryption");
require("dotenv").config();

const accountSchema = new mongoose.Schema({
    username : {
        type: String,
        required : true
    },
    password : {
        type: String,
        required : true
    },
    postSecrets : {
        type : [secretSchema]
    }
});

accountSchema.plugin(encrypt, { secret:  process.env.SECRET , encryptedFields: ["password"]});
const Account = new mongoose.model("Account",accountSchema);

module.exports= {schema: accountSchema, model : Account};
