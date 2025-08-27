const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AmstaPay API",
      version: "1.0.0",
      description: "API documentation for AmstaPay Authentication and User Management Service",
      contact: {
        name: "AmstaPay Support",
        email: "support@amstapay.com",
      },
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 3000}/api`, description: "Local development server" },
      { url: "https://api.amstapay.com", description: "Production server" },
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
            fullName: { type: "string", example: "John Doe" },
            email: { type: "string", example: "johndoe@example.com" },
            phoneNumber: { type: "string", example: "+2348012345678" },
            accountType: { type: "string", enum: ["personal", "business", "enterprise", "company", "agent"] },
            isVerified: { type: "boolean", example: false },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login successful" },
            token: { type: "string", example: "jwt-token-here" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Error message here" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication & User Management" },
      { name: "Users", description: "User profile and management endpoints" },
    ],
    security: [
      { bearerAuth: [] } // global security for endpoints that require JWT
    ],
  },
  apis: ["./src/routes/*.js"], // scan route files for JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app) {
  // Serve Swagger UI at /docs
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Optionally, serve raw JSON spec at /docs.json
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}

module.exports = swaggerDocs;
