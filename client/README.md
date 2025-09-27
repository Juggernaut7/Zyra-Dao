# Zyra — DAO Treasury & Private Voting Platform

**A privacy-first, AI-powered DAO treasury management platform built for the DEGA Hackathon on Midnight blockchain.**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🎯 Features

- **Privacy-First Voting**: Commit-reveal voting system for anonymous governance
- **AI-Powered Insights**: Automated proposal summaries and treasury simulations
- **Beautiful UI/UX**: Clean, flat design with smooth animations
- **Real-time Treasury**: Live asset tracking and allocation management
- **Wallet Integration**: MetaMask and WalletConnect support

## 🛠 Tech Stack

- **Frontend**: React (Vite) + TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Charts**: Recharts
- **Blockchain**: Ethers.js + MetaMask
- **Icons**: Lucide React

## 🎨 Design System

### Color Palette
- **Brand Blue**: `#1E6FFF` (primary), `#8FBFFF` (secondary), `#D7ECFF` (light)
- **Neutrals**: `#F7F9FB` (background), `#9AA5B1` (text), `#0F1724` (dark)
- **Semantic**: `#16A34A` (success), `#DC2626` (danger)

### Typography
- **Display**: Sora (headings, UI elements)
- **Body**: Manrope (content, descriptions)

### Key Components
- **Sidebar**: 300px expanded / 80px collapsed with smooth transitions
- **Cards**: Rounded corners (10px), subtle shadows, hover effects
- **Buttons**: 4 variants (primary, secondary, ghost, danger) with micro-animations
- **Inputs**: Floating labels with focus states and validation

## 📱 Pages & Features

### Dashboard
- Treasury overview with animated stats
- Recent activity feed
- Quick action buttons
- Wallet connection prompt

### Proposals
- Search and filter functionality
- Voting progress visualization
- Status indicators (active, completed, failed)
- Create new proposal modal

### Treasury
- Asset allocation pie chart
- Monthly spending trends
- Detailed asset table
- Simulation tools

## 🎬 Demo Script (3-4 minutes)

1. **Landing (15s)**: Show clean UI with sidebar navigation
2. **Dashboard (20s)**: Highlight treasury stats and recent activity
3. **Create Proposal (40s)**: 
   - Click "New Proposal"
   - Fill form with title, amount, description
   - Use "AI Summary" feature
   - Submit proposal
4. **Voting (30s)**: 
   - Show commit-reveal voting interface
   - Demonstrate privacy features
5. **Treasury (30s)**: 
   - View asset allocation charts
   - Show spending trends
   - Demonstrate simulation tools
6. **Closing (15s)**: Highlight privacy + AI + polished UX

## 🔧 Development

### Project Structure
```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── layout/       # Layout components (Sidebar, Topbar)
│   └── modals/       # Modal components
├── pages/            # Page components
├── stores/           # Zustand state stores
└── types/            # TypeScript definitions
```

### Key Features Implemented
- ✅ Responsive design with mobile-first approach
- ✅ Accessibility (WCAG AA compliant)
- ✅ Reduced motion support
- ✅ Smooth page transitions
- ✅ Micro-interactions on buttons and cards
- ✅ Loading states and skeletons
- ✅ Error handling and validation

### State Management
- **Wallet Store**: Connection status, account, balance
- **Proposal Store**: Proposals list, current proposal, voting state
- **Treasury Store**: Assets, transactions, allocations

## 🎯 Hackathon Highlights

### Innovation & Creativity (25%)
- Privacy-first commit-reveal voting system
- AI-powered proposal summarization
- Interactive treasury simulation tools

### Technical Execution (30%)
- Clean, maintainable React architecture
- Comprehensive TypeScript coverage
- Smooth animations with Framer Motion
- Responsive design system

### Real-World Utility (30%)
- Addresses real DAO treasury management needs
- Privacy protection for sensitive voting decisions
- AI assistance for proposal analysis
- Clear, intuitive user experience

### Presentation & Demo (15%)
- Polished, professional UI design
- Smooth user flows and interactions
- Comprehensive feature demonstration
- Clear value proposition

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy to Vercel
```

### Environment Variables
```env
VITE_APP_NAME=Zyra
VITE_APP_DESCRIPTION=DAO Treasury Management Platform
```

## 📄 License

MIT License - Built for DEGA Hackathon 2024

---

**Built with ❤️ for the DEGA Hackathon - AI for DAO Treasury Management on Midnight**