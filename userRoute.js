const express = require("express");
const { checkUser, createUser } = require("./userController");
const route = express.Router();

// Check if a user exists
route.post("/check", checkUser);

// Create a new user
route.post("/create", createUser);

module.exports = route;
