# Zyra — Design System & Build Spec (Full)

## TL;DR (one-line)

Build a polished, light-only, flat-design DAO treasury & voting front end (Zyra) using **React (Vite) + Tailwind CSS + Framer Motion**, backend with **Node/Express + MongoDB**, smart contracts with **Hardhat + Solidity**; single-brand monochrome-blue palette, minimal accents, unified typography (Sora + Manrope), no gradients, maximum clarity & UX polish.

---

## Tech stack (exact)

* Frontend: React (Vite) + TypeScript (recommended)
* Styling: Tailwind CSS (custom `tailwind.config.js`)
* Animations: Framer Motion (for React) + CSS transitions for small micro-interactions
* State management: React Query + Zustand (or Redux Toolkit if you prefer)
* Charts: Recharts or Chart.js / Visx (animated entrance)
* Backend: Node.js + Express + TypeScript + Mongoose + MongoDB Atlas (or local)
* Auth/wallet: Ethers.js + MetaMask / WalletConnect (for commit-reveal txs)
* Smart contracts: Solidity, Hardhat, ethers.js (tests with mocha/chai)
* CI/CD & Hosting: Vercel (frontend), Render/ Railway / Fly / Heroku (backend), Hardhat to testnets (Sepolia/Goerli or recommended testnet)
* Linting/Formatting: ESLint + Prettier + Husky (pre-commit)
* Optional: Docker for reproducible dev env

---

## Project scaffold commands (quick start)

(Assumes Node v18+ installed)

```bash
# Frontend (Vite + React + TS + Tailwind)
npm create vite@latest zyra-frontend -- --template react-ts
cd zyra-frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm i framer-motion react-query zustand ethers axios recharts

# Backend (Node + TS)
cd ..
mkdir zyra-backend
cd zyra-backend
npm init -y
npm i express mongoose dotenv cors ethers
npm i -D typescript ts-node-dev @types/express @types/node eslint prettier
npx tsc --init

# Smart contracts (Hardhat)
cd ..
mkdir zyra-contracts
cd zyra-contracts
npm init -y
npm i -D hardhat @nomicfoundation/hardhat-toolbox ethers
npx hardhat
```

---

## Design Tokens (color + typography) — add to README and `tailwind.config.js`

### Brand-blue palette (no gradients — solid colors only)

Use these hexes (monochrome-blue hierarchy). Put them in `theme.extend.colors` (or rename to `brandBlue`).

```js
// tailwind.config.js (excerpt)
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brandBlue: {
          50:  '#EAF4FF',
          100: '#D7ECFF',
          300: '#8FBFFF',
          500: '#1E6FFF', // base brand blue (use for primary CTAs)
          700: '#114AB0',
          900: '#062B66'
        },
        neutral: {
          50: '#FFFFFF',
          100: '#F7F9FB',
          300: '#E6E9EE',
          500: '#9AA5B1',
          700: '#475569',
          900: '#0F1724'
        },
        success: '#16A34A',
        danger: '#DC2626'
      },
      borderRadius: {
        base: '10px',
        lg: '14px'
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'system-ui', 'sans-serif']
      }
    }
  }
}
```

> Why this palette? it stays within a single hue for brand unity, uses lighter tints for surfaces and stronger shades for text/borders/accents. No gradients — purely solid color tokens.

### Import fonts in `index.css` or HTML

```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Manrope:wght@300;400;600;800&display=swap');

:root {
  --brand-500: #1E6FFF;
  --neutral-100: #F7F9FB;
}
```

---

## Layout & Spacing rules

* Base spacing unit = **8px** (Tailwind `space-2` = 8px, `space-4` = 16px)
* Grid: 12-column CSS grid for desktop; single column mobile → Tailwind's `grid-cols-12` with `col-span-*` utility.
* Container widths: `max-w-[1200px]` for main center container; smaller pages `max-w-[900px]`.
* Sidebar: **Gigantic** default width = **300px**; collapsed rail = 80px. Use subtle background (`neutral-100`), not a gradient.
* Border radius: use `rounded-base` (10px) for panels, `rounded-lg` for cards.
* Shadows: use single, subtle shadow `shadow-md` (no heavy, multi-layer soft blur).

---

## Component Library (must-have components & variants)

Create a `ui/` component folder and document each in the design README.

1. **Button**
   * Variants: `primary`, `secondary`, `ghost`, `danger`
   * States: `default`, `hover` (scale 1.03), `active` (scale 0.98), `focus` (outline ring `brandBlue-300`)
   * Example classes (Tailwind):
     ```jsx
     <button className="bg-brandBlue-500 hover:bg-brandBlue-700 text-white px-5 py-2 rounded-base shadow-sm focus:outline-none focus:ring-4 focus:ring-brandBlue-100">
       Primary
     </button>
     ```

2. **Input / Form**
   * Floating label pattern; bottom-border highlight on focus (`focus:border-brandBlue-500`).
   * Validation: green check micro-icon, red shake animation on error.

3. **Card**
   * `p-4 rounded-lg bg-white shadow-md`
   * Optional header area with small action icons (ellipses / kebab menu).

4. **Sidebar (unique design)**
   * Wide mode (300px): avatar, profile block, grouped nav, bottom sticky CTA (New Goal).
   * Collapsed mode (80px): only icons; hover tooltip shows label.
   * Animations: width transition 300ms, submenu stagger 50ms.

5. **Topbar / Navbar**
   * Search input, notification bell (with badge), user quick actions.
   * Sticky with blur backdrop (use subtle `backdrop-filter: blur(4px)` for elegance — still flat).

6. **Modals**
   * Slide up for mobile; slide right for desktop (directional).
   * Backdrop: `bg-white/40` with `backdrop-blur-sm`.

7. **Charts & Data Widgets**
   * Animated bar/line charts that draw in on mount.
   * Counters that animate to value on appear.

8. **Toasts & Alerts**
   * Toasts slide from top-right; clear success (green) and error (red) styles.

9. **Loading / Skeletons**
   * Use skeletons (neutral-300 pulse) while data loads; branded spinner for global load that subtly uses brandBlue-500.

---

## UI Flow (user journeys & wireframes — textual)

Make these pages/components first (MVP flow prioritized):

1. **Landing / Auth**
   * CTA: Connect Wallet (MetaMask) or Sign in (email for off-chain features).
   * Motion: hero CTA micro-bounce, "Why Zyra" short copy.

2. **Dashboard (Home)**
   * Left: Gigantic sidebar (nav)
   * Center: Portfolio summary (cards showing treasury balance, proposal queue)
   * Right: Quick activity feed + wallet address summary
   * Interaction: clicking a card opens detail modal or navigates to page.

3. **Proposals List**
   * Search & filter (status: Open/Closed, category)
   * Each row: title, amount requested, status pill, vote progress bar (animated)
   * Click -> Proposal detail.

4. **Proposal Detail**
   * Hero header: title, author, requested amount, timeline
   * AI summary panel (Summarize / simulate impact)
   * Commit/Reveal voting widget (commit button -> show commit tx hash; reveal phase triggers reveal UI)
   * Discussion / comments (off-chain).

5. **Create Proposal**
   * Form with validation, preview card, and "Generate TL;DR with AI" button.

6. **Treasury Manager**
   * Visual allocations (animated bars), scheduled disbursements, approvals
   * Button: "Simulate Allocation" -> opens modal showing projected balances.

7. **Admin / Settings**
   * Manage voters, whitelist addresses, KYC status (if needed), contract deploy links.

---

## Voting UX specifics (commit/reveal)

* **Phase 1 — Commit**: user selects vote (Yes/No), client generates `keccak256(vote + salt)`, sends commit tx calling contract `commitVote(proposalId, commitHash)`; show pending tx UI.
* **Phase 2 — Reveal**: after commit period expires, user reveals with `revealVote(proposalId, vote, salt)`.
* UI will accept pre-signed commit files to allow offline commit and later reveal (helpful for wallets).
* Disallow reveal replays; clear UX flow with countdown timers (use `react-countdown`).

---

## Animations & Motion (Framer Motion setup)

* Install: `npm i framer-motion`
* Use **page transitions**, **staggered reveals**, **hero animation**, and **microinteractions**.
* Examples:
  * Page transition variant:
    ```tsx
    const pageVariants = {
      initial: { opacity: 0, x: 40 },
      enter: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
      exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
    };
    <motion.div initial="initial" animate="enter" exit="exit" variants={pageVariants}>...</motion.div>
    ```
  * Button micro: scale on hover. Use CSS for tiny buttons, Framer Motion for global sequences.
* Respect reduced-motion: use `const prefersReducedMotion = useReducedMotion()` and disable heavy animations if true.

---

## Accessibility (must-do list)

* Semantic HTML for all interactive items.
* All clickable elements keyboard-focusable and have visible `focus` rings.
* Color contrast: text vs background >= 4.5:1. Test with contrast tools.
* Add `aria-live` for dynamic content and toasts.
* Respect `prefers-reduced-motion`.
* Provide alt text for images/illustrations and ARIA labels for icons.

---

## Demo script (2.5–4 minutes)

1. 15s — Problem statement & Zyra in one sentence.
2. 20s — UI tour (sidebar, dashboard).
3. 40s — Create proposal + "AI summarize" (show TL;DR).
4. 30s — Commit a vote using wallet (show tx confirmed).
5. 30s — Reveal vote, show result and animated treasury simulation.
6. 20s — Show admin actions (whitelist or simulate allocation).
7. 15s — Closing: why Zyra is unique (privacy + AI + polished UX).

---

## Deliverables checklist (for submission)

* [x] Public GitHub repo with `README` and `DESIGN-SPEC.md`
* [ ] Deployed frontend link + backend API URL (if required)
* [ ] Contract addresses and ABI + Hardhat deploy script
* [ ] Demo video (3–5 minutes)
* [ ] Short pitch doc (one page) describing novelty (privacy + AI + treasury link)
* [ ] Accessibility & automated test evidence (screenshots / CI logs)

---

## Final notes & tips to win judges

* **Polish UI**: the design system gives you big visual returns — consistent spacing, crisp typography, and smooth micro-interactions impress judges quickly.
* **Realistic privacy**: commit-reveal is simple and powerful — implement it well and document why it's a practical privacy step.
* **AI features**: even simple TL;DR and a deterministic treasury projection are enough; make it fast and explainable (avoid flaky model outputs).
* **Demo discipline**: rehearse the demo flow until it's smooth; judges notice confident demos.
