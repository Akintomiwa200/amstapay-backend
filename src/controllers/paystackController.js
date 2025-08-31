const axios = require("axios");
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

// Verify Bank Account
const verifyBankAccount = async (accountNumber, bankCode) => {
  const res = await axios.get(
    `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
  );
  return res.data.data;
};

// Create Transfer Recipient
const createRecipient = async (name, accountNumber, bankCode) => {
  const res = await axios.post(
    "https://api.paystack.co/transferrecipient",
    {
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    },
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
  );
  return res.data.data;
};

// Initiate Transfer
const initiateTransfer = async (amount, recipientCode, reason, reference) => {
  const res = await axios.post(
    "https://api.paystack.co/transfer",
    {
      source: "balance",
      amount: amount * 100, // convert to kobo
      recipient: recipientCode,
      reason,
      reference,
    },
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
  );
  return res.data.data;
};

module.exports = { verifyBankAccount, createRecipient, initiateTransfer };
