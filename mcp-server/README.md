# Zyra DAO Midnight MCP Server

This is the production MCP server for Zyra DAO's Midnight.js integration.

## 🚀 Deployment

### Option 1: Render (Recommended)
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Set environment variables in Render dashboard

### Option 2: Railway
1. Connect your GitHub repository to Railway
2. Railway will auto-detect Node.js
3. Set environment variables in Railway dashboard

### Option 3: Heroku
1. Create a new Heroku app
2. Connect to GitHub repository
3. Deploy from main branch
4. Set environment variables

## 🔧 Environment Variables

```bash
NODE_ENV=production
PORT=3000
```

## 📡 Endpoints

- `GET /` - Server info
- `GET /health` - Health check
- `POST /analyze-treasury` - AI treasury analysis
- `POST /execute-private-transaction` - Private transaction execution

## 🔗 Integration

Update your frontend API configuration to point to the deployed MCP server:

```typescript
// In client/src/services/degaMCP.ts
const config = {
  baseUrl: 'https://your-mcp-server.onrender.com', // Your deployed URL
  port: '', // Empty for production
  model: 'midnight-mcp-treasury'
};
```

## 🛠️ Local Development

```bash
cd mcp-server
npm install
npm run dev
```

## 📊 Monitoring

The server includes:
- Health check endpoint
- Request logging
- Error handling
- CORS configuration
