//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const dbConnectingClass = require("./dbConnecting");
require("dotenv").config();
var GoogleStrategy = require("passport-google-oauth20").Strategy;
var FacebookStrategy = require("passport-facebook").Strategy; 

const app = express();
const port = process.env.PORT;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended : true
}));

app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

const dbConnecting = new dbConnectingClass(passport);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  }, async function(accessToken, refreshToken, profile, cb) {
    const user = await dbConnecting.findAndCreateExternalAccount(profile);
    return cb(dbConnecting.error,user);
  }
));

app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets",  passport.authenticate("google", { failureRedirect: "/" }),
  function(req, res) {
    res.redirect("/secrets");
});

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  async function(accessToken, refreshToken, profile, cb) {
    const user = await dbConnecting.findAndCreateExternalAccount(profile);
    return cb(dbConnecting.error,user);
  }
));
app.get("/auth/facebook",
  passport.authenticate("facebook", passport.authenticate("facebook", { scope: ["profile","email"] })));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

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

app.post("/login", passport.authenticate("local", { failureRedirect : "/login"}),
    function(req, res) {
        res.redirect("/secrets");
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
