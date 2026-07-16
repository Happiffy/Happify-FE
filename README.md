# Happify Frontend

Frontend web untuk Happify, platform kesehatan mental yang membantu pengguna mencatat mood, melakukan journaling, berbicara dengan AI Companion, dan memantau perkembangan emosional secara berkelanjutan.

---

## Overview

Happify Frontend menyediakan pengalaman web untuk pengguna yang ingin:

- mengakses landing page dan informasi produk Happify
- melakukan login dan registrasi menggunakan Firebase Authentication
- menyelesaikan onboarding preferensi pengguna
- melihat dashboard mood dan insight kesehatan mental
- mengakses journal dan fitur pendampingan emosional
- menggunakan UI yang konsisten dengan tema Happify

Frontend tidak memanggil service AI secara langsung. Semua request aplikasi diarahkan ke BE-Happify.

---

## Tech Stack

| Area | Stack |
| --- | --- |
| Framework | React 19, Vite, TypeScript |
| Routing | React Router |
| Styling | Tailwind CSS, custom Happify UI system |
| API Client | Axios |
| Authentication | Firebase Authentication |
| UI Icons | Phosphor Icons, Iconify |
| Rich Text | Tiptap |
| Animation | GSAP, Lottie |
| Charts | Recharts |
| Testing | Vitest |
| Linting | Oxlint |
| Deployment | Railway |

---

## Features

- **Landing Page** - informasi produk, masalah kesehatan mental, dan value proposition Happify.
- **Authentication** - login dan registrasi pengguna dengan Firebase Authentication.
- **Onboarding** - pengaturan preferensi awal pengguna.
- **Mood Dashboard** - ringkasan mood, insight, trend, dan aktivitas pengguna.
- **Daily Journaling** - antarmuka untuk menulis dan mengelola refleksi harian.
- **AI Companion Access** - akses pengalaman percakapan dan hasil analisis dari backend.
- **Responsive UI** - tampilan desktop dan mobile dengan tema visual Happify.
- **Protected Routes** - dashboard hanya dapat diakses oleh pengguna yang memiliki session.

---

## Routes

| Path | Description |
| --- | --- |
| `/` | Landing page |
| `/login` | Login pengguna |
| `/register` | Registrasi pengguna |
| `/onboarding` | Pengaturan preferensi awal |
| `/dashboard` | Dashboard utama |
| `/dashboard/:section` | Section tertentu pada dashboard |

---

## Environment Variables

Buat file `.env` dari `.env.example`.

```env
VITE_API_URL=http://localhost:4000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=happify-990c2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=happify-990c2
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL BE-Happify. Production: `https://happify-be-production.up.railway.app`. |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key untuk client authentication. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain. |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID Happify. |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID. |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID. |

Frontend memakai `VITE_API_URL` untuk berkomunikasi dengan BE-Happify. Frontend tidak membutuhkan `AI_SERVICE_BASE_URL`.

---

## Getting Started

### Prerequisites

- Node.js `22.x`
- npm `10.x`
- BE-Happify berjalan dan dapat diakses dari `VITE_API_URL`
- Firebase Web App configuration

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Vite akan menjalankan aplikasi pada local development server.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

### Test

```bash
npm test
```

---

## Deployment

Production frontend menggunakan Railway.

| Environment | URL |
| --- | --- |
| Local | `http://localhost:5173` |
| Production | `https://happify-fe-production.up.railway.app` |

Railway melakukan deployment dari branch `main`. Set environment variables melalui Railway Variables, bukan melalui repository.

---

## Project Structure

```txt
src
|-- api              # Query dan service API
|-- assets           # Asset gambar dan visual Happify
|-- components       # Komponen UI bersama
|-- config           # API client dan konfigurasi aplikasi
|-- constants        # Konstanta aplikasi
|-- hooks            # Custom React hooks
|-- pages            # Modul halaman dan route
|-- types            # TypeScript types
|-- App.tsx          # Route utama aplikasi
|-- main.tsx         # Entry point React
```

---

## API Flow

```txt
Browser
   |
   v
Happify Frontend
   |
   v
BE-Happify
   |
   +--> PostgreSQL
   +--> Firebase Admin
   +--> Object Storage
   +--> AI-Happify
```
