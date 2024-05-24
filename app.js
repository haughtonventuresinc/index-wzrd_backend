const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const pricingRoute = require("./pricingRoute");
const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
    origin: 'https://wzrd-omega.vercel.app', // Replace with your front-end URL
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization'
}));

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("ERROR:DB not connected"));

app.get("/", (req, res) => {
  res.json("Hello Server");
});

app.use("/api/v1/pricing", pricingRoute);

app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});
