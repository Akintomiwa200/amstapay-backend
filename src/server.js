// src/server.js
require('dotenv').config({ debug: false });
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

// Color codes for beautiful terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  
  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
};

// Function to draw a horizontal line
const drawLine = (char = "═", length = 60) => {
  return colors.dim + char.repeat(length) + colors.reset;
};

// Function to center text
const centerText = (text, width = 60) => {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return " ".repeat(leftPad) + text + " ".repeat(rightPad);
};

// Function to print a beautiful banner
const printBanner = () => {
  const banner = `
${colors.cyan}${colors.bright}   ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ 
  ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
  ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌
  ▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌       ▐░▌
  ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░▌       ▐░▌▐░▌       ▐░▌
  ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░▌       ▐░▌
   ▀▀▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌       ▐░▌▐░▌       ▐░▌
            ▐░▌▐░▌       ▐░▌▐░▌       ▐░▌▐░▌       ▐░▌
   ▄▄▄▄▄▄▄▄▄█░▌▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌
  ▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
   ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀ 
${colors.reset}
  `;
  console.log(banner);
};

// Function to print server info box
const printServerInfo = () => {
  const width = 58;
  const line = drawLine("═", width);
  
  console.log("\n" + colors.green + line + colors.reset);
  console.log(colors.bgGreen + colors.black + colors.bright + 
    centerText("✨ AMSTAPAY SERVER STARTED SUCCESSFULLY ✨", width) + 
    colors.reset);
  console.log(colors.green + line + colors.reset);
  
  console.log(colors.dim + "┌" + "─".repeat(width) + "┐" + colors.reset);
  
  // Server URL
  console.log(colors.dim + "│" + colors.reset + " " + 
    colors.yellow + "📍" + colors.reset + " " + colors.bright + "Server URL:" + colors.reset + 
    " ".repeat(width - 22) + colors.dim + "│" + colors.reset);
  console.log(colors.dim + "│" + colors.reset + "   " + 
    colors.cyan + "➜  Local:" + colors.reset + "   " + 
    colors.bright + `http://localhost:${PORT}` + colors.reset +
    " ".repeat(width - 31 - String(PORT).length) + colors.dim + "│" + colors.reset);
  
  console.log(colors.dim + "│" + colors.reset + "   " + 
    colors.cyan + "➜  Network:" + colors.reset + " " + 
    colors.bright + `http://${getLocalIP()}:${PORT}` + colors.reset +
    " ".repeat(width - 35 - String(PORT).length - getLocalIP().length) + colors.dim + "│" + colors.reset);
  
  console.log(colors.dim + "├" + "─".repeat(width) + "┤" + colors.reset);
  
  // Documentation
  console.log(colors.dim + "│" + colors.reset + " " + 
    colors.magenta + "📚" + colors.reset + " " + colors.bright + "Documentation:" + colors.reset +
    " ".repeat(width - 27) + colors.dim + "│" + colors.reset);
  console.log(colors.dim + "│" + colors.reset + "   " + 
    colors.blue + "➜  Swagger UI:" + colors.reset + " " + 
    colors.underline + `http://localhost:${PORT}/docs` + colors.reset +
    " ".repeat(width - 34 - String(PORT).length) + colors.dim + "│" + colors.reset);
  
  console.log(colors.dim + "│" + colors.reset + "   " + 
    colors.blue + "➜  API Explorer:" + colors.reset + " " + 
    colors.underline + `http://localhost:${PORT}/api/v1` + colors.reset +
    " ".repeat(width - 37 - String(PORT).length) + colors.dim + "│" + colors.reset);
  
  console.log(colors.dim + "├" + "─".repeat(width) + "┤" + colors.reset);
  
  // Environment
  const env = process.env.NODE_ENV || 'development';
  const envColor = env === 'production' ? colors.red : colors.yellow;
  console.log(colors.dim + "│" + colors.reset + " " + 
    colors.cyan + "🔧" + colors.reset + " " + colors.bright + "Environment:" + colors.reset +
    " ".repeat(width - 25) + colors.dim + "│" + colors.reset);
  console.log(colors.dim + "│" + colors.reset + "   " + 
    envColor + "➜  Mode:" + colors.reset + "     " + 
    colors.bright + env.toUpperCase() + colors.reset +
    " ".repeat(width - 26 - env.length) + colors.dim + "│" + colors.reset);
  
  console.log(colors.dim + "├" + "─".repeat(width) + "┤" + colors.reset);
  
  // Database Status
  console.log(colors.dim + "│" + colors.reset + " " + 
    colors.green + "💾" + colors.reset + " " + colors.bright + "Database:" + colors.reset +
    " ".repeat(width - 22) + colors.dim + "│" + colors.reset);
  console.log(colors.dim + "│" + colors.reset + "   " + 
    colors.green + "➜  Status:" + colors.reset + "   " + 
    colors.bright + "✅ CONNECTED" + colors.reset +
    " ".repeat(width - 31) + colors.dim + "│" + colors.reset);
  
  console.log(colors.dim + "└" + "─".repeat(width) + "┘" + colors.reset);
};

// Function to get local IP address
const getLocalIP = () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

// Function to print feature list
const printFeatures = () => {
  const width = 58;
  const features = [
    { icon: "🔐", text: "Secure Authentication (JWT)", color: colors.yellow },
    { icon: "💸", text: "Instant Money Transfers", color: colors.green },
    { icon: "📱", text: "Cross-Platform Mobile Support", color: colors.cyan },
    { icon: "🔄", text: "Real-time Transaction Updates", color: colors.magenta },
    { icon: "👛", text: "Digital Wallet Management", color: colors.blue },
    { icon: "🌐", text: "Web3 Payment Integration", color: colors.purple || colors.magenta },
    { icon: "📊", text: "Transaction History & Analytics", color: colors.yellow },
    { icon: "🔔", text: "Push Notifications", color: colors.red }
  ];
  
  console.log("\n" + colors.dim + "╭" + "─".repeat(width) + "╮" + colors.reset);
  console.log(colors.dim + "│" + colors.reset + " " + 
    colors.bright + colors.cyan + "🎯 AVAILABLE FEATURES" + colors.reset +
    " ".repeat(width - 22) + colors.dim + "│" + colors.reset);
  console.log(colors.dim + "├" + "─".repeat(width) + "┤" + colors.reset);
  
  features.forEach(feature => {
    const line = ` ${feature.icon}  ${feature.text}`;
    const padding = width - line.length;
    console.log(colors.dim + "│" + colors.reset + 
      feature.color + line + colors.reset +
      " ".repeat(padding) + colors.dim + "│" + colors.reset);
  });
  
  console.log(colors.dim + "╰" + "─".repeat(width) + "╯" + colors.reset);
};

// Function to print API endpoints
const printEndpoints = () => {
  const width = 58;
  const endpoints = [
    { method: "POST", path: "/api/v1/auth/register", desc: "User Registration" },
    { method: "POST", path: "/api/v1/auth/login", desc: "User Login" },
    { method: "GET",  path: "/api/v1/users/profile", desc: "Get Profile" },
    { method: "POST", path: "/api/v1/transactions/send", desc: "Send Money" },
    { method: "GET",  path: "/api/v1/transactions/history", desc: "Transaction History" },
    { method: "GET",  path: "/api/v1/wallet/balance", desc: "Check Balance" },
    { method: "POST", path: "/api/v1/wallet/fund", desc: "Fund Wallet" }
  ];
  
  const methodColors = {
    "GET": colors.green,
    "POST": colors.blue,
    "PUT": colors.yellow,
    "DELETE": colors.red
  };
  
  console.log("\n" + colors.dim + "╭" + "─".repeat(width) + "╮" + colors.reset);
  console.log(colors.dim + "│" + colors.reset + " " + 
    colors.bright + colors.yellow + "🚀 API ENDPOINTS (Sample)" + colors.reset +
    " ".repeat(width - 27) + colors.dim + "│" + colors.reset);
  console.log(colors.dim + "├" + "─".repeat(width) + "┤" + colors.reset);
  
  endpoints.forEach(endpoint => {
    const methodColor = methodColors[endpoint.method] || colors.white;
    const line = ` ${methodColor}${endpoint.method.padEnd(6)}${colors.reset} ${colors.cyan}${endpoint.path.padEnd(35)}${colors.reset} ${colors.dim}${endpoint.desc}${colors.reset}`;
    const displayLength = 6 + 35 + endpoint.desc.length + 3;
    const padding = Math.max(0, width - displayLength);
    console.log(colors.dim + "│" + colors.reset + line + " ".repeat(padding) + colors.dim + "│" + colors.reset);
  });
  
  console.log(colors.dim + "╰" + "─".repeat(width) + "╯" + colors.reset);
};

// Function to print startup message with spinner animation
const showStartupAnimation = async () => {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  
  const interval = setInterval(() => {
    process.stdout.write("\r" + colors.yellow + frames[i] + colors.reset + " Initializing Amstapay Server...");
    i = (i + 1) % frames.length;
  }, 80);
  
  // Simulate loading time
  await new Promise(resolve => setTimeout(resolve, 1500));
  clearInterval(interval);
  process.stdout.write("\r" + " ".repeat(50) + "\r");
};

// Main startup function
const startServer = async () => {
  try {
    // Show loading animation
    await showStartupAnimation();
    
    // Clear console for better visual
    console.clear();
    
    // Print beautiful banner
    printBanner();
    
    // Connect to DB and start server
    await connectDB();
    
    app.listen(PORT, () => {
      // Print server information box
      printServerInfo();
      
      // Print features
      printFeatures();
      
      // Print API endpoints
      printEndpoints();
      
      // Print footer with helpful tips
      const width = 58;
      console.log("\n" + colors.dim + "╰" + "─".repeat(width) + "╯" + colors.reset);
      console.log(colors.dim + "  " + colors.reset + 
        colors.bright + colors.green + "💡 Pro Tips:" + colors.reset);
      console.log(colors.dim + "  " + colors.reset + 
        "   • Press " + colors.yellow + "Ctrl + C" + colors.reset + " to stop the server");
      console.log(colors.dim + "  " + colors.reset + 
        "   • Open " + colors.underline + "http://localhost:" + PORT + "/docs" + colors.reset + 
        " for interactive API documentation");
      console.log(colors.dim + "  " + colors.reset + 
        "   • Use " + colors.yellow + "npm run dev" + colors.reset + 
        " for hot-reload during development");
      
      // Print timestamp
      const timestamp = new Date().toLocaleString();
      console.log("\n" + colors.dim + "  ⏰ Server started at: " + 
        colors.reset + colors.bright + timestamp + colors.reset);
      
      console.log("\n" + colors.green + "  ✨ Amstapay is ready to serve! ✨" + colors.reset + "\n");
    });
  } catch (error) {
    console.error(colors.red + "❌ Failed to start server:" + colors.reset, error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log("\n" + colors.yellow + "\n  🛑 Received shutdown signal. Closing server gracefully..." + colors.reset);
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start the server
startServer();