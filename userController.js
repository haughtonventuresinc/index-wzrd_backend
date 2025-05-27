const PRICING = require("./pricingSchema");
const mongoose = require("mongoose");

const checkUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        status: 400,
      });
    }
    
    console.log(`Checking for user with email: ${email}`);
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, connection state:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: "Database connection not available",
        status: 503,
      });
    }

    // Check if user exists in the pricing collection with timeout
    const user = await PRICING.findOne({ email }).maxTimeMS(5000);

    if (user) {
      return res.status(200).json({
        success: true,
        message: "User exists",
        status: 200,
        data: {
          email: user.email,
          id: user._id,
          createdAt: user.createdAt,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status: 404,
      });
    }
  } catch (err) {
    console.error("Error checking user:", err);
    
    // Provide more specific error messages based on the error type
    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        message: "Database operation failed",
        status: 503,
        error: err.message,
        errorType: err.name
      });
    } else if (err.name === 'TimeoutError' || err.message.includes('timed out')) {
      return res.status(504).json({
        success: false,
        message: "Database operation timed out",
        status: 504,
        error: err.message,
        errorType: err.name
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Server error",
      status: 500,
      error: err.message,
      errorType: err.name
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        status: 400,
      });
    }
    
    console.log(`Creating user with email: ${email}`);
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, connection state:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: "Database connection not available",
        status: 503,
      });
    }

    // Check if user already exists with timeout
    const existingUser = await PRICING.findOne({ email }).maxTimeMS(5000);

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "User already exists",
        status: 200,
        data: {
          email: existingUser.email,
          id: existingUser._id,
          createdAt: existingUser.createdAt,
        },
      });
    }

    // Create new user with a timeout for the save operation
    try {
      const newUser = new PRICING({
        email,
      });

      // Set a timeout for the save operation
      const savePromise = newUser.save();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save operation timed out')), 5000)
      );
      
      // Race the save operation against a timeout
      const savedUser = await Promise.race([savePromise, timeoutPromise]);
      console.log(`Successfully saved user: ${email}`);

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        status: 201,
        data: {
          email: savedUser.email,
          id: savedUser._id,
          createdAt: savedUser.createdAt,
        },
      });
    } catch (saveError) {
      console.error(`Error saving user ${email}:`, saveError);
      return res.status(500).json({
        success: false,
        message: "Failed to save user",
        status: 500,
        error: saveError.message,
      });
    }
  } catch (err) {
    console.error("Error creating user:", err);
    
    // Provide more specific error messages based on the error type
    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        message: "Database operation failed",
        status: 503,
        error: err.message,
        errorType: err.name
      });
    } else if (err.name === 'TimeoutError' || err.message.includes('timed out')) {
      return res.status(504).json({
        success: false,
        message: "Database operation timed out",
        status: 504,
        error: err.message,
        errorType: err.name
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Server error",
      status: 500,
      error: err.message,
      errorType: err.name
    });
  }
};

module.exports = { checkUser, createUser };
