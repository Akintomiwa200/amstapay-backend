const axios = require("axios");

// -------------------
// Paystack BVN
// -------------------
exports.verifyBVN = async (bvn) => {
  try {
    const response = await axios.get(`https://api.paystack.co/bvn/${bvn}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });

    return { success: true, data: response.data.data };
  } catch (err) {
    console.error("BVN verification error:", err.response?.data || err.message);
    return { success: false, error: "BVN verification failed" };
  }
};

// -------------------
// Paystack Bank Resolve
// -------------------
exports.verifyBankAccount = async (accountNumber, bankCode) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    return { success: true, data: response.data.data };
  } catch (err) {
    console.error("Bank verification error:", err.response?.data || err.message);
    return { success: false, error: "Bank verification failed" };
  }
};

// -------------------
// SmileID NIN Verify
// -------------------
exports.verifyNIN = async (nin, firstName, lastName, dob) => {
  try {
    const payload = {
      partner_id: process.env.SMILE_ID_PARTNER_ID,
      api_key: process.env.SMILE_ID_API_KEY,
      id_number: nin,
      country: "NG",
      id_type: "NIN",
      first_name: firstName,
      last_name: lastName,
      dob: dob,
    };

    const response = await axios.post(
      `${process.env.SMILE_ID_URL}/identity_verification`,
      payload
    );

    return {
      success: response.data.result === "SUCCESS",
      data: response.data,
    };
  } catch (err) {
    console.error("NIN verification error:", err.response?.data || err.message);
    return { success: false, error: "NIN verification failed" };
  }
};
