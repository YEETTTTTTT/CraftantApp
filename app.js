//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const validator = require('validator');


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: "OurLittleSecret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
  username: {
    type: String,
    required: [true, "Username is required."],
    unique: [true, "Username is taken."]
  },
  email: {
    type: String,
    required: [true, "Email is required."],
    unique: [true, "Email Address is taken."],
    validate: [validator.isEmail, "Enter a valid email address."]
  },
  password: String,
  userType: {
    type: String,
    required: [true, "Enter a password"],
    minLength: [6, "Password should be at least 6 characters."],
    maxLength: [20, "Password should not be longer than 20 characters."]
  },
  fName: String,
  lName: String,
  phoneNumber: Number,
  address: String,
  postCode: Number,
});

//use to hash and salt passwords
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

//creates cookie
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
  res.render("home");
});


app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/register_page2", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("register_page2", {userType: req.user.userType});
  } else {
    res.redirect("/login");
  }
});

//check if user is already logged in
app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets", {userType: req.user.userType});
  } else {
    res.redirect("/login");
  }
});

app.post("/", function(req, res) {
  res.render("home");
});

app.post("/register", function(req, res) {
  User.register({username: req.body.username, email: req.body.name, userType: req.body.select}, req.body.password, function(err, user){
    if (err) {
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/register_page2");
      })
    }
  });
});

app.post("/register_page2", function(req, res) {
  User.findOneAndUpdate({
    username: req.user.username
  }, {
      fName: req.body.fName,
      lName: req.body.lName,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      postCode: req.body.postCode
  }, {new: true}, function(err, user) {
    if (err) {
      console.log(err);
    } else {
      console.log("update success");
      res.redirect("/secrets");
    }
  });
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  })
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
