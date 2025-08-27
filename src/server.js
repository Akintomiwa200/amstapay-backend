// src/server.js
require('dotenv').config({ debug: false });
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Amstapay API running on http://localhost:${PORT}`);
    console.log(`📖 Swagger Docs at http://localhost:${PORT}/docs`);
  });
});
