# CelebrateAI - GenAI Celebration & Event Planner

> **PromptWars Virtual Hackathon — [Challenge 5] Celebration & Event Planner**  
> *Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas.*

[![CI](https://github.com/snehathumar/CelebrateAI/actions/workflows/ci.yml/badge.svg)](https://github.com/snehathumar/CelebrateAI/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Gemini AI](https://img.shields.io/badge/Google%20GenAI-Gemini%202.5%20Flash-orange.svg)](https://ai.google.dev/)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-yellow.svg)](LICENSE)

---

## 🔗 Live Demo
- **Live Application**: [https://celebration-event-planner-ai.ai.studio/](https://celebration-event-planner-ai.ai.studio/)

---

## 📷 Screenshots

| Dashboard & Run of Show | AI Plan Generator |
|:---:|:---:|
| ![Dashboard](docs/dashboard.png) | ![Generator](docs/plan-generator.png) |

| Vendor Strategist & Negotiation | Event Concierge Chat |
|:---:|:---:|
| ![Vendor Negotiator](docs/vendor-negotiator.png) | ![Concierge](docs/concierge-chat.png) |

*(Screenshot asset files are located in [`/docs`](docs/))*

---

## 📖 Overview

Planning major life milestones and community gatherings requires coordinating budgets, milestones, vendors, and schedules. **CelebrateAI** is an event planning web application powered by **Google Gemini 2.5 Flash** with an Express backend proxy and React frontend.

The application supports three core event types:
- **Weddings**: Timeline milestones, ceremony and reception schedule, seating, and vendor tracking.
- **Milestone Birthdays**: Theme ideas, pacing, playlist cues, and budget breakdown.
- **Community Festivals**: Activity zones, volunteer tasks, dietary tracking, and run-of-show logistics.

---

## ⚙️ Key Functional Modules

| Module | Description | Backend / AI Integration |
|---|---|---|
| **AI Plan Generator** | Generates budgets, timeline tasks, vendor recommendations, and creative concepts based on user parameters. | Uses Gemini 2.5 Flash structured outputs (`responseSchema`); uses template fallback when the AI call fails or no API key is set. |
| **Budget Tracker** | Itemized budget tracking by category (Venue, Catering, Florals, Photo, Audio, Buffer) with estimated vs. actual expenses and multi-currency formatting. | Client-side calculations with CSV export support. |
| **Timeline & Day-Of Run of Show** | Phased milestone roadmap (`12-6 Months`, `6-3 Months`, `3-1 Months`, `Final Weeks`) adjusted to event date, plus an hour-by-hour day-of schedule. | Automatically filters out expired milestone phases based on event date. |
| **Vendor Management & Negotiation** | Track vendor pipeline status (`Researching`, `Contacted`, `Quoted`, `Booked`, `Paid`), deposit tracking, and notes. | **AI Vendor Strategist**: Generates inquiry emails, negotiation counter-offers, and vetting questions via `/api/vendor-negotiate`. |
| **Personalized Ideas & Moodboard** | Palette colors, signature food and drink ideas, decor guidance, and event activities. | Generated per event theme and vibe. |
| **Guest List & RSVP Manager** | Guest list with attendance status, plus-one headcounts, and dietary restriction summary. | Aggregates confirmed guest counts and dietary requirements. |
| **Event Concierge** | Chat modal for planning advice, budget trade-offs, and ideas. | Powered by `/api/chat-assistant`, receiving current plan state and the last 10 messages. |
| **Day-Of Print & PDF View** | Printable view for on-site day-of coordination. | Browser print-ready layout with key contacts and timeline. |

---

## 🧠 Architecture & AI Integration

1. **Model**: `gemini-2.5-flash` via the `@google/genai` SDK.
2. **Backend API Endpoints (`server.ts`)**:
   - `POST /api/generate-plan`: Generates a structured event plan using Gemini response schemas. Validates input and returns a source indicator (`gemini` or `template`).
   - `POST /api/vendor-negotiate`: Generates customized outreach emails and discount counter-proposals based on vendor category and quote amounts.
   - `POST /api/chat-assistant`: Conversational assistant with context injected from the current event plan state and the last 10 chat messages.
3. **Template Fallback**:
   - If the Gemini API call fails, times out, or if `GEMINI_API_KEY` is not configured, the server provides a deterministic template fallback so the application remains functional.
   - The UI displays a source indicator badge (`Template result (AI unavailable)`) whenever fallback data is used.

---

## 🛡️ Security & Code Quality

- **API Key Protection**: `GEMINI_API_KEY` is kept exclusively on the server and is never sent to the client bundle.
- **Request Validation**: Request payloads are validated with Zod schemas enforcing field boundaries, date formats (`YYYY-MM-DD`), and string lengths.
- **Rate Limiting**: Configured using `express-rate-limit` (10 requests/minute on AI endpoints, 30 requests/minute on general routes).
- **Security Headers**: Basic HTTP headers configured via `helmet`.
- **Payload Limits**: JSON body parser limited to 100kb to mitigate oversized payload attacks.
- **Output Sanitization**: AI chat responses render via `react-markdown` with HTML disabled to prevent script injection.
- **High-Efficiency Bundling**: Vite manual chunking separates vendor dependencies into cacheable modules, bringing main bundle down from 768kB to 182kB (35kB gzipped) with zero monolithic chunk warnings.
- **HTTP Compression**: Express uses `compression` middleware with gzip/brotli encoding and static immutable asset caching.
- **Accessibility & Contrast**: Meets WCAG 2.1 AA standards with semantic ARIA roles (`role="tablist"`, `role="tab"`, `role="status"`), skip-to-content links, and keyboard navigable modal dialogs.
- **Code Standards**: `.editorconfig` enforcing standardized formatting and clean TypeScript compilation.

---

## ⚠️ Known Limitations

- **No Persistent Database or User Accounts**: Event data is stored in memory and browser session state; data does not persist across different browser sessions.
- **AI Output Accuracy**: AI-generated suggestions, budget estimates, and timelines are recommendations and should be independently verified for real-world bookings.
- **Fictional Vendor Presets**: Sample vendors and quotes provided in templates are fictional demonstrations.

---

## 🧪 Testing & Quality Assurance

The test suite runs 47 tests across unit, integration, and component tests using Vitest and React Testing Library:

- **Budget Calculations & Normalization**: Category allocations, actual vs. estimate delta, remaining budget, over-budget detection, proportional scaling with zero rounding drift.
- **Milestone & Timeline Engine**: Task progress, high-priority pending counters, date proximity phase filtering.
- **Guest Management & Accessibility**: RSVP status labels (non-color-only), plus-one aggregations, dietary requirements.
- **API Endpoint Integration**: Supertest integration tests for `/api/generate-plan`, `/api/vendor-negotiate`, in-memory TTL caching, rate limiting (429), and fallback execution.
- **Validation & Boundary Tests**: Strict YYYY-MM-DD date regex, guest limits (1-10,000), budget bounds ($1-$1B), string length caps.
- **Security & Sanitization**: Prompt injection isolation delimiter testing, chat message length bounds.

### Run All Tests:
```bash
npm test
```

### Type Check (TypeScript):
```bash
npx tsc --noEmit
# or
npm run typecheck
```

### Linting:
```bash
npm run lint
```

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 20+
- (Optional) Google Gemini API Key from Google AI Studio

### Setup Instructions
```bash
# 1. Clone repository
git clone https://github.com/snehathumar/CelebrateAI.git
cd CelebrateAI

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Set GEMINI_API_KEY in .env (if left unset, template fallback will be used)

# 4. Start full-stack development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build
```bash
npm run build
npm start
```

---

## 📄 License

This project is licensed under the [Apache-2.0 License](LICENSE).
