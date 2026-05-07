# AmstaPay Backend - Complete Feature Set

## 🚀 Core Features

### 1. **Authentication & Security**
- Email & Phone Number Registration
- JWT Token Authentication (Access + Refresh)
- OTP Verification via Email
- OTP Verification via SMS (Custom Microservice)
- OTP Verification via WhatsApp (Custom Microservice)
- Password Reset Flow
- PIN Change/Reset for Transactions
- Rate Limiting & DDoS Protection
- Helmet.js Security Headers

### 2. **Digital Wallet**
- Wallet Balance Management
- Transaction Ledger
- Multi-Currency Support (NGN, USD, EUR, GBP, etc.)
- Fund Wallet (Paystack Integration)
- Withdraw Funds

### 3. **Transactions**
- Local Money Transfers
- Transaction History
- Transaction Status Tracking
- Webhook Handling (Paystack)
- QR Code Payments
- Bill Payments (Airtime, Data)
- Merchant Payments
- Payment URL Processing

### 4. **Banking Services**
- Bank Account Balance Inquiry
- Bank-to-Bank Transfers
- Transaction PIN Management

### 5. **International Transfers** ✨ NEW
- Multi-Currency Support (USD, EUR, GBP, GHS, KES, ZAR)
- Real Exchange Rates
- Supported Countries List
- Multi-Channel OTP Verification (Email, SMS, WhatsApp)
- International Transfer Tracking
- Beneficiary Management

### 6. **Web3 Integration** ✨ NEW
- Crypto Wallet Generation (Ethereum-based)
- Support for ETH, USDT, USDC
- Deposit/Withdraw Crypto
- Convert Crypto to Fiat (NGN)
- Blockchain Transaction Tracking
- Wallet Balance Checking

### 7. **Real-Time Notifications** ✨ NEW
- Custom Notification Microservice
- Email Notifications
- SMS Notifications (Custom Provider)
- WhatsApp Notifications (Custom Provider)
- Transaction Status Updates
- WebSocket Ready (Socket.IO integrated)

### 8. **Additional Financial Services**
- Gift Card Management
- Loan Services
- Investment Options
- Bill Payments (Utilities, Subscriptions)
- Financial Reporting
- User Management & KYC

## 📚 API Endpoints

### Auth Routes (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Login with credentials |
| POST | `/verify` | Verify email with OTP |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password |
| POST | `/change-pin` | Change transaction PIN |
| POST | `/forgot-pin` | Request PIN reset |
| POST | `/verify-pin-reset-code` | Verify PIN reset code |
| POST | `/reset-pin` | Reset PIN |
| POST | `/upload-documents` | Upload documents for agent verification |

### User Routes (`/api/v1/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get current user's profile |
| PUT | `/me` | Update user profile |
| POST | `/change-password` | Change user password |
| POST | `/change-pin` | Change user PIN |
| POST | `/avatar` | Upload user profile image/avatar |
| POST | `/kyc-documents` | Upload KYC documents (ID, utility bill, passport photo) |
| DELETE | `/delete` | Delete user account (soft delete) |
| GET | `/` | Get all users with pagination and filtering (Admin only) |
| GET | `/:userId` | Get user by ID (Admin only) |

### Wallet Routes (`/api/v1/wallets`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/balance` | Get wallet balance |
| POST | `/fund` | Fund wallet |
| POST | `/withdraw` | Withdraw funds from wallet |

### Transaction Routes (`/api/v1/transactions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create new transaction |
| GET | `/` | Get user transactions |
| GET | `/:id` | Get transaction by ID |
| PATCH | `/:id/status` | Update transaction status |
| POST | `/webhook/paystack` | Paystack webhook |

### Banking Routes (`/api/v1/bank`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/balance` | Get bank account balance |
| POST | `/transfer` | Transfer money from bank account |

### Payment Routes (`/api/v1/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Send money via QR code |
| POST | `/receive` | Receive money via QR code |

### Giftcard Routes (`/api/v1/giftcards`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Purchase a gift card |
| GET | `/` | Get all available gift cards |

### Investment Routes (`/api/v1/investments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get investment options |
| POST | `/` | Create new investment |

### Loan Routes (`/api/v1/loans`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all loans with pagination |
| GET | `/:id` | Get loan by ID |
| POST | `/` | Apply for a loan |
| PUT | `/:id` | Update loan details |
| DELETE | `/:id` | Delete loan |

### Bill Payment Routes (`/api/v1/bills`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/airtime` | Buy airtime |
| POST | `/data` | Buy data plan |
| POST | `/electricity` | Pay electricity bill |
| POST | `/schoolfees` | Pay school fees |
| POST | `/transport` | Pay transport fare/booking |

### Report Routes (`/api/v1/reports`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get financial reports |
| GET | `/:id` | Get specific report |
| POST | `/` | Generate new report |

### Web3 Routes (`/api/v1/web3`) ✨
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/wallet` | Generate Web3 wallet |
| GET | `/balance` | Get wallet balance |
| POST | `/deposit` | Deposit crypto |
| POST | `/withdraw` | Withdraw crypto |
| POST | `/convert` | Convert crypto to fiat |

### Webhook Routes (`/api/v1/webhook`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | General webhook handler |

### Verification Routes (`/api/v1/verification`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Verify user |

### International Routes (`/api/v1/international`) ✨
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/transfer` | Initiate international transfer |
| GET | `/rates` | Get exchange rates |
| GET | `/countries` | Get supported countries |
| POST | `/send-otp` | Send OTP for verification |
| POST | `/verify-otp` | Verify OTP |

### Investment Routes (`/api/v1/investments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get investment options |
| POST | `/` | Create new investment |

### Loan Routes (`/api/v1/loans`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all loans with pagination |
| GET | `/:id` | Get loan by ID |
| POST | `/` | Apply for a loan |
| PUT | `/:id` | Update loan details |
| DELETE | `/:id` | Delete loan |

### Bill Payment Routes (`/api/v1/bills`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/airtime` | Buy airtime |
| POST | `/data` | Buy data plan |
| POST | `/electricity` | Pay electricity bill |
| POST | `/schoolfees` | Pay school fees |
| POST | `/transport` | Pay transport fare/booking |

### Report Routes (`/api/v1/reports`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get financial reports |
| GET | `/:id` | Get specific report |
| POST | `/` | Generate new report |

### Web3 Routes (`/api/v1/web3`) ✨
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/wallet` | Generate Web3 wallet |
| GET | `/balance` | Get wallet balance |
| POST | `/deposit` | Deposit crypto |
| POST | `/withdraw` | Withdraw crypto |
| POST | `/convert` | Convert crypto to fiat |

### Webhook Routes (`/api/v1/webhook`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | General webhook handler |

### Verification Routes (`/api/v1/verification`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Verify user |

## 🌍 International Transfer Flow

1. **Get Exchange Rates**: `GET /api/v1/international/rates`
2. **Get Supported Countries**: `GET /api/v1/international/countries`
3. **Send OTP**: `POST /api/v1/international/send-otp` (sends to email, SMS, WhatsApp)
4. **Verify OTP**: `POST /api/v1/international/verify-otp`
5. **Initiate Transfer**: `POST /api/v1/international/transfer`

## 🔗 Web3 Crypto Flow

1. **Generate Wallet**: `POST /api/v1/web3/wallet`
2. **Deposit Crypto**: `POST /api/v1/web3/deposit`
3. **Check Balance**: `GET /api/v1/web3/balance?token=USDT`
4. **Convert to Fiat**: `POST /api/v1/web3/convert`
5. **Withdraw**: `POST /api/v1/web3/withdraw`

## 📋 Environment Variables Required

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/amstapay

# JWT
JWT_SECRET=your-secret-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS (Custom Provider)
SMS_GATEWAY_URL=https://your-sms-gateway.com/api/send
SMS_API_KEY=your-sms-api-key

# WhatsApp (Custom Provider)
WHATSAPP_GATEWAY_URL=https://your-whatsapp-gateway.com/api/send
WHATSAPP_API_KEY=your-whatsapp-api-key

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxx

# Web3
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your-id

# Redis (for Socket.IO)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 📖 Swagger Documentation

Access the complete API documentation at:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **JSON Spec**: `http://localhost:3000/api-docs.json`

## 🔧 Installation Steps

1. Clone repository
2. `pnpm install`
3. Copy `.env.example` to `.env`
4. Configure environment variables
5. `pnpm run dev`
6. Visit `http://localhost:3000/api-docs` for documentation

## 🔧 Custom Notification Microservice

The custom notification service (`src/services/customNotificationService.js`) provides:

- **Queue-based processing** for reliable delivery
- **Multi-channel support**: Email, SMS, WhatsApp
- **Easy provider integration**: Simply update the `sendSMSNotification` and `sendWhatsAppNotification` functions
- **Retry mechanism**: Failed notifications are retried up to 3 times
- **WebSocket ready**: Socket.IO integration for real-time updates

### Adding a Real SMS Provider

Replace the `sendSMSNotification` function with your provider's API:

```javascript
const sendSMSNotification = async (notification) => {
  await fetch('https://your-sms-provider.com/api/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.SMS_API_KEY}` },
    body: JSON.stringify({ phone: notification.to, message: notification.message })
  });
};
```

### Adding WhatsApp Support

Update the `sendWhatsAppNotification` function:

```javascript
const sendWhatsAppNotification = async (notification) => {
  await fetch('https://api.provider.com/whatsapp/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}` },
    body: JSON.stringify({ to: notification.to, text: notification.message })
  });
};
```

## 🎯 Summary of Setup Complete

✅ **Authentication & Security**
- Email & phone registration with JWT authentication
- OTP verification via Email, SMS, and WhatsApp
- Password & PIN reset flows
- Rate limiting & security headers

✅ **Digital Wallet & Banking**
- Wallet balance management & multi-currency support
- Bank account integration (balance inquiry, transfers)
- Fund wallet via Paystack integration

✅ **Transactions & Payments**
- Local money transfers with status tracking
- QR code payments (send/receive)
- Bill payments (airtime, data, electricity, school fees, transport)
- Merchant payments & payment URL processing
- Transaction history & analytics

✅ **International Transfers** ✨ NEW
- Multi-currency support (USD, EUR, GBP, GHS, KES, ZAR)
- Real-time exchange rates
- Supported countries list with SWIFT codes
- Multi-channel OTP verification (Email, SMS, WhatsApp)
- International transfer tracking & beneficiary management

✅ **Web3/Crypto Integration** ✨ NEW
- Crypto wallet generation (Ethereum-based)
- ETH, USDT, USDC support
- Crypto deposit/withdrawal
- Crypto-to-fiat conversion (NGN)
- Blockchain transaction tracking
- Wallet balance monitoring

✅ **Financial Services**
- Gift card management (purchase, listing)
- Loan services (application, management)
- Investment options
- Financial reporting

✅ **User Management & KYC**
- Profile management (update, avatar upload)
- KYC document upload (ID, utility bill, passport photo)
- Account verification levels
- Administrative user management

✅ **Real-Time Notifications** ✨ NEW
- Custom notification microservice with queue-based processing
- Multi-channel support (Email, SMS, WhatsApp)
- Retry mechanism for failed notifications
- WebSocket-ready for real-time updates
- Transaction status alerts

✅ **API Documentation**
- Complete OpenAPI 3.0 specification
- Interactive Swagger UI at /api-docs
- JSON specification endpoint
- All endpoints fully documented

✅ **Technical Infrastructure**
- Environment-based configuration
- MongoDB integration with Mongoose
- Secure password/PIN hashing
- Dependency management (removed Twilio/Vonage)
- Updated dependencies (ethers.js, socket.io)