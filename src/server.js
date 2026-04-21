// src/server.js
require('dotenv').config({ debug: false });
const app = require("./app");
const connectDB = require("./config/db");
const os = require('os');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_BASE = process.env.API_BASE_URL || `http://localhost:${PORT}`;

// ─── ANSI Color Palette ───────────────────────────────────────────────────────
const c = {
  reset:     "\x1b[0m",
  bright:    "\x1b[1m",
  dim:       "\x1b[2m",
  underline: "\x1b[4m",   // ✅ Fixed: was colors.underscore / undefined "colors.underline"
  black:     "\x1b[30m",
  red:       "\x1b[31m",
  green:     "\x1b[32m",
  yellow:    "\x1b[33m",
  blue:      "\x1b[34m",
  magenta:   "\x1b[35m",
  cyan:      "\x1b[36m",
  white:     "\x1b[37m",
  bgBlack:   "\x1b[40m",
  bgRed:     "\x1b[41m",
  bgGreen:   "\x1b[42m",
  bgYellow:  "\x1b[43m",
  bgBlue:    "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan:    "\x1b[46m",
  bgWhite:   "\x1b[47m",
};

// ─── Utilities ────────────────────────────────────────────────────────────────
const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
};

const W = 62; // box width
const line  = (ch = '═') => c.dim + ch.repeat(W) + c.reset;
const hline = (ch = '─') => c.dim + ch.repeat(W) + c.reset;

const pad = (str, len) => {
  // strip ANSI codes to get visible length
  const visible = str.replace(/\x1b\[[0-9;]*m/g, '');
  return str + ' '.repeat(Math.max(0, len - visible.length));
};

const row = (content) => {
  const visible = content.replace(/\x1b\[[0-9;]*m/g, '');
  const padding = Math.max(0, W - visible.length);
  return c.dim + '│' + c.reset + ' ' + content + ' '.repeat(padding) + c.dim + '│' + c.reset;
};

const divider = () => c.dim + '├' + '─'.repeat(W) + '┤' + c.reset;

// ─── Banner ───────────────────────────────────────────────────────────────────
const printBanner = () => {
  console.log(c.cyan + c.bright);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║   █████╗ ███╗   ███╗███████╗████████╗ █████╗ ██████╗  ██╗   ║');
  console.log('║  ██╔══██╗████╗ ████║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗ ██║   ║');
  console.log('║  ███████║██╔████╔██║███████╗   ██║   ███████║██████╔╝ ██║   ║');
  console.log('║  ██╔══██║██║╚██╔╝██║╚════██║   ██║   ██╔══██║██╔═══╝  ╚═╝   ║');
  console.log('║  ██║  ██║██║ ╚═╝ ██║███████║   ██║   ██║  ██║██║      ██╗   ║');
  console.log('║  ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝      ╚═╝   ║');
  console.log('║                                                              ║');
  console.log('║' + c.yellow + '              ⚡ PAYMENT INFRASTRUCTURE v1.0.0 ⚡             ' + c.cyan + '║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(c.reset);
};

// ─── Server Info Box ──────────────────────────────────────────────────────────
const printServerInfo = () => {
  const localIP = getLocalIP();
  const envColor = NODE_ENV === 'production' ? c.red : c.yellow;

  console.log('\n' + line());
  console.log(c.bgGreen + c.black + c.bright +
    ' ✨ AMSTAPAY SERVER STARTED SUCCESSFULLY ✨'.padEnd(W + 2) + c.reset);
  console.log(line());

  console.log(c.dim + '┌' + '─'.repeat(W) + '┐' + c.reset);

  // ── Network ──
  console.log(row(c.bright + c.yellow + '📍 Server URLs' + c.reset));
  console.log(row(`  ${c.cyan}➜ Local${c.reset}      ${c.bright + c.underline}http://localhost:${PORT}${c.reset}`));
  console.log(row(`  ${c.cyan}➜ Network${c.reset}    ${c.bright + c.underline}http://${localIP}:${PORT}${c.reset}`));
  console.log(row(`  ${c.cyan}➜ Production${c.reset} ${c.bright + c.underline}${API_BASE}${c.reset}`));

  console.log(divider());

  // ── API Versions ──
  console.log(row(c.bright + c.magenta + '🔀 API Versioning' + c.reset));
  console.log(row(`  ${c.cyan}➜ v1 Base${c.reset}    ${c.bright + c.underline}http://localhost:${PORT}/api/v1${c.reset}`));

  console.log(divider());

  // ── Docs ──
  console.log(row(c.bright + c.blue + '📚 Documentation' + c.reset));
  console.log(row(`  ${c.blue}➜ Swagger UI${c.reset}  ${c.underline}http://localhost:${PORT}/api-docs${c.reset}`));
  console.log(row(`  ${c.blue}➜ JSON Spec${c.reset}   ${c.underline}http://localhost:${PORT}/docs.json${c.reset}`));
  console.log(row(`  ${c.blue}➜ Explorer${c.reset}    ${c.underline}http://localhost:${PORT}/api/v1${c.reset}`));
  console.log(row(`  ${c.blue}➜ Health${c.reset}      ${c.underline}http://localhost:${PORT}/health${c.reset}`));

  console.log(divider());

  // ── Environment ──
  console.log(row(c.bright + c.cyan + '🔧 Runtime' + c.reset));
  console.log(row(`  ${c.cyan}➜ Environment${c.reset} ${envColor + c.bright + NODE_ENV.toUpperCase() + c.reset}`));
  console.log(row(`  ${c.cyan}➜ Node.js${c.reset}     ${c.bright + process.version + c.reset}`));
  console.log(row(`  ${c.cyan}➜ Platform${c.reset}    ${c.bright + os.platform() + ' ' + os.arch() + c.reset}`));
  console.log(row(`  ${c.cyan}➜ PID${c.reset}         ${c.bright + process.pid + c.reset}`));
  console.log(row(`  ${c.cyan}➜ Memory${c.reset}      ${c.bright + Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB used' + c.reset}`));

  console.log(divider());

  // ── DB ──
  console.log(row(c.bright + c.green + '💾 Database' + c.reset));
  console.log(row(`  ${c.green}➜ Status${c.reset}     ${c.bright}✅ CONNECTED${c.reset}`));
  console.log(row(`  ${c.green}➜ Type${c.reset}       ${c.bright}MongoDB (Mongoose)${c.reset}`));

  console.log(c.dim + '└' + '─'.repeat(W) + '┘' + c.reset);
};

// ─── Features ─────────────────────────────────────────────────────────────────
const printFeatures = () => {
  const features = [
    { icon: '🔐', text: 'Secure Authentication (JWT + Refresh Tokens)', color: c.yellow },
    { icon: '💸', text: 'Instant Money Transfers (Local & Cross-border)',  color: c.green },
    { icon: '📱', text: 'Cross-Platform Mobile Support',                   color: c.cyan },
    { icon: '🔄', text: 'Real-time Transaction Updates (Webhooks)',         color: c.magenta },
    { icon: '👛', text: 'Digital Wallet Management',                        color: c.blue },
    { icon: '🌐', text: 'Web3 Payment Integration',                         color: c.magenta },
    { icon: '📊', text: 'Transaction History & Analytics',                  color: c.yellow },
    { icon: '🔔', text: 'Push Notifications (FCM)',                         color: c.red },
    { icon: '🛡️',  text: 'Rate Limiting & DDoS Protection',                 color: c.cyan },
    { icon: '📝', text: 'Audit Logging & Compliance',                       color: c.green },
  ];

  console.log('\n' + c.dim + '╭' + '─'.repeat(W) + '╮' + c.reset);
  console.log(row(c.bright + c.cyan + '🎯 AVAILABLE FEATURES' + c.reset));
  console.log(c.dim + '├' + '─'.repeat(W) + '┤' + c.reset);
  features.forEach(f => {
    console.log(row(`  ${f.color}${f.icon}  ${c.bright}${f.text}${c.reset}`));
  });
  console.log(c.dim + '╰' + '─'.repeat(W) + '╯' + c.reset);
};

// ─── Endpoints ────────────────────────────────────────────────────────────────
const printEndpoints = () => {
  const methodColor = { GET: c.green, POST: c.blue, PUT: c.yellow, PATCH: c.magenta, DELETE: c.red };
  const endpoints = [
    { method: 'POST',  path: '/api/v1/auth/register',           desc: 'User Registration'       },
    { method: 'POST',  path: '/api/v1/auth/login',              desc: 'User Login'               },
    { method: 'POST',  path: '/api/v1/auth/refresh',            desc: 'Refresh Access Token'     },
    { method: 'POST',  path: '/api/v1/auth/logout',             desc: 'Logout'                   },
    { method: 'GET',   path: '/api/v1/users/profile',           desc: 'Get Profile'              },
    { method: 'PUT',   path: '/api/v1/users/profile',           desc: 'Update Profile'           },
    { method: 'POST',  path: '/api/v1/transactions/send',       desc: 'Send Money'               },
    { method: 'GET',   path: '/api/v1/transactions/history',    desc: 'Transaction History'      },
    { method: 'GET',   path: '/api/v1/wallets/balance',         desc: 'Check Balance'            },
    { method: 'POST',  path: '/api/v1/wallets/fund',            desc: 'Fund Wallet'              },
    { method: 'POST',  path: '/api/v1/payments/initialize',     desc: 'Initialize Payment'       },
    { method: 'GET',   path: '/api/v1/payments/verify/:ref',    desc: 'Verify Payment'           },
  ];

  console.log('\n' + c.dim + '╭' + '─'.repeat(W) + '╮' + c.reset);
  console.log(row(c.bright + c.yellow + '🚀 API ENDPOINTS' + c.reset));
  console.log(c.dim + '├' + '─'.repeat(W) + '┤' + c.reset);

  endpoints.forEach(ep => {
    const mc = methodColor[ep.method] || c.white;
    const method = mc + c.bright + ep.method.padEnd(7) + c.reset;
    const path   = c.cyan + ep.path.padEnd(38) + c.reset;
    const desc   = c.dim + ep.desc + c.reset;
    console.log(row(`  ${method} ${path} ${desc}`));
  });

  console.log(c.dim + '╰' + '─'.repeat(W) + '╯' + c.reset);
};

// ─── Tips ─────────────────────────────────────────────────────────────────────
const printTips = () => {
  console.log('\n' + c.bright + c.green + '💡 Pro Tips:' + c.reset);
  console.log(`  • Press ${c.yellow}Ctrl + C${c.reset} to stop the server gracefully`);
  console.log(`  • Open ${c.underline}http://localhost:${PORT}/api-docs${c.reset} for interactive API docs`);
  console.log(`  • Visit ${c.underline}http://localhost:${PORT}/api/v1${c.reset} for API explorer`);
  console.log(`  • Run ${c.yellow}npm run dev${c.reset} for hot-reload during development`);
  if (NODE_ENV === 'production') {
    console.log(`  • ${c.red}${c.bright}PRODUCTION${c.reset} mode — ensure all env vars are set!`);
  }

  const ts = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });
  console.log(`\n  ⏰ Started: ${c.bright}${ts} (WAT)${c.reset}`);
  console.log(`\n${c.green} ✨ Amstapay is ready to serve! ✨${c.reset}\n`);
};

// ─── Startup Animation ────────────────────────────────────────────────────────
const showStartupAnimation = async () => {
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${c.yellow}${frames[i]}${c.reset}  Initializing Amstapay Server...`);
    i = (i + 1) % frames.length;
  }, 80);
  await new Promise(r => setTimeout(r, 1500));
  clearInterval(interval);
  process.stdout.write('\r' + ' '.repeat(50) + '\r');
};

// ─── Main Startup ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await showStartupAnimation();
    console.clear();
    printBanner();

    await connectDB();

    const server = app.listen(PORT, () => {
      printServerInfo();
      printFeatures();
      printEndpoints();
      printTips();
    });

    // ── Production-grade server hardening ──
    server.keepAliveTimeout = 65_000;      // > ALB/nginx 60s timeout
    server.headersTimeout   = 66_000;      // slightly above keepAlive

    return server;
  } catch (error) {
    console.error(c.red + '❌ Failed to start server:' + c.reset, error);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
let serverInstance;

const gracefulShutdown = async (signal) => {
  console.log(`\n${c.yellow}🛑 ${signal} received. Shutting down gracefully...${c.reset}`);
  if (serverInstance) {
    serverInstance.close(async () => {
      console.log(c.green + '✅ HTTP server closed.' + c.reset);
      // Close DB connection cleanly
      try {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log(c.green + '✅ Database connection closed.' + c.reset);
      } catch (e) { /* ignore */ }
      process.exit(0);
    });
    // Force exit after 10s if hung
    setTimeout(() => {
      console.error(c.red + '⚠️  Forced exit after timeout.' + c.reset);
      process.exit(1);
    }, 10_000);
  } else {
    process.exit(0);
  }
};

process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ─── Unhandled Errors ─────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error(c.red + '❌ Uncaught Exception:' + c.reset, err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error(c.red + '❌ Unhandled Rejection:' + c.reset, reason);
  gracefulShutdown('unhandledRejection');
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
startServer().then(srv => { serverInstance = srv; });