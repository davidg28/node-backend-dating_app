const path = require("path");
const express = require("express");
var redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
const multer = require("multer");
const mongoose = require("mongoose");

const engines = require("consolidate");

// const user = require("./routes/user");
const config = require("./config");
const auth = require("./routes/auth");

const app = express();
mongoose
  .connect(
    config.mongodbUri, { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("Connected to database!");
  })
  .catch((err) => {
    console.log(err.message)
    console.log("Connection failed!");
  });

app.use(redirectToHTTPS([/localhost:(\d{4})/], [/\/insecure/], 301));
app.use("/.well-known/acme-challenge/etuh7AiaIOKVMMsjWCaETryuTJY6cPI9_CdxLSbzaEI", (req, res) => {
  res.sendFile(path.join(__dirname, '/ssl/ssl.dat'));
});


app.engine("ejs", engines.ejs);
app.set("views", "./views");
app.set("view engine", "ejs");


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

app.use("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, '/privacy/index.html'));
});

app.use(express.static(path.join(__dirname, 'dist')));

app.use(/^((?!(api)).)*/, (req, res) => {
  res.sendFile(path.join(__dirname, '/dist/index.html'));
});

app.use("/api", auth);
module.exports = app;
