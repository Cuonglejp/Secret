//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const dbConnecting = new (require("./dbConnecting"))();
require("dotenv").config();

const app = express();
const port = process.env.PORT;

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended : true
}));

let loginMsg ;
let registerMsg;
let secretMsg;
let logoutMsg;
let submitMsg;

let loginAccount ;

app.get("/", (req,res) =>{
    loginMsg = undefined;
    registerMsg = undefined;
    loginAccount = undefined;
    res.render("home");
});

app.get("/register", (req,res) =>{
    res.render("register", {notifyMsg: registerMsg});
});

app.get("/login", (req,res) =>{
    res.render("login",{notifyMsg : loginMsg});
});

app.get("/secrets", checkLoginAccountMiddleware , async (req,res) =>{
    const m_secrets = await dbConnecting.getAllScecrets();
    res.render("secrets",{secrets : m_secrets})
});

app.get("/logout",checkLoginAccountMiddleware ,(req,res) =>{
    loginAccount = undefined;
    statusMsg = undefined;
    res.redirect("/");
});

app.get("/submit",checkLoginAccountMiddleware,(req,res) =>{
    res.render("submit");
});

app.post("/register",async (req,res)=>{
    let statusCode = await dbConnecting.createNewAccount(req.body.username,req.body.password);
    if(statusCode === 0){
        registerMsg = "The account is exists. Please choose the other username !";
        res.redirect("/register")
    }else if(statusCode === 1){
        loginAccount = {
            username : req.body.username,
            password :req.body.password
        };
        res.redirect("/secrets");
    }else{
        //Change here : write to log file ?
        registerMsg = dbConnecting.error.message;
        res.redirect("/register")
    }
});

app.post("/login", (req,res)=>{
    loginAccount = {
        username : req.body.username,
        password :req.body.password
    };
    res.redirect("/secrets");
});

app.post("/submit", async (req,res) =>{
    let idOfAccount = dbConnecting.getAccountInformations(loginAccount.username, loginAccount.password);
    if(idOfAccount) {
        await dbConnecting.createNewSecret(idOfAccount, req.body.secret);
        res.redirect("/secrets");
    }else{
        res.redirect("/");
    }
})

async function checkLoginAccountMiddleware(req,res,next){
    if(!loginAccount){
        loginMsg = "Must login by account and password !";
        res.redirect("/");
    }
    else{
        const accountCorrentValue = await dbConnecting.checkAccountCorrect(loginAccount.username,loginAccount.password);
        if(accountCorrentValue === -1){
            loginMsg = "The account is not exist. Please register new account !";
            res.redirect("/login");
        }else if(accountCorrentValue === 1){
            loginMsg = "Login successfully";
            next();
        }
        else if(accountCorrentValue === 0){
            loginMsg = "Username or password is incorrect. Please input again !"
            res.redirect("/login");   
        }
    }
}

app.listen(port, function(){
    console.log(`Server started on port ${port}`);
});
