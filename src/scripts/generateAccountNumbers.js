// scripts/generateAccountNumbers.js
const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const generateAccountNumber = () => {
  // Generate 10-digit number starting with non-zero
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({ amstapayAccountNumber: { $exists: false } });

    for (const user of users) {
      user.amstapayAccountNumber = generateAccountNumber();
      await user.save();
      console.log(`Generated account for: ${user.fullName} -> ${user.amstapayAccountNumber}`);
    }

    console.log("✅ All missing account numbers generated");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
