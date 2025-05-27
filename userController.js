const PRICING = require("./pricingSchema");

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

    // Check if user exists in the pricing collection
    const user = await PRICING.findOne({ email });

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
    return res.status(500).json({
      success: false,
      message: "Server error",
      status: 500,
      error: err.message,
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

    // Check if user already exists
    const existingUser = await PRICING.findOne({ email });

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

    // Create new user
    const newUser = new PRICING({
      email,
    });

    const savedUser = await newUser.save();

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
  } catch (err) {
    console.error("Error creating user:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      status: 500,
      error: err.message,
    });
  }
};

module.exports = { checkUser, createUser };
