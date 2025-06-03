# LLM Agent Prompt – Build & Evolve the Candidate‑to‑Professional Platform

## 0. Mission Statement

Deliver a \*\*lean, production‑grade web app that is visually minimalistic and slick\*\* that lets: 1. Candidates book **paid virtual coffee chats** with professionals.
2. Professionals earn their **session fee** immediately after submitting written feedback.
3. Professionals collect an **offer‑bonus** if that candidate later accepts an offer at their firm.
4. Professionals grow the network via a **multi‑level referral program** that pays a slice of every referred chat into perpetuity.
5. Stack: **Next.js + MongoDB Atlas + Vercel Functions**, 100 % serverless, simple enough that any mid‑level dev can onboard in < 30 minutes.

---

## 1. Tech Stack (Serverless‑First)

| Layer         | Choice                                | Why                                       |
| ------------- | ------------------------------------- | ----------------------------------------- |
| UI + API      | **Next.js (App Router) + TypeScript** | SSR + edge API routes in one repo         |
| Database      | **MongoDB Atlas**                     | Flexible schema, works with Mongoose      |
| Auth          | **NextAuth.js (JWT)**                 | Social logins optional (LinkedIn, Google) |
| Payments      | **Stripe Connect**                    | Handles split payouts & platform fees     |
| Jobs          | **AWS Lambda + EventBridge**          | For scheduled / retry tasks only          |
| Infra as Code | **SST (CDK)**                         | Generates Vercel + AWS resources          |
| Monitoring    | **Sentry Edge & Browser**             | Automatic sourcemap upload                |

*No Docker needed in prod; local Docker image provided for parity only.*

---

## 2. Core Domain Flows

### 2.1 Session‑Fee Flow

1. **Booking** → candidate pays via Stripe Checkout (PaymentIntent).
2. **Chat held** (embedded Zoom/Jitsi).
3. **Professional submits written feedback** (≤ 500 chars, Markdown OK).
4. `POST /api/feedback/professional` Vercel Function:

   * Marks session `completed_at`.
   * Stripe Transfer of `session_fee × (1 − platform_fee)` to professional.
   * Responds with candidate’s **pre‑committed offer‑bonus** amount.

### 2.2 Offer‑Bonus Flow

|  #  | Event                                                                                                               | Result                             |
| --- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
|  1  | Candidate signup → enters `$offerBonusCents`.                                                                       | Persist on `User.offerBonusCents`. |
|  2  | First chat with any pro inside firm F → cache `firstChatProId` on `(candidateId, firmId)`.                          |                                    |
|  3  | `OfferAccepted` created when candidate self‑reports **or** pro reports + candidate confirms.                        | Stored in `offers` collection.     |
|  4  | Scheduled function or EventBridge rule → Stripe Transfer of `$offerBonus × (1 − platform_fee)` to `firstChatProId`. |                                    |
|  5  | Dashboard + emails notify both parties.                                                                             |                                    |

### 2.3 Referral Program (NEW)

**Goal:** Reward professionals who bring candidates (or additional professionals) onto the platform and keep referring them downstream.

* **Referral Chain Rule**

  * Every session may carry an optional `referrerProId`.
  * Payout ladder: level 1 referrer earns **10 % of the chat’s gross**.

    * Each successive upstream referrer earns **10 % of their direct downstream’s bonus** (i.e. 1 % of gross at level 2, 0.1 % at level 3, ad infinitum).

* **Example**

  * Professional A → refers candidate C to professional B.

    * Chat gross = \$30.
    * A gets **\$3** (10 %), B paid normally.
  * B → refers C to professional D. Gross = \$50.

    * B gets **\$5** (10 %).
    * A gets **\$0.50** (1 %).
    * D paid normally.

* **Implementation Details**

  * **Model:** `ReferralEdge { sessionId, referrerProId, level, bonusCents }` stored at payout time.
  * **Computation:** recursive function walks `referrer` chain, allocating bonus = `gross × 0.10 × (0.10)^{level-1}` until chain ends. Cap recursion at 10 levels to avoid deep loops.
  * **Stripe Transfers** created in same function that releases the main session fee—the entire payout batch is atomic & idempotent.
  * **Platform fee** is applied **after** referral bonuses are carved out.

### 2.4 Feedback System

* **Professional → Candidate:** text feedback (`professionalFeedbacks` collection).
* **Candidate → Professional:** 1–5 star rating (`candidateRatings`).

---

### 2.5 UI Flow & Route Map (Expanded)

Below tables incorporate the mock‑ups provided in *Monet Candidate Screens.pdf* and *Monet Professional Screens.pdf*. These wireframes illustrate **functionality only**—the shipped UI must stay sleek, minimal, and fully responsive. fileciteturn0file0turn0file1

#### 2.5.1 Professional Routes & Key Components

| Route / Modal                    | Component / Section     | Core Functionality & Elements                                                                                              |
| -------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/pro/home`                      | `ProHomePage`           | Split‑pane dashboard:• **Upcoming Chats** (join / reschedule / cancel)• **Inbound Chats** (quick info + *More Info* modal) |
| `/pro/chat/[id]`                 | `InboundChatDetail`     | Candidate résumé, price, calendar preview, *Accept & Schedule* CTA                                                         |
| `ProInfoModal` (Dialog)          | `ProCandidateInfoModal` | Full candidate details & *Request to Chat*                                                                                 |
| `ProScheduleModal` (Dialog)      | `ProSelectSlot`         | Week‑view calendar grid → pick 30‑min slot → creates Zoom + Google Calendar invite                                         |
| `/pro/history`                   | `ProHistoryPage`        | Past sessions list with *Submit Feedback* or *View Feedback*                                                               |
| `FeedbackModal` (Dialog)         | `ProFeedbackForm`       | Star ratings (**Cultural Fit, Interest, Technical**) + 20‑word min textarea                                                |
| `FeedbackThankYouModal` (Dialog) | `ProFeedbackSuccess`    | Confirms main session payout and displays candidate’s offer‑bonus pledge (if any)                                          |

#### 2.5.2 Candidate Routes & Key Components

| Route / Modal                | Component / Section         | Core Functionality & Elements                                                                                                                       |                       |                                                                            |
| ---------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| `/candidate/home`            | `CandidateHomePage`         | **Upcoming Chats** list + **Mentor Search** panel with pill filters (*Industry, Company, J/L Group, Position*)                                      |                       |                                                                            |
| `/candidate/pro/[proId]`     | `ProProfilePage`            | Professional bio, expertise, rate, *More Info* accordion, *Request Chat* CTA                                                                        |                       |                                                                            |
| `ConfirmTimesModal` (Dialog) | `CandidateSelectSlot`       | **Auto‑generated list of candidate‑available slots** (pulled from Google Calendar; next 2 weeks). Candidate taps up to 3 slots → sends chat request | `CandidateSelectSlot` | Week‑view of pro’s open slots → candidate selects ≤ 3 → sends chat request |
| `RequestSentModal` (Dialog)  | `CandidateRequestSuccess`   | “Thanks—email & calendar invite once confirmed”                                                                                                     |                       |                                                                            |
| `/candidate/availability`    | `CandidateAvailabilityPage` | Editable availability calendar synced with Google Calendar                                                                                          |                       |                                                                            |
| `/candidate/history`         | `CandidateHistoryPage`      | Past chats, ratings given, outstanding offer‑bonus commitments                                                                                      |                       |                                                                            |

> **Scheduling & Calendar Integration**
>
> * **Google Calendar Sync** via OAuth (`https://www.googleapis.com/auth/calendar.events`). In `CandidateSelectSlot`, free/busy data is queried in real‑time to **auto‑populate only the candidate’s free slots**, making selection frictionless.
> * **Zoom Meeting** auto‑created on slot confirmation; stored as `zoomJoinUrl` on `Session`.
> * Default business hours enforced client‑side (9 AM–10 PM user‑local) with per‑user override.

> **Local Dev** 
>
> * `npm install && npm run dev` launches Next.js with hot reload at `http://localhost:3000`—no Docker necessary.

## 3. Repository Layout Repository Layout, in /src

```
/docs/
  architecture.md          # C4 + sequence diagrams
  payments.md              # Stripe & payout maths
  api.md                   # OpenAPI JSON + typedoc
/app/                      # Next.js app dir (pages + API)
  api/                     # Vercel Functions (TS)
  components/
  lib/                     # Mongoose models & helpers
  styles/
  hooks/
/scripts/                  # One‑off utilities
/tests/                    # Vitest + supertest
```

---

## 4. Coding & Quality Standards

* **ESLint + Prettier** via Husky pre‑commit.
* **Vitest** + **React Testing Library**; ≥ 95 % coverage on payout logic.
* **Mongoose schemas** with strict generics + zod validation.
* **Docstrings** for every exported fn/class.
* **Conventional Commits** with auto‑changelog.

---

## 5. Serverless Infra (SST)

* **Stacks**

  * `WebStack` – Vercel deploy & env.
  * `JobsStack` – Lambda functions (offer‑bonus, referral payouts, retries).
* **Secrets** in SSM → Vercel env sync.
* **CI:** GitHub Actions → lint → test → SST preview.

---

## 6. Definition of Done

1. Session‑fee, offer‑bonus **and referral‑bonus** flows fully covered by integration tests (mocked Stripe).
2. Lighthouse ≥ 90 mobile/desktop.
3. Playwright E2E: booking → feedback → multi‑level payout green.
4. Zero Sentry errors for seven consecutive prod days.

---

> **Ask clarifying questions only if essential—otherwise build with clear comments and docs.**
