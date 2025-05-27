const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const pricingRoute = require("./pricingRoute");
const userRoute = require("./userRoute");
const algoRoute = require("./algoRoute");
const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
const corsOptions = {
  origin: ["https://www.indexwizard.xyz", "https://indexwizard.xyz", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002"], // Allow specific origins
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  optionsSuccessStatus: 204 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Add OPTIONS pre-flight handler for CORS
app.options('*', cors(corsOptions));

// Improved MongoDB connection with retry logic and better error handling
const connectWithRetry = async () => {
  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    family: 4 // Force IPv4
  };
  
  console.log('Attempting to connect to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('Successfully connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB on first attempt:', err.message);
    // Log the MongoDB URI (without sensitive parts)
    const sanitizedUri = process.env.MONGODB_URI ? 
      process.env.MONGODB_URI.replace(/:\/\/([^:]+):([^@]+)@/, '://*****:*****@') : 
      'undefined';
    console.log(`MongoDB URI format: ${sanitizedUri}`);
    
    // Try again after a delay
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection
connectWithRetry();

app.get("/", (req, res) => {
  res.json("Hello Server");
});

app.use("/api/v1/pricing", pricingRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/algos", algoRoute);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
