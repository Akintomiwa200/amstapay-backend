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
      description: "Production-ready API documentation for AmstaPay.",
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
    },

    security: [{ bearerAuth: [] }],
  },

  apis: [
    "./src/routes/*.js",
    "./src/controllers/*.js",
    "./src/models/*.js",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

// =====================
// 🚀 INIT FUNCTION
// =====================
function swaggerDocs(app) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
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