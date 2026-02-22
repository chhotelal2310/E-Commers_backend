require("dotenv").config({ path: "../.env" });
const express = require("express");
const cookieParser = require("cookie-parser");
const connectMongo = require("./config/mongoose");
const routes = require("./routes/index");

const morgan = require("morgan");
const cors = require("cors");

connectMongo();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://infinite-mart-ecom.vercel.app",
  "https://infinite-mart-assistance.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(morgan("combined"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(routes);

module.exports = app;
