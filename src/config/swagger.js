const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// =====================
// 🌍 ENV CONFIG
// =====================
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

// =====================
// 🎨 CLEAN UI THEME
// =====================
const customCss = `
:root {
  /* Softer light background (not pure white) */
  --bg-light: #f1f5f9;         /* soft slate */
  --bg-dark: #0f172a;

  /* Cards */
  --card-light: #f8fafc;       /* slightly coated white */
  --card-dark: #1e293b;

  /* Primary (Indigo) */
  --primary: #6366f1;

  /* Accent → now BLUE instead of green */
  --accent: #3b82f6;           /* clean blue */

  /* Text */
  --text-light: #0f172a;
  --text-dark: #e2e8f0;

  /* Borders / subtle UI */
  --border-light: #e2e8f0;
  --border-dark: #334155;
}

/* Base */
.swagger-ui {
  background: var(--bg-light);
  color: var(--text-light);
}



/* Dark mode */
body.dark-mode .swagger-ui {
  background: var(--bg-dark);
}

body.dark-mode .opblock {
  background: var(--card-dark);
  border: 1px solid var(--border-dark);
}

/* Accent usage */
.swagger-ui .response-col_status {
  color: var(--accent);
}

/* Topbar */
.swagger-ui .topbar {
  background: linear-gradient(90deg, #0f172a, #1e293b);
}

/* Cards */
.swagger-ui .opblock {
  background: var(--card-light);
  border: 1px solid var(--border-light);
}

/* Buttons */
.swagger-ui .btn {
  border-radius: 8px;
}

/* Authorize */
.swagger-ui .btn.authorize {
  background: var(--primary);
  color: white;
  border: none;
}

/* Success */
.swagger-ui .response-col_status {
  color: var(--accent);
  font-weight: bold;
}

/* DARK MODE */

  /* Dark mode */


body.dark-mode {
  background: var(--bg-dark);
  color: var(--text-dark);
}

body.dark-mode .opblock {
  background: var(--card-dark);
  border: 1px solid var(--border-dark);
}

body.dark-mode .topbar {
  background: #020617;
}


/* Accent usage */
.swagger-ui .response-col_status {
  color: var(--accent);
}


/* Toggle Button */
.theme-toggle {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  background: var(--primary);
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
}
`;

// =====================
// ⚡ THEME TOGGLE SCRIPT
// =====================
const customJs = `
(function () {
  const btn = document.createElement("button");
  btn.innerText = "🌙 Toggle Theme";
  btn.className = "theme-toggle";

  btn.onclick = () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "swagger-theme",
      document.body.classList.contains("dark-mode") ? "dark" : "light"
    );
  };

  document.body.appendChild(btn);

  // Load saved theme
  if (localStorage.getItem("swagger-theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
})();
`;

// =====================
// ⚙️ SWAGGER UI OPTIONS
// =====================
const swaggerUiOptions = {
  explorer: true,
  customCss,
  customJs,
  customSiteTitle: "AmstaPay API Docs",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    docExpansion: "list",
    tryItOutEnabled: true,
  },
};

// =====================
// 📄 OPENAPI DEFINITION
// =====================
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AmstaPay API",
      version: "1.0.0",
      description:
        "Production-ready API documentation for AmstaPay - Financial services with international transfers, Web3 integration, and real-time notifications.",
    },

    // ✅ SERVERS (LOCAL + PROD + CONDITIONAL STAGING)
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: "🧪 Local Development",
      },
      {
        url: "https://amstapay-backend.onrender.com/api/v1",
        description: "🚀 Production",
      },
      ...(isProd
        ? []
        : [
            {
              url: "https://staging.amstapay.com/api/v1",
              description: "🧪 Staging",
            },
          ]),
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64ecf3c42f0a2b0012345678" },
            fullName: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            phoneNumber: { type: "string", example: "+2348012345678" },
            amstapayAccountNumber: { type: "string", example: "08012345678" },
            accountType: {
              type: "string",
              enum: ["personal", "business", "enterprise", "company", "agent"],
            },
            isVerified: { type: "boolean", default: false },
            kycLevel: { type: "number", default: 0 },
            dateOfBirth: { 
              type: "string", 
              example: "24/05/1999",
              description: "Date of birth in DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD format"
            },
            gender: { type: "string", enum: ["male", "female", "other"] },
            residentialAddress: { type: "string" },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            _id: { type: "string" },
            sender: { $ref: "#/components/schemas/User" },
            receiver: { $ref: "#/components/schemas/User" },
            amount: { type: "number", example: 5000 },
            type: {
              type: "string",
              enum: [
                "qr_payment",
                "normal_transfer",
                "airtime",
                "data",
                "electricity",
                "schoolfees",
                "transport",
                "international_transfer",
                "web3_deposit",
                "web3_withdrawal",
                "crypto_payment",
                "fund",
                "withdraw",
              ],
            },
            status: {
              type: "string",
              enum: ["pending", "processing", "success", "failed", "reversed"],
            },
            reference: { type: "string", example: "TXN-123456" },
            description: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Wallet: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            balance: { type: "number", example: 50000 },
            currency: { type: "string", example: "NGN" },
          },
        },
        GiftCard: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            giftCardType: {
              type: "object",
              properties: {
                code: { type: "string" },
                name: { type: "string" },
                category: { type: "string" },
              },
            },
            giftCardCode: { type: "string", example: "GIFT-ABCD1234EFGH" },
            recipientEmail: { type: "string", format: "email" },
            recipientName: { type: "string" },
            message: { type: "string" },
            currency: { type: "string", enum: ["USD", "EUR", "GBP", "NGN"] },
            originalAmount: { type: "number", example: 100 },
            currentBalance: { type: "number", example: 100 },
            purchasedAmount: { type: "number" },
            feeAmount: { type: "number", default: 0 },
            status: {
              type: "string",
              enum: ["active", "redeemed", "expired", "cancelled"],
            },
            expiresAt: { type: "string", format: "date" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        GiftCardType: {
          type: "object",
          properties: {
            _id: { type: "string" },
            code: { type: "string", example: "AMAZON" },
            name: { type: "string", example: "Amazon Gift Card" },
            category: { type: "string", example: "Shopping" },
            description: { type: "string" },
            availableDenominations: {
              type: "array",
              items: { type: "number" },
              example: [10, 25, 50, 100],
            },
            currencies: {
              type: "array",
              items: { type: "string" },
              example: ["USD", "EUR"],
            },
            imageUrl: { type: "string" },
            isActive: { type: "boolean", default: true },
            expiryPeriod: { type: "number", default: 365 },
            minInvestment: { type: "number", example: 10 },
            maxInvestment: { type: "number", example: 1000 },
            features: [
              {
                title: { type: "string" },
                description: { type: "string" },
              },
            ],
          },
        },
        InvestmentPlan: {
          type: "object",
          properties: {
            _id: { type: "string" },
            code: { type: "string", example: "PLAN001" },
            name: { type: "string", example: "Fixed Savings Plan" },
            description: { type: "string" },
            type: {
              type: "string",
              enum: [
                "mutual-fund",
                "stocks",
                "treasury-bills",
                "bonds",
                "fixed-savings",
                "high-yield",
              ],
            },
            roi: {
              type: "number",
              example: 12.5,
              description: "Annual percentage yield",
            },
            minInvestment: { type: "number", example: 1000 },
            maxInvestment: { type: "number" },
            durations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  months: { type: "number", example: 6 },
                  minAmount: { type: "number", example: 5000 },
                  maxAmount: { type: "number" },
                  riskLevel: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                  },
                },
              },
            },
            riskLevel: { type: "string", enum: ["low", "medium", "high"] },
            payoutSchedule: {
              type: "string",
              enum: ["monthly", "quarterly", "at-maturity", "daily"],
            },
            features: [
              {
                title: { type: "string" },
                description: { type: "string" },
              },
            ],
            isActive: { type: "boolean", default: true },
          },
        },
        Report: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string", example: "Monthly Statement" },
            type: {
              type: "string",
              enum: [
                "statement",
                "budget-insights",
                "tax",
                "cashflow",
                "custom",
              ],
            },
            period: { type: "string", example: "2024-09" },
            totalIncome: { type: "number", example: 50000 },
            totalExpense: { type: "number", example: 35000 },
            netSavings: { type: "number", example: 15000 },
            data: {
              type: "object",
              properties: {
                categories: {
                  type: "object",
                  additionalProperties: { type: "number" },
                },
                breakdown: {
                  type: "object",
                  additionalProperties: { type: "number" },
                },
                transactions: { type: "number" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Investment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            plan: {
              type: "object",
              properties: {
                id: { type: "string" },
                code: { type: "string", example: "PLAN001" },
                name: { type: "string", example: "Fixed Savings Plan" },
                description: { type: "string" },
                roi: { type: "number", example: 12.5 },
              },
            },
            amount: { type: "number", example: 50000 },
            duration: {
              type: "object",
              properties: {
                months: { type: "number", example: 6 },
                startDate: { type: "string", format: "date" },
                endDate: { type: "string", format: "date" },
              },
            },
            roi: { type: "number", example: 12.5 },
            status: {
              type: "string",
              enum: ["active", "matured", "withdrawn", "cancelled", "pending"],
            },
            autoReinvest: { type: "boolean", default: false },
            expectedReturns: { type: "number", example: 6250 },
            currentValue: { type: "number", example: 52604.17 },
            accruedInterest: { type: "number", example: 2604.17 },
            reference: { type: "string" },
            payoutSchedule: {
              type: "string",
              enum: ["monthly", "quarterly", "at-maturity", "daily"],
            },
            nextPayoutDate: { type: "string", format: "date" },
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  amount: { type: "number" },
                  date: { type: "string", format: "date-time" },
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Loan: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            amount: { type: "number", example: 100000 },
            interestRate: { type: "number", example: 15.5 },
            purpose: {
              type: "string",
              enum: [
                "PERSONAL",
                "BUSINESS",
                "EDUCATION",
                "MEDICAL",
                "HOME_IMPROVEMENT",
                "OTHER",
              ],
            },
            duration: { type: "number", example: 12 },
            termMonths: { type: "number", example: 12 },
            monthlyInstallment: { type: "number", example: 9625 },
            totalRepayable: { type: "number", example: 115500 },
            status: {
              type: "string",
              enum: [
                "PENDING",
                "APPROVED",
                "DISBURSED",
                "ACTIVE",
                "COMPLETED",
                "DEFAULTED",
                "REJECTED",
                "CANCELLED",
              ],
            },
            outstandingBalance: { type: "number", example: 75000 },
            totalPaid: { type: "number", example: 25000 },
            employmentStatus: {
              type: "string",
              enum: [
                "EMPLOYED",
                "SELF_EMPLOYED",
                "UNEMPLOYED",
                "STUDENT",
                "RETIRED",
                "BUSINESS_OWNER",
              ],
            },
            monthlyIncome: { type: "number", example: 150000 },
            nextPaymentDate: { type: "string", format: "date" },
            nextPaymentAmount: { type: "number" },
            applicationDate: { type: "string", format: "date" },
            disbursementDate: { type: "string", format: "date" },
            riskAssessment: {
              type: "object",
              properties: {
                level: { type: "string", enum: ["low", "medium", "high"] },
                notes: { type: "string" },
              },
            },
            reference: { type: "string" },
            repaymentSchedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  dueDate: { type: "string", format: "date" },
                  amountDue: { type: "number" },
                  amountPaid: { type: "number" },
                  status: {
                    type: "string",
                    enum: ["pending", "paid", "overdue", "partial"],
                  },
                  payments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        amount: { type: "number" },
                        paymentDate: { type: "string", format: "date-time" },
                        method: { type: "string" },
                        reference: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
            applicationDetails: {
              type: "object",
              properties: {
                purpose: { type: "string" },
                duration: { type: "number" },
                employmentStatus: { type: "string" },
                monthlyIncome: { type: "number" },
                guarantorDetails: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    phone: { type: "string" },
                    email: { type: "string", format: "email" },
                    relationship: { type: "string" },
                    address: { type: "string" },
                  },
                },
                collateralDescription: { type: "string" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        InternationalTransfer: {
          type: "object",
          properties: {
            amount: { type: "number" },
            receiverCountry: { type: "string", example: "US" },
            receiverCurrency: { type: "string", example: "USD" },
            receiverAccountName: { type: "string" },
            receiverAccountNumber: { type: "string" },
            receiverBank: { type: "string" },
            receiverSwiftCode: { type: "string" },
            receiverEmail: { type: "string", format: "email" },
            receiverPhone: { type: "string" },
            exchangeRate: { type: "number" },
            status: {
              type: "string",
              enum: [
                "pending",
                "processing",
                "completed",
                "failed",
                "cancelled",
              ],
            },
            reference: { type: "string" },
            description: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

// =====================
// 🚀 INIT FUNCTION
// =====================
function swaggerDocs(app) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions),
  );

  // JSON spec
  app.get("/api-docs.json", (req, res) => {
    res.json(swaggerSpec);
  });

  // Optional: redirect root in dev
  if (!isProd) {
    app.get("/", (req, res) => {
      res.redirect("/api-docs");
    });
  }

  console.log(`
📚 Swagger Docs Running:
➜ Local: http://localhost:${PORT}/api-docs
➜ JSON:  http://localhost:${PORT}/api-docs.json
  `);
}

module.exports = swaggerDocs;
