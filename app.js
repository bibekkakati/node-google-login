const express = require("express");
const passport = require("passport");
const Strategy = require("passport-oauth2").Strategy;

passport.use(
  new Strategy(
    {
      authorizationURL: "https://node-google-login.herokuapp.com/login/google",
      tokenURL: "https://node-google-login.herokuapp.com/token",
      clientID:
        "259500391656-sumvvuo076tdmltcf6vgfprbui4avkd4.apps.googleusercontent.com",
      clientSecret: "XBaSp9-hHliEO6Bu44v9ZDSC",
      callbackURL: "https://node-google-login.herokuapp.com/login/google/callback"
    },
    (accessToken, refreshToken, profile, cb) => {
      User.findOrCreate({ exampleId: profile.id }, (err, user) => {
        return cb(err, user);
      });
    }
  )
);

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(object, cb) {
  cb(null, object);
});

var port = process.env.PORT || 3000;

//create express app
var app = express();

//set view dir
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(require("morgan")("combined"));
app.use(require("cookie-parser")());
app.use(require("body-parser").urlencoded({ extended: false }));
app.use(
  require("express-session")({
    secret: "node app",
    resave: true,
    saveUninitialized: true
  })
);
app.use(passport.initialize());
app.use(passport.session());

//@route  - GET  /
//@desc   - a route to home page
//@access - PUBLIC
app.get("/", (req, res) => {
  console.log("/home------------------" + req);
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

//@route  - GET  /login/google
//@desc   - a route to google auth
//@access - PUBLIC
app.get("/login/google", passport.authenticate("oauth2"));

//@route  - GET  /login/google/callback
//@desc   - a route after successful google auth
//@access - PUBLIC
app.get(
  "/login/google/callback",
  passport.authenticate("oauth2", { failureRedirect: "/login" }),
  (req, res) => {
    console.log("/login/google/callback--------------" + req);
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
    console.log("/profile--------------" + req);
    res.render("profile", { user: req.user });
  }
);

app.listen(port, console.log("Server ruuning at http://localhost:" + port));
