const Vonage = require("@vonage/server-sdk");

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

/**
 * Send an SMS using Vonage
 * @param {string} to - Recipient phone number in international format, e.g., +2348012345678
 * @param {string} message - Message body
 */
const sendSMS = (to, message) => {
  return new Promise((resolve, reject) => {
    vonage.message.sendSms(process.env.VONAGE_VIRTUAL_NUMBER, to, message, (err, responseData) => {
      if (err) {
        console.error("SMS sending failed:", err);
        return reject(err);
      }
      if (responseData.messages[0].status !== "0") {
        console.error("SMS failed with status:", responseData.messages[0]["error-text"]);
        return reject(new Error(responseData.messages[0]["error-text"]));
      }
      resolve(responseData);
    });
  });
};

module.exports = { sendSMS };
