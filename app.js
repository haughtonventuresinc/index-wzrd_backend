const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const pricingRoute = require("./pricingRoute");
const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
const corsOptions = {
  origin: "*", // Adjust this to specify the allowed origin(s)
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
};

app.use(cors(corsOptions));
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("ERROR: DB not connected"));

app.get("/", (req, res) => {
  res.json("Hello Server");
});

app.use("/api/v1/pricing", pricingRoute);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
