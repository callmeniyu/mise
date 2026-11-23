# Mise — Hospitality & Kitchen Operations Platform

A sophisticated, standalone restaurant and catering management platform running entirely in the browser using a high-reliability `localStorage` data architecture.

Designed for modern culinary operators, executive chefs, banquet directors, and boutique catering ateliers.

---

## 1. Overview & Transformation

Mise was transformed from a full-stack PostgreSQL/Express prototype into a standalone, browser-first hospitality operations platform.

- **Zero-Backend Architecture:** Completely eliminates external API servers, PostgreSQL databases, Express middleware, Google OAuth dependencies, JWT cookie sessions, and Stripe SDKs.
- **Client-Side Persistence:** All operational records—orders, inventory stock, menu costing recipes, purchase orders, vendor profiles, notifications, and simulated payments—are persisted locally in the browser using partitioned, schema-versioned `localStorage`.
- **Editorial Hospitality Identity:** Redesigned with a distinct culinary visual system featuring deep charcoal (`#202923`), warm linen canvas (`#F6F3EC`), crisp paper surfaces (`#FFFEFA`), terracotta paprika accents (`#E65B45`), culinary sage (`#9EAF91`), and butter saffron highlights (`#E9C978`).

---

## 2. Live Demo Authentication

Mise operates with a built-in local demonstration session:

- **Demo Email:** `admin@mise.demo`
- **Demo Password:** `MiseDemo123`
- **Instant Access:** One-click **"Enter Demo Account"** button on the sign-in screen immediately activates the full operational dashboard.

---

## 3. Core Modules & Capabilities

### Operations Command (Dashboard)
- Real-time business KPIs: Today's Orders, Upcoming Banquets, Low-Stock Alerts, Inventory Valuation, Monthly Revenue, and Pending Receivables.
- Interactive Revenue & Cost Trajectory charts comparing contracts against procurement expenses.
- Top-performing menu dishes by volume and margin.
- Upcoming banquet calendar and live orders dispatch queue.
- Quick Actions bar for 1-click order creation, purchase logging, and stock checks.

### Orders & Catering Contracts (`/orders`)
- Full contract lifecycle: `Inquiry` → `Confirmed` → `In Progress` → `Delivered` → `Closed`.
- Support for Wedding, Corporate, Family, and Individual event segments.
- Automated guest count pricing (`guestCount × pricePerHead`) and itemized culinary lines.
- Advance payment tracking with live remaining balance calculation.
- Detailed contract sheet with one-click lifecycle progression and receipt logs.

### Menu & Food Costing (`/menu`)
- Recipe catalog across Mains, BBQ, Rice, Desserts, Live Stations, Appetizers, and Beverages.
- Automated margin calculation: `Margin % = ((Selling Price - Cost) / Selling Price) × 100`.
- Service availability toggle (`In Service` / `86'd`).
- Recipe ingredient breakdown and prep timing.

### Inventory & Stock Control (`/inventory`)
- Real-time ingredient levels with automated stock status badges (`In Stock`, `Low Stock`, `Out of Stock`).
- Minimum threshold monitoring with instant low-stock operational notifications.
- Interactive `+ / -` stock adjustment modal with audit reasoning (Manual Audit, Purchase Arrival, Prep Usage, Spoilage/Wastage).
- Full audit log traceability per ingredient.

### Purchases & Procurement Ledger (`/purchases`)
- Wholesale purchase order logging with supplier and ingredient auto-linking.
- **Transactional Stock Sync:** Creating a purchase order immediately replenishes the matching inventory item stock level and records an audit movement.
- **Stock Rollback:** Deleting or editing a purchase order reconciles inventory stock without duplication.
- Integrated **Suppliers & Vendor Directory** with contact details, city, categories, and historical procurement metrics. Safe deletion safeguards historical purchase integrity.

### Profit & Financial Intelligence (`/profit`)
- Accrual vs cash-basis accounting matrix: distinguishes Invoiced Contract Value, Recognized Revenue (Delivered/Closed), Cash Advances Received, Procurement Expenses (COGS), and Outstanding Receivables.
- Gross Margin analysis and 6-month trajectory graphs.
- Revenue distribution breakdown by client segment (Weddings, Corporate, Family, Individual).

### Payments & Simulation Terminal (`/payments`)
- Fully simulated payment processing terminal (zero Stripe SDK / external API calls).
- Order balance settlement validation (prevents payments exceeding balance).
- Fictional masked demo card vault (`Visa •••• 4242`, `Mastercard •••• 8844`).
- Support for Credit Card, Bank Wire / IBFT, Cash, and Cheque payment methods.
- Simulation outcome toggles (Simulate Approval vs Simulate Card Decline).
- **Simulated Refund:** Instantly refunds transactions and restores contract balances.

### Business Settings & Data Management (`/settings`)
- Establishment identity: name, tagline, concierge email, phone, address, and localized currency.
- **Reset to Seed Data:** Restores the comprehensive original 2026 Mise seed dataset while preserving unrelated browser storage keys.
- **JSON Backup & Restore:** 1-click JSON export and import for data migration across devices.

---

## 4. Architecture & Data Flow

```text
User Interaction
       │
       ▼
React View / Component
       │
       ▼
TanStack Query Hooks (`useOrders`, `useInventory`, etc.)
       │
       ▼
Domain Services (`ordersService`, `inventoryService`, `paymentsService`, etc.)
       │
       ▼
Centralized Storage Engine (`storageService`)
       │
       ▼
Browser `window.localStorage`
  ├── `mise:database:v1`     (Full domain database)
  ├── `mise:session:v1`      (User demo session)
  ├── `mise:settings:v1`     (Workspace settings)
  └── `mise:notifications:v1` (Operational alerts)
```

### Data Integrity & Safeguards
- Schema versioning (`v1`) with automatic corrupted-JSON recovery.
- Safe transactional updates across related entities (Purchases ↔ Inventory ↔ Suppliers; Payments ↔ Orders).
- Fallback in-memory storage for restricted/incognito environments where `localStorage` is unavailable.

---

## 5. Technology Stack

- **Runtime & UI:** React 19, TypeScript 5, Vite 7
- **Styling:** Tailwind CSS v4, `@fontsource/playfair-display`, `@fontsource/inter`
- **Components:** Radix UI primitives, Lucide Icons, Sonner toasts
- **State & Data Caching:** TanStack React Query v5
- **Data Visualization:** Recharts
- **Testing:** Vitest

---

## 6. Development & Verification

### Prerequisites
Node.js 18+ and npm.

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open **http://localhost:8080** to launch the Mise operations platform.

### Run Automated Tests
```bash
npm test
```
Executes comprehensive Vitest test suites verifying:
- Zero-backend invariants (no Axios, no fetch to `/api/`, no Stripe, no backend environment variables).
- Demo authentication & session persistence.
- Storage recovery & reset isolation.
- Business logic (order totals, payment deductions, refund rollbacks, inventory sync).

### Production Build
```bash
npm run build
```
Generates a static production bundle in `dist/`.

### Preview Build
```bash
npm run preview
```

---

## 7. Static Deployment

Because Mise requires no server processes or database servers, it can be deployed to any static host:

- **Vercel / Netlify / Cloudflare Pages / GitHub Pages / AWS S3**
- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback: Ensure routing redirects all unknown requests to `index.html`.

---

## 8. Attribution & Notices

- **Upstream Foundation:** Built upon the repository template originally drafted by Saifullah Shaukat.
- **Transformation:** Visual identity, application redesign, local storage data architecture, business logic reconciliation, payment simulation, and backend decoupling developed for the Mise Hospitality Platform.
