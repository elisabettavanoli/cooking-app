# Co-oking 🍳

**Make the most of what you have, and find what you’re missing.**

Co-oking started with a problem my university friends and I knew all too well: planning the perfect meal, only to discover we were missing that one ingredient we’d forgotten to buy; and honestly, nobody wanted to go back to the supermarket just for an onion. What began as a simple shopping list grew into an app where purchased items move into your **Kitchen**, helping you keep track of what you already have at home. From there, the idea expanded: suggesting recipes based on available ingredients, exploring AI-powered cooking ideas, and making it easier for people in the same community to borrow or exchange things they are missing. Need an onion? Perhaps someone in your student residence has one to spare.

The project is still a work in progress. Built with React, TypeScript, and Vite, Co-oking is a mobile-first, installable Progressive Web App (PWA).

## ✨ Features

### 🥑 Kitchen Inventory
- Add, edit, and remove ingredients from your kitchen.
- Track available quantities and update them as ingredients are used.
- Organize ingredients through automatic categorization, including support for multiple languages.

### 🛒 Shopping List
- Keep track of ingredients you need to buy.
- Manage shopping items independently from your kitchen inventory.
- Transfer purchased items directly into your kitchen inventory.

### 🍝 Recipe Discovery
- Browse a recipe collection and find recipes that match your available ingredients.
- Identify recipes based on ingredient overlap.
- Discover cooking possibilities without having to start from scratch.

>**Status:** Under implementation.

### 🌍 Community & Sharing
- Connect with people in the same community, such as neighbours or people living in the same student residence.
- Explore the idea of borrowing or exchanging ingredients when you are missing something.
- Help make use of ingredients already available nearby instead of buying every item separately.
>**Status:** Under implementation.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type safety |
| Vite | Development server and production builds |
| CSS Modules | Component-level styling |
| IndexedDB | Local persistence |
| Supabase | Authentication, remote data, and community infrastructure |
| Vitest | Automated testing |
| PWA | Installability and offline application shell |

## 🏗️ Architecture

Co-oking supports two data modes:

**Local mode**
- Kitchen inventory and shopping list are stored locally using IndexedDB.
- Core kitchen management features work without a user account.
- Data remains local to the browser and is not automatically synchronized across devices.

**Supabase mode**
- Users can authenticate with email and password.
- Kitchen and shopping data can be stored remotely.
- The application includes infrastructure for real-time data updates and community-related features.

Recipe data and recipe matching currently remain local in both modes.

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/elisabettavanoli/cooking-app.git
cd cooking-app
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually `http://localhost:5173`.

### Supabase Configuration

The application can run in local mode without a Supabase account.

To use the remote features, configure the Supabase environment variables required by the application. Refer to the project's configuration and environment-variable definitions for the exact names and values.

Never commit private credentials or service-role keys to the repository.

## 🧪 Development

### Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build the production application |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Vitest test suite |
| `npm run typecheck` | Run TypeScript type checking |

### Production Build

Create an optimized production build:

```bash
npm run build
```

The generated static files are written to `dist/`.

Preview the production build locally:

```bash
npm run preview
```

The application can be deployed to a static hosting provider. HTTPS is required for installation on other devices and for browser features that depend on a secure context.

## 📂 Project Structure

```text
cooking-app/
├── public/          # Static assets, PWA icons, and favicon
├── assets/          # Source assets, including the master app icon
├── src/
│   ├── components/  # Reusable UI components
│   ├── screens/     # Application screens
│   ├── styles/      # Global styles and design tokens
│   └── lib/         # Data, persistence, recipes, and application logic
├── supabase/        # Database schema and Supabase configuration
├── scripts/         # Development utilities
└── package.json
```

The application is organized around a single React frontend. Core domain logic and persistence utilities are separated from the UI, making the main kitchen features easier to maintain and extend.

## 🗺️ Roadmap

- **Recipe intelligence:** integrate an AI-powered recipe generation service.
- **Cross-device synchronization:** improve and validate synchronization across devices.
- **Community features:** complete ingredient-sharing workflows and nearby community discovery.
- **Mobile distribution:** explore a Capacitor wrapper for publishing through the App Store and Google Play.

## 📌 Project Status

Co-oking is an actively developed project.

Kitchen inventory management, shopping list workflows, local persistence, recipe matching, and the PWA foundation are implemented. Remote account functionality and community infrastructure are also present, while some integrations and end-to-end workflows still require validation. AI-powered recipe generation and native mobile distribution remain planned extensions.

