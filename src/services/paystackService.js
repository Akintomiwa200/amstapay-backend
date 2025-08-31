// src/services/paystackService.js
const axios = require("axios");

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Verify a bank account number
 * @param {string} bankCode - e.g. "058" (GTBank)
 * @param {string} accountNumber - e.g. "0123456789"
 */
async function verifyAccount(bankCode, accountNumber) {
  const res = await paystack.get(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  );
  return res.data; // contains account_name, account_number, etc.
}

/**
 * Create a transfer recipient (required before initiating transfer)
 * @param {string} name - Account holder name
 * @param {string} accountNumber
 * @param {string} bankCode
 */
async function createRecipient(name, accountNumber, bankCode) {
  const res = await paystack.post("/transferrecipient", {
    type: "nuban",
    name,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: "NGN",
  });
  return res.data;
}

/**
 * Initiate a bank transfer
 * @param {string} recipientCode - Returned from createRecipient
 * @param {number} amount - Amount in kobo
 * @param {string} reason - Transfer description
 * @param {string} reference - Unique transaction reference
 */
async function initiateTransfer(recipientCode, amount, reason, reference) {
  const res = await paystack.post("/transfer", {
    source: "balance",
    amount,
    recipient: recipientCode,
    reason,
    reference,
  });
  return res.data;
}

/**
 * Verify a transfer status
 * @param {string} reference - Transaction reference
 */
async function verifyTransfer(reference) {
  const res = await paystack.get(`/transfer/verify/${reference}`);
  return res.data;
}



/**
 * Purchase Airtime
 * @param {string} phone - Recipient phone number
 * @param {number} amount - Amount in Naira
 * @param {string} reference - Unique transaction reference
 */
async function buyAirtime(phone, amount, reference) {
  const res = await paystack.post("/bill-payment/airtime", {
    customer: phone,
    amount: amount * 100, // convert to kobo
    reference,
  });
  return res.data;
}

/**
 * Purchase Data
 * @param {string} phone - Recipient phone number
 * @param {string} plan - Plan ID from Paystack
 * @param {string} reference
 */
async function buyData(phone, plan, reference) {
  const res = await paystack.post("/bill-payment/data", {
    customer: phone,
    plan, // Paystack Plan ID (MTN 1GB, etc)
    reference,
  });
  return res.data;
}


/**
 * Pay Cable TV Subscription
 * @param {string} smartCardNumber - Decoder smartcard/IUC number
 * @param {string} provider - Provider code (e.g. "dstv", "gotv", "startimes")
 * @param {string} plan - Plan/package code
 * @param {string} reference
 */
async function payCable(smartCardNumber, provider, plan, reference) {
  const res = await paystack.post("/bill-payment/cable", {
    customer: smartCardNumber,
    provider,
    plan,
    reference,
  });
  return res.data;
}


/**
 * Pay Electricity Bill
 * @param {string} meterNumber - Customer meter number
 * @param {string} disco - Disco code (e.g. "ikeja-electric")
 * @param {number} amount - Amount in Naira
 * @param {string} reference
 */
async function payElectricity(meterNumber, disco, amount, reference) {
  const res = await paystack.post("/bill-payment/electricity", {
    customer: meterNumber,
    amount: amount * 100,
    provider: disco,
    reference,
  });
  return res.data;
}




module.exports = {
  verifyAccount,
  createRecipient,
  initiateTransfer,
  verifyTransfer,
  buyAirtime,
  buyData,
  payCable,
  payElectricity,
};