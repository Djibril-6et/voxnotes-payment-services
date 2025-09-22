# 💳 Payment Service

Stripe-powered microservice handling secure payment processing, subscription management, and billing operations for the voice transcription platform.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Payment Provider:** Stripe
- **HTTP Client:** Axios (for database integration)
- **Development:** Nodemon for auto-restart

## 🌟 Features

- **One-time Payments:** Single payment checkout sessions
- **Subscription Management:** Monthly recurring payments
- **Secure Processing:** PCI-compliant payment handling via Stripe
- **Database Integration:** Automatic payment record creation
- **Session Management:** Complete checkout session lifecycle
- **Payment Details:** Retrieve payment and subscription information
- **Subscription Cancellation:** Cancel subscriptions with database sync
- **Error Handling:** Comprehensive error management with rollback

## 📋 Prerequisites

- Node.js (v14 or higher)
- Stripe account with API keys
- Database service running on port 9090
- Frontend application running on port 9010

## ⚙️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/Djibril-6et/voxnotes-payment-services.git
cd voxnotes-payment-services
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
STRIPE_PRIVATE_KEY=your_stripe_secret_key_here
BDD_URL=http://localhost:9090
CLIENT_URL=http://localhost:9010
PORT=9030
```

## 🤝 Integration with Other Services

This service integrates with:
- **Database Service (9090):** Subscription management
- **[Frontend Application](https://github.com/Djibril-6et/voxnotes):** User interface and redirects to port 9010
- **Stripe API:** Payment processing
- **OAuth Service:** User authentication (indirectly via userId)

## 🚀 Running the Service

### Development Mode
```bash
npm start
```

The service will be available at `http://localhost:9030`

## 📡 API Endpoints

### Payment Processing
```
POST   /create-checkout-session/:subject    - Create one-time payment session
POST   /create-subscription/:subject        - Create subscription payment session
POST   /cancel-subscription                 - Cancel active subscription
```

### Payment Information
```
POST   /get-payment-details                 - Get payment intent details
POST   /get-subscription-details            - Get subscription details  
POST   /get-session-details                 - Get checkout session details
```

## 💰 API Usage

### Create One-Time Payment

**Endpoint:** `POST /create-checkout-session/:subject`

**Parameters:**
- `subject`: Payment description (URL parameter)

**Body:**
```json
{
  "price": 2999,
  "userId": "user_id_here"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### Create Subscription

**Endpoint:** `POST /create-subscription/:subject`

**Parameters:**
- `subject`: Subscription plan name (URL parameter)

**Body:**
```json
{
  "price": 999,
  "userId": "user_id_here"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### Cancel Subscription

**Endpoint:** `POST /cancel-subscription`

**Body:**
```json
{
  "stripeSessionId": "cs_test_session_id_here"
}
```

**Response:**
```json
{
  "message": "Subscription deleted successfully from the database."
}
```

### Get Payment Details

**Endpoint:** `POST /get-payment-details`

**Body:**
```json
{
  "sessionId": "cs_test_session_id_here"
}
```

**Response:**
```json
{
  "paymentIntent": {
    "id": "pi_...",
    "amount": 2999,
    "currency": "eur",
    "status": "succeeded"
  }
}
```

### Get Subscription Details

**Endpoint:** `POST /get-subscription-details`

**Body:**
```json
{
  "sessionId": "cs_test_session_id_here"
}
```

**Response:**
```json
{
  "subscription": {
    "id": "sub_...",
    "status": "active",
    "current_period_end": 1234567890
  }
}
```

### Get Session Details

**Endpoint:** `POST /get-session-details`

**Body:**
```json
{
  "sessionId": "cs_test_session_id_here"
}
```

**Response:**
```json
{
  "session": {
    "id": "cs_test_...",
    "payment_status": "paid",
    "customer_details": {...}
  }
}
```

## 💱 Currency & Pricing

- **Currency:** EUR (Euros)
- **Amount Format:** Cents (e.g., 2999 = €29.99)
- **Conversion:** Automatic conversion to euros for database storage

## 🔗 Database Integration

### Automatic Record Creation
Each successful payment/subscription creates a record in the database service:

**Payment Data Structure:**
```javascript
{
  userId: String,
  stripeSessionId: String,
  paymentMethod: 'Stripe',
  amountPaid: Number, // in euros
  status: 'active'
}
```

### Database Endpoints Used
- `POST /api/subscriptions` - Create subscription record
- `DELETE /api/subscriptions/:stripeSessionId` - Delete subscription record

### Error Handling & Rollback
If database creation fails, the Stripe session is automatically expired to prevent orphaned payments.

## 🔒 Security Features

- **PCI Compliance:** All payment data handled by Stripe
- **API Key Security:** Private key stored in environment variables
- **Session Expiration:** Failed sessions automatically expired
- **CORS Protection:** Cross-origin request handling
- **Input Validation:** Required field validation
- **Error Isolation:** No sensitive data in error responses

## 📁 Project Structure

```
payment-service/
├── server.js           # Main server file with all endpoints
├── package.json        # Dependencies and scripts
└── .env               # Environment variables
```

## 🔧 Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `STRIPE_PRIVATE_KEY` | Stripe secret API key | Yes | `sk_test_...` |
| `BDD_URL` | Database service URL | Yes | `http://localhost:9090` |
| `CLIENT_URL` | Frontend application URL | Yes | `http://localhost:9010` |
| `PORT` | Server port | No | `9030` |

## 🎯 Stripe Configuration

### Success/Cancel URLs
- **Success:** `{CLIENT_URL}/profile?session_id={CHECKOUT_SESSION_ID}`
- **Cancel:** `{CLIENT_URL}/souscription`

### Payment Methods
- **Supported:** Credit/Debit Cards via Stripe Checkout
- **Mode:** 
  - `payment` for one-time payments
  - `subscription` for recurring payments

### Subscription Settings
- **Interval:** Monthly recurring
- **Currency:** EUR
- **Automatic Collection:** Enabled

## 🐳 Docker Support

### Dockerfile
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 9030
CMD ["npm", "start"]
```

### Docker Compose Integration
```yaml
version: '3.8'
services:
  payment-service:
    build: .
    ports:
      - "9030:9030"
    environment:
      - STRIPE_PRIVATE_KEY=${STRIPE_PRIVATE_KEY}
      - BDD_URL=http://database-service:9090
      - CLIENT_URL=http://localhost:9010
      - PORT=9030
    depends_on:
      - database-service
```

## 🚨 Error Handling

### Common Error Responses

**Missing User ID**
```json
{
  "error": "User ID is required"
}
```

**Database Creation Failure**
```json
{
  "error": "Échec de la création du paiement dans la base de données. Paiement annulé."
}
```

**Stripe API Error**
```json
{
  "error": "Stripe error message here"
}
```

**Missing Session ID**
```json
{
  "error": "Stripe Session ID is required"
}
```

### Rollback Mechanism
When database operations fail:
1. Stripe session is automatically expired
2. User is redirected to error state
3. Detailed error logging for debugging
4. No orphaned payment sessions

## 🔄 Payment Flow

### One-Time Payment Flow
1. **Create Session** → User initiates payment
2. **Stripe Checkout** → User completes payment on Stripe
3. **Database Record** → Payment saved to database
4. **Success Redirect** → User redirected with session ID

### Subscription Flow
1. **Create Product** → Stripe product created
2. **Create Price** → Monthly price created
3. **Create Session** → Subscription checkout session
4. **Database Record** → Subscription saved to database
5. **Success Redirect** → User redirected with session ID

### Cancellation Flow
1. **Retrieve Session** → Get subscription ID from session
2. **Cancel Stripe** → Cancel subscription on Stripe
3. **Delete Database** → Remove subscription record
4. **Confirm Success** → Return success response

## 🧪 Testing

### Manual Testing
```bash
# Test one-time payment creation
curl -X POST http://localhost:9030/create-checkout-session/Test%20Payment \
  -H "Content-Type: application/json" \
  -d '{"price": 2999, "userId": "test_user_123"}'

# Test subscription creation  
curl -X POST http://localhost:9030/create-subscription/Monthly%20Plan \
  -H "Content-Type: application/json" \
  -d '{"price": 999, "userId": "test_user_123"}'
```

### Integration Testing
Verify database integration by checking that payment records are created after successful Stripe sessions.

## 📊 Monitoring & Logging

The service logs:
- Payment session creation attempts
- Database integration success/failures
- Stripe API responses and errors
- Session expiration events
- Subscription cancellation events

## 🚀 Production Considerations

### Security
- Use production Stripe keys
- Implement webhook verification for payment confirmations
- Add rate limiting to prevent abuse
- Use HTTPS for all communications

### Scalability
- Consider caching frequently accessed session data
- Implement request queuing for high volume
- Add monitoring and alerting
- Consider webhook processing for real-time updates

### Compliance
- Ensure PCI DSS compliance (handled by Stripe)
- Implement proper data retention policies
- Add audit logging for financial transactions
- Consider GDPR compliance for EU customers

## 🔗 Integration with Other Services

This service integrates with:
- **Database Service (9090):** Subscription management
- **Frontend Application (9010):** User interface and redirects
- **Stripe API:** Payment processing
- **OAuth Service:** User authentication (indirectly via userId)

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.