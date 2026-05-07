const USSD = require("../models/USSD");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

const MENU_MAIN = "Welcome to AmstaPay\n1. Check Balance\n2. Transfer\n3. Buy Airtime\n4. My Account\n0. Exit";

exports.handleUSSD = async (req, res) => {
  try {
    const { sessionId, phoneNumber, network, text, serviceCode } = req.body;
    if (!sessionId || !phoneNumber || text === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let session = await USSD.findOne({ sessionId });
    const input = text.trim();
    const parts = input.split("*").filter(Boolean);
    const lastInput = parts.length > 0 ? parts[parts.length - 1] : "";

    if (!session) {
      session = await USSD.create({
        sessionId, phoneNumber, network,
        level: 0, menu: "main",
        expiresAt: new Date(Date.now() + 300000),
      });
    }

    let response = "";
    let endSession = false;

    if (input === "" || input === "0") {
      if (input === "0") endSession = true;
      response = MENU_MAIN;
      session.level = 0;
      session.menu = "main";
    } else if (session.menu === "main") {
      if (lastInput === "1") {
        const user = session.user ? await User.findById(session.user) : await User.findOne({ phoneNumber });
        if (!user) {
          response = "You are not registered.\nDial *123# to register or visit our app.";
          endSession = true;
        } else {
          const wallet = await Wallet.findOne({ user: user._id });
          response = `Your balance is:\n₦${(wallet?.balance || 0).toLocaleString()}`;
        }
      } else if (lastInput === "2") {
        session.menu = "transfer_amount";
        session.level = 1;
        response = "Enter amount to transfer:\n₦";
      } else if (lastInput === "3") {
        session.menu = "airtime_phone";
        session.level = 1;
        response = "Enter phone number:";
      } else if (lastInput === "4") {
        response = "1. My Details\n2. My Wallet\n3. My Cards\n0. Back";
        session.menu = "account";
      } else {
        response = "Invalid option\n" + MENU_MAIN;
      }
    } else if (session.menu === "transfer_amount") {
      const amt = parseFloat(lastInput);
      if (isNaN(amt) || amt <= 0) {
        response = "Invalid amount.\nEnter amount:";
      } else {
        session.data = { ...session.data, amount: amt };
        session.menu = "transfer_recipient";
        response = "Enter recipient account number:";
      }
    } else if (session.menu === "transfer_recipient") {
      session.data = { ...session.data, recipient: lastInput };
      session.menu = "transfer_confirm";
      response = `Transfer ₦${session.data.amount} to\nAccount: ${lastInput}\n\n1. Confirm\n2. Cancel`;
    } else if (session.menu === "transfer_confirm") {
      if (lastInput === "1") {
        try {
          const user = await User.findOne({ phoneNumber });
          if (!user) {
            response = "You are not registered.";
            endSession = true;
          } else {
            const wallet = await Wallet.findOne({ user: user._id });
            if (!wallet || wallet.balance < session.data.amount) {
              response = "Insufficient balance.";
              endSession = true;
            } else {
              const recipient = await User.findOne({ amstapayAccountNumber: session.data.recipient });
              if (!recipient) {
                response = "Recipient not found.";
                endSession = true;
              } else {
                const rWallet = await Wallet.findOne({ user: recipient._id });
                wallet.balance -= session.data.amount;
                rWallet.balance += session.data.amount;
                await wallet.save();
                await rWallet.save();
                await Transaction.create({ sender: user._id, receiver: recipient._id, type: "normal_transfer", amount: session.data.amount, status: "success", description: "USSD Transfer" });
                response = `Transfer successful!\n₦${session.data.amount} sent to ${recipient.fullName}\nNew balance: ₦${wallet.balance.toLocaleString()}`;
                endSession = true;
              }
            }
          }
        } catch (err) {
          response = "Transfer failed. Try again.";
          endSession = true;
        }
      } else {
        response = "Transfer cancelled.";
        endSession = true;
      }
    } else if (session.menu === "airtime_phone") {
      session.data = { ...session.data, airtimePhone: lastInput };
      session.menu = "airtime_amount";
      response = "Enter amount:";
    } else if (session.menu === "airtime_amount") {
      const amt = parseFloat(lastInput);
      if (isNaN(amt) || amt <= 0) {
        response = "Invalid amount.";
      } else {
        session.data = { ...session.data, airtimeAmount: amt };
        session.menu = "airtime_network";
        response = "Select network:\n1. MTN\n2. Glo\n3. Airtel\n4. 9mobile";
      }
    } else if (session.menu === "airtime_network") {
      const networks = { "1": "MTN", "2": "GLO", "3": "AIRTEL", "4": "9MOBILE" };
      const networkName = networks[lastInput];
      if (!networkName) {
        response = "Invalid network.";
      } else {
        try {
          const user = await User.findOne({ phoneNumber });
          if (!user) {
            response = "Not registered.";
            endSession = true;
          } else {
            const wallet = await Wallet.findOne({ user: user._id });
            if (!wallet || wallet.balance < session.data.airtimeAmount) {
              response = "Insufficient balance.";
              endSession = true;
            } else {
              wallet.balance -= session.data.airtimeAmount;
              await wallet.save();
              await Transaction.create({ sender: user._id, type: "airtime", amount: session.data.airtimeAmount, status: "success", description: `USSD Airtime ${networkName} to ${session.data.airtimePhone}` });
              response = `₦${session.data.airtimeAmount} airtime sent to ${session.data.airtimePhone}`;
              endSession = true;
            }
          }
        } catch (err) {
          response = "Failed. Try again.";
          endSession = true;
        }
      }
    } else if (session.menu === "account") {
      if (lastInput === "0") {
        session.menu = "main";
        response = MENU_MAIN;
      } else {
        response = "Feature coming soon.\n0. Back";
      }
    } else {
      response = "Invalid option.\n" + MENU_MAIN;
    }

    if (endSession) {
      await USSD.deleteOne({ sessionId });
    } else {
      session.level = parts.length;
      await session.save();
    }

    res.set("Content-Type", "text/plain");
    res.send(response + (endSession ? "" : "\n\n0. Back to Main Menu"));
  } catch (err) {
    console.error("USSD error:", err);
    res.set("Content-Type", "text/plain");
    res.send("System error. Please try again.");
  }
};
