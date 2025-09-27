# Zyra DAO Backend

A robust Node.js backend for the Zyra DAO platform, featuring commit-reveal voting, treasury management, and AI integration.

## 🚀 Features

- **Authentication**: Wallet signature verification with JWT tokens
- **Proposals**: Create, manage, and track DAO proposals
- **Voting**: Commit-reveal voting mechanism with privacy protection
- **Treasury**: Multi-signature treasury management with transaction tracking
- **AI Integration**: Hugging Face AI for proposal summarization and treasury insights
- **Blockchain Integration**: Ethereum/Sepolia support with ethers.js
- **Security**: Rate limiting, input validation, and comprehensive error handling
- **Smart Contracts**: Solidity contracts for voting and treasury management

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account or local MongoDB
- Ethereum wallet (MetaMask)
- Hugging Face API token (optional, for AI features)

## 🛠️ Installation

### 1. Clone and Setup

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy the environment template and configure:

```bash
cp env.example .env
```

Update `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (Get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zyra-dao

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d

# Blockchain Configuration
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_for_contract_interactions
CONTRACT_ADDRESS=0x...

# AI Service (Optional)
HF_TOKEN=hf_your_hugging_face_token

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### 3. Database Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

### 4. Blockchain Setup (Optional)

1. Get an Infura API key
2. Create a wallet for contract interactions
3. Update `RPC_URL` and `PRIVATE_KEY` in `.env`
4. Deploy smart contracts (see Smart Contracts section)

## 🚀 Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

```bash
POST /api/auth/authenticate     # Authenticate with wallet signature
GET  /api/auth/profile          # Get user profile
PUT  /api/auth/profile          # Update user profile
POST /api/auth/verify-signature # Verify wallet signature
```

### Proposal Endpoints

```bash
GET    /api/proposals           # Get all proposals
POST   /api/proposals           # Create new proposal
GET    /api/proposals/:id       # Get proposal details
PUT    /api/proposals/:id/status # Update proposal status (admin)
GET    /api/proposals/:id/ai-summary # Get AI summary
GET    /api/proposals/user/my-proposals # Get user's proposals
DELETE /api/proposals/:id       # Delete proposal
```

### Voting Endpoints

```bash
POST /api/voting/commit         # Commit a vote
POST /api/voting/reveal         # Reveal a vote
GET  /api/voting/proposal/:id/status # Get voting status
GET  /api/voting/proposal/:id/my-vote # Get user's vote
POST /api/voting/generate-commit-hash # Generate commit hash
```

### Treasury Endpoints

```bash
GET  /api/treasury/balance      # Get treasury balance
GET  /api/treasury/transactions # Get transactions
POST /api/treasury/transactions # Create transaction (admin)
PUT  /api/treasury/transactions/:id # Update transaction (admin)
GET  /api/treasury/ai-insights  # Get AI treasury insights
GET  /api/treasury/analytics    # Get treasury analytics
GET  /api/treasury/network-info # Get blockchain network info
```

## 🔧 Smart Contracts

### Setup

```bash
cd contracts
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

### Deploy Locally

```bash
npm run node    # Start local blockchain
npm run deploy:local
```

### Contract Addresses

- **CommitRevealVoting**: Manages proposal voting with privacy protection
- **TreasuryVault**: Multi-signature treasury management

## 🔐 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **Wallet Verification**: Cryptographic signature verification
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security**: Security headers and protection
- **Error Handling**: Comprehensive error logging and handling

## 📊 Database Models

### User
- Wallet address, username, email
- Role (member, admin, moderator)
- Reputation score and verification status

### Proposal
- Title, description, category
- Amount requested and treasury action
- Voting phases and timestamps
- Vote counts and status

### Vote
- Commit hash and revealed vote
- Voter address and proposal reference
- Salt for commit-reveal verification

### TreasuryTransaction
- Transaction type and amount
- From/to addresses and description
- Status and blockchain references

## 🤖 AI Integration

The backend integrates with Hugging Face's DeepSeek model for:

- **Proposal Summarization**: Automatic TL;DR generation
- **Treasury Insights**: Investment scenario analysis
- **Risk Assessment**: Proposal risk evaluation

Configure with your Hugging Face token in the `.env` file.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Docker

```bash
docker build -t zyra-backend .
docker run -p 5000:5000 --env-file .env zyra-backend
```

### Manual Deployment

1. Set up a VPS (DigitalOcean, AWS, etc.)
2. Install Node.js and MongoDB
3. Clone repository and install dependencies
4. Configure environment variables
5. Build and start the application

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage

# Run specific test file
npm test -- --grep "Proposal"
```

## 📝 API Examples

### Authenticate User

```bash
curl -X POST http://localhost:5000/api/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Sign this message to authenticate",
    "signature": "0x...",
    "address": "0x..."
  }'
```

### Create Proposal

```bash
curl -X POST http://localhost:5000/api/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Community Grant Proposal",
    "description": "Requesting 1000 USDC for community development",
    "amountRequested": 1000,
    "category": "grants",
    "commitEndTime": "2024-01-15T00:00:00Z",
    "revealEndTime": "2024-01-17T00:00:00Z"
  }'
```

### Commit Vote

```bash
curl -X POST http://localhost:5000/api/voting/commit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "proposalId": "64f1234567890abcdef12345",
    "commitHash": "0x..."
  }'
```

## 🔍 Monitoring

The application includes comprehensive logging with Winston:

- **Error Logs**: `logs/error.log`
- **Combined Logs**: `logs/combined.log`
- **Console Output**: Development mode

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: README files
- **Community**: Discord/Telegram

## 🔄 Updates

- **v1.0.0**: Initial release with core features
- **v1.1.0**: AI integration and enhanced security
- **v1.2.0**: Smart contract deployment and testing

---

**Built with ❤️ for the Zyra DAO community**
