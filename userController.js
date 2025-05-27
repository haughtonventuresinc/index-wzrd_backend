const User = require("./userSchema");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Check if a user exists by email
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

    // Check if user exists with timeout
    const user = await User.findOne({ email }).maxTimeMS(5000);

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
    return handleError(res, err, "Error checking user");
  }
};

// Register a new user
const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        status: 400,
      });
    }
    
    console.log(`Signing up user with email: ${email}`);
    
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
    const existingUser = await User.findOne({ email }).maxTimeMS(5000);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
        status: 409,
      });
    }

    // Create new user with a timeout for the save operation
    try {
      const newUser = new User({
        email,
        password, // Will be hashed by pre-save hook
      });

      // Set a timeout for the save operation
      const savePromise = newUser.save();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save operation timed out')), 5000)
      );
      
      // Race the save operation against a timeout
      const savedUser = await Promise.race([savePromise, timeoutPromise]);
      console.log(`Successfully registered user: ${email}`);

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
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
        message: "Failed to register user",
        status: 500,
        error: saveError.message,
      });
    }
  } catch (err) {
    return handleError(res, err, "Error registering user");
  }
};

// Login a user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        status: 400,
      });
    }
    
    console.log(`Logging in user with email: ${email}`);
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, connection state:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: "Database connection not available",
        status: 503,
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).maxTimeMS(5000);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status: 404,
      });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        status: 401,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      status: 200,
      data: {
        email: user.email,
        id: user._id,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return handleError(res, err, "Error logging in");
  }
};

// Request password reset
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        status: 400,
      });
    }
    
    console.log(`Password reset requested for email: ${email}`);
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, connection state:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: "Database connection not available",
        status: 503,
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).maxTimeMS(5000);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        status: 404,
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Set token and expiration (1 hour)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // In a real application, you would send an email with the reset link
    // For now, we'll just return the token in the response
    return res.status(200).json({
      success: true,
      message: "Password reset token generated",
      status: 200,
      data: {
        resetToken,
        email: user.email,
      },
    });
  } catch (err) {
    return handleError(res, err, "Error generating reset token");
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and password are required",
        status: 400,
      });
    }
    
    console.log(`Resetting password with token: ${token.substring(0, 6)}...`);
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, connection state:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: "Database connection not available",
        status: 503,
      });
    }

    // Find user by reset token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).maxTimeMS(5000);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired",
        status: 400,
      });
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset",
      status: 200,
      data: {
        email: user.email,
      },
    });
  } catch (err) {
    return handleError(res, err, "Error resetting password");
  }
};

// Helper function to handle errors
const handleError = (res, err, message) => {
  console.error(`${message}:`, err);
  
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
};

module.exports = { 
  checkUser, 
  signup, 
  login, 
  forgotPassword, 
  resetPassword 
};
