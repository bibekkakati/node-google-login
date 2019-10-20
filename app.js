const express = require("express");
const passport = require("passport");
const Strategy = require("passport-google-oauth20");
const mongoose = require("mongoose");
const keys = require("./config/keys");
const User = require("./models/User");

//create express app
var app = express();

//mongoDB connection
mongoose.connect(keys.mongodb.dbURI, { useNewUrlParser: true }, () => {
  console.log("MongoDB connected successfully");
});

//serialize
passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

//deserialize
passport.deserializeUser((id, cb) => {
  User.findById(id)
    .then(user => {
      cb(null, user);
    })
    .catch(e => console.log(e));
});

app.use(require("morgan")("combined"));
app.use(require("cookie-parser")());
app.use(require("body-parser").urlencoded({ extended: false }));
app.use(
  require("express-session")({
    secret: keys.session.cookieKey,
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 10 * 24 * 60 * 60 * 1000
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

//Initialization of Strategy
passport.use(
  new Strategy(
    {
      clientID: keys.google.clientID,
      clientSecret: keys.google.clientSecret,
      callbackURL: "/login/google/callback"
    },
    (accessToken, refreshToken, profile, cb) => {
      //Check if user already registered
      User.findOne({ googleid: profile.id })
        .then(registeredUser => {
          if (registeredUser) {
            //already registered
            cb(null, registeredUser);
            console.log("Registered user is " + registeredUser);
          } else {
            //not registered, so registered the user
            new User({
              username: profile.displayName,
              googleid: profile.id
            })
              .save()
              .then(newUser => {
                console.log("New user created" + newUser);
                cb(null, newUser);
              })
              .catch(e => console.log(e));
          }
        })
        .catch(e => console.log(e));
    }
  )
);

var port = process.env.PORT || 3000;

//set view dir
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

//@route  - GET  /
//@desc   - a route to home page
//@access - PUBLIC
app.get("/", (req, res) => {
  res.render("home", { user: req.user });
});

//@route  - GET  /
//@desc   - a route to privacy page
//@access - PUBLIC
app.get("/privacy", (req, res) => {
  res.render("privacy");
});

//@route  - GET  /login
//@desc   - a route to login page
//@access - PUBLIC
app.get("/login", (req, res) => {
  res.render("login");
});

//@route  - GET  /login
//@desc   - a route to login page
//@access - PUBLIC
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

//@route  - GET  /login/google
//@desc   - a route to google auth
//@access - PUBLIC
app.get(
  "/login/google",
  passport.authenticate("google", { scope: ["profile"] })
);

//@route  - GET  /login/google/callback
//@desc   - a route after successful google auth
//@access - PUBLIC
app.get(
  "/login/google/callback",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/login"
  }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

//@route  - GET  /profile
//@desc   - a route to profile page
//@access - PRIVATE
app.get(
  "/profile",
  require("connect-ensure-login").ensureLoggedIn(),
  (req, res) => {
    res.render("profile", { user: req.user });
  }
);

app.listen(port, console.log("Server ruuning at http://localhost:" + port));
