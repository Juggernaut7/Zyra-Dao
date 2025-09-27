# AI Service Setup

## Environment Variable Configuration

To use the real AI features with Hugging Face + DeepSeek, create a `.env` file in the `client` directory:

```bash
# Create .env file
echo "REACT_APP_HF_TOKEN=your-huggingface-token-here" > .env
```

Or manually create a `.env` file with:
```
REACT_APP_HF_TOKEN=your-huggingface-token-here
```

## How it works:

1. **With API Key**: Uses real DeepSeek AI for proposal analysis and treasury insights
2. **Without API Key**: Uses intelligent mock responses for demo purposes
3. **Fallback**: Always works, even without API key

## Features:

- ✅ **Proposal Summarization**: AI analyzes proposal text and provides structured summary
- ✅ **Treasury Simulation**: AI generates conservative/moderate/aggressive scenarios  
- ✅ **Risk Assessment**: AI evaluates and categorizes risk levels
- ✅ **Confidence Scoring**: AI provides confidence percentages
- ✅ **Mock Fallback**: Intelligent demo responses when no API key

## Testing:

1. Open browser console to see AI service status
2. Try "Generate Summary" on any proposal
3. Try "Simulate" on Treasury page
4. Check console for "AI Service: Hugging Face token found" message
