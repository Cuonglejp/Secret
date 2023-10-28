require("dotenv").config();
const mongoose = require("mongoose");
const secretModel = require("./modules/secret").model;
const accountModel  = require("./modules/account").model;

class DBConnecting {
    constructor(passport){
        //Connect to database
        let dbConnectionStr = process.env.CONNECTION_MONGODB_STR;

        try{
            mongoose.connect(dbConnectionStr);
        }catch(err){
            this.error = {
                title : "Connect To Database",
                type: "DB000",
                message: err.message
            };
        }
        // use static authenticate method of model in LocalStrategy
        const LocalStrategy = require('passport-local').Strategy; 
        passport.use(new LocalStrategy(accountModel.authenticate())); 
        passport.serializeUser(function(user, done) {
            done(null, user._id);
            // if you use Model.id as your idAttribute maybe you'd want
            // done(null, user.id);
        });
        
        passport.deserializeUser(function(id, done) {
            var user =  accountModel.findById(id);
            done(null, user);
        });
    }

    async createNewAccount(i_username, i_password){
        try{ 
            if(!await accountModel.exists({username: i_username})){       
                await accountModel.register({username:i_username}, i_password);
                return 1;
            }
            else{
                return 0;
            }
        }catch(err){
            this.error = {
                title : "Create New Account",
                type: "DB001",
                message: err.message
            };
        }
    }

    async findAndCreateExternalAccount(profile){
        try{
            let account ;
            if(profile.provider === "google"){
                account = await accountModel.findOne({"externalInfos.sub" : profile.id});
            }else{
                account = await accountModel.findOne({"externalInfos.id" : profile.id});
            }

            if(!account){
                account = new accountModel({
                    provider: profile.provider,
                    externalInfos: profile._json
                });
                await account.save();
            }
            return account;
        }catch(err){            
            this.error = {
            title : "Create by "+profile.provider+" account",
            type: "DB001",
            message: err.message
        };}
    }

    /**
     * Check if the account is correct
     *
     * @param   i_username : username
     * @param   i_password : password
     * @returns -1: User is not exist, 0: User is exist but password is incorrect, 1: Username and password is matched.
     */
    async checkAccountCorrect(i_username, i_password){
        try{
            if(user){
                
                if(result ===  true){
                    return 1;
                }else{
                    return 0;
                }
            }else{
                return -1;
            }
        }catch(err){
            this.error = {
                title : "Check Account Correct",
                type: "DB001",
                message: err.message
            };
        }     
    }

    async getAccountInformations(i_username, i_password){
        try{
            let accountCorrentValue = await checkAccountCorrect(i_username,i_password);
            if(accountCorrentValue === 1){
                return await accountModel.findOne({username : i_username, password : i_password});
            }else{
                console.log("The account is not correct");
            }
        }catch(err){
            this.error = {
                title : "Get Account Informations",
                type: "DB001",
                message: err.message
            };
        }
    }

    async deleteAccount(accountId, password){
        try{
            let accountExist = await accountModel.exists({_id : accountId, password: password});
            if(accountExist){
                await accountModel.deleteOne({_id : accountId});   
            }
        }catch(err){
            this.error = {
                title : "Delete Account",
                type: "DB001",
                message: err.message
            };
        }
    }

    async getAllScecrets(){
        try{
             return await secretModel.find({});
        }catch(err){
            this.error = {
                title : "Get All Secrets",
                type: "DB002",
                message: err.message
            };
        }
    }

    async getScecretsOfAccount(accountId, password){
        try{
            let accountExist = await accountModel.exists({_id : accountId, password: password});
            if(accountExist){
                return await accountModel.findOne({_id : accountId}).postSecrets;   
            }

        }catch(err){
            this.error = {
                title : "Get All Secrets",
                type: "DB002",
                message: err.message
            };
        }
    }

    async createNewSecret(accountID, secretContent){
        try{
            //create new secret
            let secret = new secretModel({content : secretContent});

            //Save to all secret collections
            await secret.save();

            //Push secret on account
            let account = await accountModel.findOne({_id : accountID});
            account.postSecrets.push(secret);
            account.save();
            
        }catch(err){
            this.error = {
                title : "Create New Secret",
                type: "DB002",
                message: err.message
            };
        }
    }
}

module.exports = DBConnecting;