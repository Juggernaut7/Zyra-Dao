# Environment Keys Setup for DEGA Hackathon

## 🔑 Required Keys

### 1. ElizaOS LLM Provider Key (Choose One)
- **OpenAI API Key** (Recommended)
  - **Variable**: `VITE_OPENAI_API_KEY`
  - **Where to get**: [OpenAI Platform](https://platform.openai.com/api-keys)
  - **Purpose**: AI agent coordination and insights
  - **Format**: `sk-proj-...`

- **Anthropic API Key** (Alternative)
  - **Variable**: `VITE_ANTHROPIC_API_KEY`
  - **Where to get**: [Anthropic Console](https://console.anthropic.com/)
  - **Purpose**: AI agent coordination and insights
  - **Format**: `sk-ant-...`

- **Hugging Face Token** (Alternative)
  - **Variable**: `VITE_HF_TOKEN`
  - **Where to get**: [Hugging Face Settings](https://huggingface.co/settings/tokens)
  - **Purpose**: AI agent coordination and insights
  - **Format**: `hf_...`

### 2. DEGA AI MCP (Midnight MCP)
- **No API Key Required** - Runs on localhost:3000
- **Setup**: Clone and run the Midnight MCP repository
- **Purpose**: AI-powered treasury analysis and recommendations

### 3. Communication MCP
- **No API Key Required** - Works over STDIO
- **Setup**: Configured in ElizaOS/agent MCP setup
- **Purpose**: Real-time DAO coordination and notifications

## 📁 Where to Put Keys

### Frontend (client/.env)
```env
# ElizaOS LLM Provider Keys (choose one)
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
# VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
# VITE_HF_TOKEN=hf_your-huggingface-token-here
```

### Backend (server/.env) - No additional keys needed
The backend doesn't need these keys since the integrations are frontend-only for the demo.

## 🚀 Quick Setup

1. **Create client/.env file**:
```bash
cd client
touch .env
```

2. **Add one LLM provider key**:
```env
# Choose one of these:
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
# OR
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
# OR
VITE_HF_TOKEN=hf_your-huggingface-token-here
```

3. **Get your API key** from:
   - **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - **Anthropic**: [console.anthropic.com](https://console.anthropic.com/)
   - **Hugging Face**: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

## 🔍 Where to Find Real Keys

### OpenAI API Key
- Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Sign up/login to OpenAI
- Create a new API key
- Copy the key (starts with `sk-proj-`)

### Anthropic API Key
- Go to [console.anthropic.com](https://console.anthropic.com/)
- Sign up/login to Anthropic
- Create a new API key
- Copy the key (starts with `sk-ant-`)

### Hugging Face Token
- Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- Sign up/login to Hugging Face
- Create a new token
- Copy the token (starts with `hf_`)

### Midnight MCP Setup
- Clone the repository: `git clone https://github.com/dega-ai/midnight-mcp`
- Install dependencies: `cd midnight-mcp && npm install`
- Start the server: `npm start` (runs on localhost:3000)

## ⚠️ Important Notes

1. **Frontend only**: These keys are for frontend integrations only
2. **Demo mode**: App works without keys for demo purposes
3. **Security**: Don't commit real keys to GitHub
4. **Restart required**: Restart frontend after adding keys
5. **Choose one**: Only one LLM provider key is needed

## 🎯 Demo Mode

The app works perfectly without API keys for demo purposes. The integrations will:
- Show as "enabled" in the UI
- Execute simulated operations
- Display mock data and responses
- Demonstrate all functionality
- Use local fallback for AI features

## 📞 Getting Help

If you need help:
1. Check hackathon Discord/Slack channels
2. Ask other participants
3. Contact hackathon organizers
4. Use demo mode (works perfectly for submission)

---

**The app works great without API keys for your hackathon demo! 🚀**

## 🎯 Summary

- **DEGA AI MCP**: No API key needed, runs on localhost:3000
- **Communication MCP**: No API key needed, works over STDIO
- **ElizaOS**: Only needs one LLM provider key (OpenAI, Anthropic, or Hugging Face)
- **Demo Mode**: Works perfectly without any keys for hackathon submission
