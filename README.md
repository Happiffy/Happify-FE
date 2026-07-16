# Happify Frontend

The Happify web client is a mental wellbeing application for mood tracking, journaling, AI companion access, anonymous community support, and ongoing emotional progress monitoring.

## Overview

The frontend provides:

- Product landing pages and Happify information
- Firebase Authentication sign-in and registration
- User-preference onboarding
- Mood, journal, referral, and wellbeing dashboard views
- Anonymous community participation and professional-care workflows
- A consistent, responsive Happify visual system

The frontend does not call the AI service directly. Application requests are sent to Happify Backend.

## Technology Stack

| Area | Stack |
| --- | --- |
| Framework | React 19, Vite, TypeScript |
| Routing | React Router |
| Styling | Tailwind CSS and the Happify UI system |
| API Client | Axios |
| Authentication | Firebase Authentication |
| Charts | Recharts |
| Maps | MapLibre GL |
| Rich Text | Tiptap |
| Icons | Phosphor Icons and Iconify |
| Testing | Vitest |
| Linting | Oxlint |

## Features

- **Authentication** — Firebase sign-in, registration, session restoration, and protected routes.
- **Onboarding** — Initial wellbeing and accessibility preferences.
- **Mood Dashboard** — Mood summary, intensity trend, journal risk summary, referrals, and recent entries.
- **Anonymous Heatmap** — Coarse k-anonymous regional mood aggregates with an apply-only custom date range.
- **Journaling** — Daily reflections, rich-text entries, optional images, and AI-generated reflections.
- **Community** — Anonymous posts, replies, support actions, and moderation-aware interactions.
- **Professional Care** — Referral and care-chat interfaces.
- **Responsive UI** — Desktop and mobile layouts with accessibility-aware controls.

## Routes

| Path | Description |
| --- | --- |
| `/` | Landing page |
| `/login` | User sign-in |
| `/register` | User registration |
| `/onboarding` | Initial preference setup |
| `/dashboard` | Main dashboard |
| `/dashboard/:section` | Dashboard section |

## Environment Variables

Create `.env` from `.env.example`:

```env
VITE_API_URL=http://localhost:4000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=happify-990c2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=happify-990c2
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of Happify Backend. |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain. |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project identifier. |
| `VITE_FIREBASE_APP_ID` | Firebase Web application identifier. |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement identifier. |

## Getting Started

### Prerequisites

- Node.js `22.x`
- npm `10.9.4` or later
- Happify Backend reachable through `VITE_API_URL`
- Firebase Web application configuration

### Installation

```bash
npm ci
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

### Quality Checks

```bash
npm run lint
npm test
npm run build
```

## Project Structure

```text
src
|-- api              # API queries and services
|-- assets           # Images and visual assets
|-- components       # Shared UI components
|-- config           # API client and application configuration
|-- constants        # Application constants
|-- hooks            # Custom React hooks
|-- pages            # Pages and route modules
|-- types            # TypeScript types
|-- App.tsx          # Application routes
|-- main.tsx         # React entry point
```

## Privacy

Community API responses are designed to expose anonymous public content only. The heatmap renders coarse aggregate regions that satisfy the configured anonymity threshold; it does not expose individual coordinates or identities.
