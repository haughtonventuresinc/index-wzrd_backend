const express = require("express");
const { getEmail, postEmail } = require("./pricingController");
const route = express.Router();

route.get("/", getEmail);
route.post("/save", postEmail);

module.exports = route;
