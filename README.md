# CelebrateAI - GenAI-Powered Celebration & Event Planner

> **PromptWars Virtual Hackathon — [Challenge 5] Celebration & Event Planner**  
> *Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Gemini AI](https://img.shields.io/badge/Google%20GenAI-Gemini%202.5%20Flash-orange.svg)](https://ai.google.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-6%2F6%20Passing-brightgreen.svg)]()
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-yellow.svg)](LICENSE)

---

## 🌟 Executive Summary & Problem Statement Alignment

Planning major life milestones and community gatherings is fraught with logistical fragmentation, runaway vendor expenses, and stressful timeline management. **CelebrateAI** is an intelligent, full-stack event architecture assistant powered by **Google Gemini 2.5 Flash**. It automates the end-to-end planning journey across three distinct pillars:
- 💍 **Weddings**: Rehearsals, ceremonies, cocktail hours, plated receptions, speeches, and sparkler send-offs.
- 🎂 **Milestone Birthdays**: Thematic celebrations, interactive arcade setups, entertainment curation, and party pacing.
- 🤝 **Community Festivals & Galas**: Multi-stage entertainment, municipal permit management, food truck coordination, and volunteer task distribution.

---

## 🚀 Key Functional Modules

| Module | Core Capabilities | GenAI Integration |
|---|---|---|
| **AI Plan Generator** | Takes event type, date, budget, guest count, and aesthetic vibe to generate comprehensive event blueprints. | Gemini 2.5 Flash structured JSON generation for instant, tailor-made plans. |
| **Budget & Cost Controller** | Category-level allocation (Venue, Catering, Florals, Photo, Audio, Buffer), real-time invoice vs estimate tracking, over-budget warnings, and CSV export. | Smart allocation models based on industry averages and custom parameters. |
| **Master Countdown & Run of Show** | Phased milestone roadmap (`12-6 Months`, `6-3 Months`, `3-1 Months`, `Final Weeks`) and **Day-Of Hour-by-Hour Timeline** with assignees and priority badges. | Contextual timeline milestone estimation and coordination reminders. |
| **Vendor Contract & Negotiation Pipeline** | Tracks vendor statuses (`Researching` ➔ `Contacted` ➔ `Quoted` ➔ `Booked` ➔ `Paid`), quote amounts, and deposit balances. | **AI Vendor Strategist**: Generates customized inquiry emails, 15% discount negotiation pitches, and top 5 vetting questions. |
| **Personalized Ideas & Moodboard** | Visual theme identity, copyable HEX palettes, signature cocktail/food recipes, decor tips, music pacing, and unique guest activities. | Generative theme moodboards and bespoke activity concepts. |
| **Guest List & RSVP Manager** | Guest tracker with +1 headcounts, seating table allocations, and dietary restriction aggregators (Vegan, GF, Nut allergies). | Automated dietary summary calculations and seating distribution. |
| **GenAI Event Concierge** | Floating conversational assistant with full memory of the active event's budget, date, and vendor state. | Context-aware chat for real-time problem solving, speech drafting, and cost cutting. |
| **Day-Of Print & PDF Export** | Formatted single-page operational itinerary for on-site wedding coordinators and event leads. | Includes emergency vendor phone directory and coordinator checklist. |

---

## 🧠 GenAI Architecture & Services Utilized

1. **Model**: `gemini-2.5-flash` via `@google/genai` TypeScript SDK.
2. **Server-Side Proxy Architecture (`server.ts`)**:
   - `POST /api/generate-plan`: Employs strict JSON schemas (`responseMimeType: "application/json"`) to construct validated `EventPlan` entities with zero client-side key leakage.
   - `POST /api/vendor-negotiate`: Generates professional communication drafts tailored to vendor category and target savings.
   - `POST /api/chat-assistant`: Contextual event concierge injected with live plan state (budget limits, guest count, location, active vendors).
3. **Resilient Offline Fallback**: Features deterministic, procedural plan generators that ensure 100% zero-downtime execution even under network or quota restrictions.

---

## 🛡️ Security, Code Quality & Accessibility

- **Zero Client-Side Key Exposure**: API keys are securely read on the Express backend (`process.env.GEMINI_API_KEY`).
- **Strict Typing**: 100% TypeScript compliance across all components, hooks, and backend handlers.
- **Accessibility (a11y)**: Semantic HTML (`<main>`, `<header>`, native `<button>`, `<input>`, labeled controls), ARIA attributes on icon triggers, high-contrast dark theme, and keyboard navigability.
- **Efficiency**: Vite build with tree-shaking, lightweight SVG icons via `lucide-react`, and zero heavy third-party CSS frameworks.

---

## 🧪 Unit Testing & Verification

Unit tests are written with Node's native test runner (`node:test` + `node:assert/strict`) verifying pure business logic:
- `calculateBudgetSummary`: Validates budget allocations, actual expenditures, and overrun detection.
- `calculateProgress`: Tests task completion percentages and urgent pending milestones.
- `calculateGuestStats`: Tests RSVP aggregation, plus-one headcounts, and dietary restriction breakdowns.
- `formatCurrency`: Ensures accurate multi-currency string formatting across 6 global currencies.

### Running Tests:
```bash
npx --yes tsx --test src/utils/eventCalculations.test.ts
```

Output:
```
✔ formatCurrency formats various currencies correctly
✔ calculateBudgetSummary calculates totals, remaining, and categories accurately
✔ calculateBudgetSummary detects over-budget state
✔ calculateProgress evaluates completed tasks and urgent pending count
✔ calculateGuestStats handles RSVP groups, plus-ones and dietary tags
✔ Sample event generators return valid complete structures

Tests: 6 passed, 6 total
```

---

## 🛠️ Local Development & Deployment

### Prerequisites
- Node.js 20+
- Google Gemini API Key (`GEMINI_API_KEY`)

### Setup
```bash
# 1. Clone repository
git clone <your-repo-link>
cd celebrate-ai

# 2. Install dependencies
npm install

# 3. Environment Configuration
cp .env.example .env
# Add your GEMINI_API_KEY in .env

# 4. Start Development Server (Full-Stack Express + Vite)
npm run dev

# 5. Build for Production
npm run build
npm start
```
