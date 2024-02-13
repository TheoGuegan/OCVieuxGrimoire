require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const bookRoutes = require("./routes/book.js");
const userRoutes = require("./routes/user.js");

const dbUrl = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}${process.env.DB_HOST}`;

mongoose
  .connect(dbUrl)
  .then(() => console.log("Connexion à MongoDB réussie !!"))
  .catch((error) => console.error("Connexion à MongoDB échouée !", error));

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api/books", bookRoutes);
app.use("/api/auth", userRoutes);

module.exports = app;
