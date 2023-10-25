//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const dbConnectingClass = require("./dbConnecting");
require("dotenv").config();

const app = express();
const port = process.env.PORT;

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended : true
}));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

const dbConnecting = new dbConnectingClass(passport);

let loginMsg ;
let registerMsg;

app.get("/", (req,res) =>{
    loginMsg = undefined;
    registerMsg = undefined;
    res.render("home");
});

app.get("/register", (req,res) =>{
    res.render("register", {notifyMsg: registerMsg});
});

app.get("/login", (req,res) =>{
    res.render("login",{notifyMsg : loginMsg});
});

app.get("/secrets" , async (req,res) =>{
    if(req.isAuthenticated()){
        const m_secrets = await dbConnecting.getAllScecrets();
        res.render("secrets",{secrets : m_secrets})
    }
    else{
        res.redirect("/");
    }
});

app.get("/logout" ,(req,res) =>{
    req.logout((err)=>{
        if(err){
            console.log("Error");
        }else{
            res.redirect("/");
        }
    });
});

app.get("/submit",(req,res) =>{
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/");
    }
});

app.post("/register",async (req,res)=>{
    let statusCode = await dbConnecting.createNewAccount(req.body.username,req.body.password, req, res);
    if(statusCode === 0){
        registerMsg = "The account is exists. Please choose the other username !";
        res.redirect("/register")
    }else if(statusCode === 1){
        passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets");
        });
    }else{
        registerMsg = dbConnecting.error.message;
        res.redirect("/register")
    }
});

app.post("/login", passport.authenticate("local", {
        successRedirect : "/secrets",
        failureRedirect : "/login"
    }),(req,res)=>{

});

app.post("/submit", async (req,res) =>{
    if(req.isAuthenticated()){
        await dbConnecting.createNewSecret(req.user._id, req.body.secret);
        res.redirect("/secrets")
    }else{
        res.redirect("/");
    }
})

app.listen(port, function(){
    console.log(`Server started on port ${port}`);
});
