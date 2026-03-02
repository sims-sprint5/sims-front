# Blink — Frontend (Vue 3 + Vite)

## Overview

Modern web interface for managing users, authentication, and administrative data using Vue 3 and Vite. Consumes a REST API (Laravel backend).

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Vue** | 3.5+ | Progressive JavaScript framework |
| **Vite** | 7.2+ | Frontend tooling and dev server |
| **TypeScript** | 5.9+ | Type-safe JavaScript |
| **Tailwind CSS** | 3.4+ | Utility-first CSS framework |
| **Vue Router** | 4.6+ | Client-side routing |
| **Vue i18n** | 9.14+ | Internationalization |
| **Axios** | 1.13+ | HTTP client for API |
| **Node.js** | 18+ | JavaScript runtime |
| **npm** | 10+ | Package manager |

---

## 📁 Project Structure

```
src/
├── components/base/          # Reusable UI components
├── layouts/                  # Application layouts
├── modules/                  # Feature modules (auth, users, dashboard, tickets, settings)
│   ├── auth/                 # Authentication routes, views, services
│   ├── users/                # User management
│   ├── dashboard/            # Dashboard views
│   ├── tickets/              # Tickets management
│   └── settings/             # Settings panel
├── router/                   # Route definitions
├── shared/                   # Shared services, composables, utils
├── locales/                  # i18n translations (ca, es, en)
├── assets/                   # Static assets
└── main.ts                   # Application entry point
```

---

## ✅ Prerequisites

- Node.js >= 18
- npm >= 10
- Git

---

## 🚀 Installation & Setup

### 1. Clone the repository

```bash
git clone <REPOSITORY_URL>
cd sprint4-blink
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_API_URL=http://localhost:8001/api
```

### 4. Start development server

```bash
npm run dev
```

Access the app at `http://localhost:5173`

### 5. Build for production

```bash
npm run build
```

---

## ⚙️ Environment Variables

```env
# API endpoint
VITE_API_URL=http://localhost:8001/api

# Or use relative path for same domain
VITE_API_URL=/api
```

---

## ▶️ Running the Project

### Development

```bash
npm run dev
```

Hot Module Replacement (HMR) enabled. Changes automatically reflect in the browser.

### Production build

```bash
npm run build
```

Optimized build in `dist/` directory.

### Preview production build

```bash
npm run preview
```

---

## 🎯 Features

- Authentication (sign in, sign up, sign out with token management)
- User management (list, create, edit, delete)
- Dashboard with key indicators
- Settings panel
- Multi-language support (Catalan, Spanish, English)
- Reusable components (buttons, cards, inputs, modals, tables)
- Error handling and notifications (toasts)

---

## 📍 Key Files

- `vite.config.ts` — Vite configuration (API proxy, path aliases)
- `tailwind.config.js` — Tailwind CSS setup
- `tsconfig.json` — TypeScript configuration
- `src/main.ts` — Application bootstrap
- `src/router/index.ts` — Route definitions
- `src/shared/services/api.service.ts` — API client

---

## 🔗 API Integration

The frontend communicates with the backend via `src/shared/services/api.service.ts` using Axios. It includes:

- Base URL configuration via environment variables
- Bearer token authentication (Sanctum)
- Error handling and interceptors

---

## 🌍 Internationalization

Supported languages: Catalan, Spanish, English

Translation files: `src/locales/` (ca.json, es.json, en.json)

To add a new language:
1. Create `src/locales/[lang].json`
2. Register in `src/i18n.ts`

