// scripts/createWallets.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
require("dotenv").config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find();

    for (const user of users) {
      const existingWallet = await Wallet.findOne({ user: user._id });
      if (!existingWallet) {
        const wallet = new Wallet({ user: user._id, balance: 0 });
        await wallet.save();
        console.log(`Wallet created for: ${user.fullName}`);
      }
    }

    console.log("✅ All wallets ensured");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
