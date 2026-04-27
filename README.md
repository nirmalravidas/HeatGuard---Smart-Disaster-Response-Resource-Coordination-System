# HeatGuard - AI-Powered Heatwave Disaster Response System

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/AI-Gemini-blue?style=for-the-badge&logo=google" alt="Gemini AI">
  <img src="https://img.shields.io/badge/Maps-Leaflet-green?style=for-the-badge&logo=leaflet" alt="Leaflet">
</p>

HeatGuard is an intelligent disaster response platform designed to help communities respond effectively during heatwave emergencies. It leverages AI for situation analysis, resource allocation, and provides real-time visualization through interactive maps.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Key Features](#key-features)
4. [How It Works](#how-it-works)
   - [User Workflow](#user-workflow)
   - [AI Analysis Flow](#ai-analysis-flow)
   - [Allocation Engine](#allocation-engine)
5. [Technology Stack](#technology-stack)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Firestore Data Model](#firestore-data-model)
9. [API Endpoints](#api-endpoints)
10. [Role-Based Access Control](#role-based-access-control)

---

## Project Overview

HeatGuard addresses the critical need for rapid response during heatwave disasters. The system enables:

- **Reporters** to submit emergency reports with their live location
- **AI** to analyze report severity and recommend needed resources
- **Helpers** to view assigned tasks and manage relief operations
- **Admins** to monitor the overall situation via analytics and maps

The platform uses real-time Firestore listeners for instant updates across all connected clients.

---

## Project Structure

```
heatguard/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes (grouped)
│   │   ├── login/                # Login page
│   │   ├── signup/               # Signup page
│   │   ├── layout.tsx            # Auth layout (no sidebar)
│   │   └── RoleGuard.tsx         # Role-based route protection
│   ├── api/                      # API routes
│   │   └── ai/
│   │       ├── analyze/          # AI text analysis endpoint
│   │       └── allocate/         # Resource allocation endpoint
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard home
│   │   ├── allocator/            # Resource allocation management
│   │   ├── analytics/            # Analytics dashboard
│   │   ├── camps/                # Relief camp management
│   │   ├── helpers/              # Helper task management
│   │   ├── map/                  # Interactive map view
│   │   └── reporter/
│   │       ├── submit/           # Report submission
│   │       └── analytics/        # Reporter analytics
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/
│   ├── layout/
│   │   ├── DashboardShell.tsx    # Dashboard wrapper component
│   │   └── Sidebar.tsx           # Navigation sidebar
│   ├── map/
│   │   ├── HeatMap.tsx           # Heatmap visualization layer
│   │   └── MapClient.tsx         # Main map with markers & routing
│   └── ui/
│       └── SideBar.tsx           # UI sidebar component
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication state hook
│   └── useRole.ts                # Role checking hook
│
├── lib/                          # Core libraries
│   ├── allocation-engine.ts      # Resource allocation logic
│   ├── gemini.ts                 # Gemini AI integration
│   ├── helper-engine.ts          # Helper task management
│   ├── leafletFix.ts             # Leaflet map fixes
│   ├── auth/
│   │   └── roleGuard.ts          # Server-side role validation
│   └── firebase/
│       ├── auth.ts               # Firebase auth utilities
│       └── client.ts             # Firebase client initialization
│
├── public/                       # Static assets
├── types/                        # TypeScript type definitions
├── middleware.ts                 # Next.js middleware for auth
├── next.config.ts                # Next.js configuration
├── tailwind.config.mjs           # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

---

## Key Features

### Authentication & Authorization
- Firebase Authentication (Email/Password)
- Role-based access control (Reporter, Helper, Admin)
- Protected routes with middleware and client-side guards

### Real-Time Location Tracking
- Browser Geolocation API integration
- Auto-detect reporter's current position
- Location stored with every report

### Interactive Maps
- Leaflet-based map with OpenStreetMap tiles
- Heatmap layer showing report intensity
- Markers for reports and relief camps
- Route visualization from camps to report locations

### AI-Powered Analysis
- Gemini AI for text analysis
- Urgency score calculation (0-100)
- Resource recommendation (water, medical, ORS, cooling)
- Fallback rule-based AI when API unavailable

### Analytics Dashboard
- Real-time statistics
- Resource allocation charts
- Report distribution visualization

### Camp Management
- Relief camp CRUD operations
- Capacity tracking
- Supply status management

---

## How It Works

### User Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HEATGUARD WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ Reporter │────▶│  Submit  │────▶│    AI    │────▶│ Allocate │
  │   Logs   │     │ Report   │     │ Analyze  │     │  Resources│
  │   In     │     │ + Location│    │ Urgency  │     │  to Camp │
  └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                              │
                                                              ▼
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  Admin   │◀────│  View    │◀────│  Helper  │◀────│  Assign  │
  │ Monitors │     │  Map &   │     │ Receives │     │  Task    │
  │  Stats   │     │ Analytics│     │  Task    │     │          │
  └──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 1. Reporter Submits Report

1. Reporter logs in and navigates to **Submit Report** page
2. Browser automatically detects live location via Geolocation API
3. Reporter enters situation description in text field
4. Clicks "Submit Report" button

### 2. AI Analysis Flow

```
Reporter's Text Input
        │
        ▼
┌───────────────────┐
│  /api/ai/analyze  │
│     (POST)        │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Gemini AI API    │
│  (or Fallback)    │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Returns:         │
│  - urgency_score  │
│  - needed_resources│
│  - explanation    │
└───────────────────┘
```

### 3. Allocation Engine

After AI analysis, the system:

1. Fetches all relief camps from Firestore
2. Calculates distance from report location to each camp
3. Selects the nearest camp with available capacity
4. Allocates resources based on AI recommendations
5. Updates the report with allocation plan

### 4. Map Visualization

The map component (`MapClient.tsx`) provides:

- **Heatmap Layer**: Visual intensity based on urgency scores
- **Report Markers**: Red markers showing report locations
- **Camp Markers**: Blue markers showing relief camp locations
- **Route Lines**: Blue lines showing optimal routes from camps to reports

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **AI** | Google Gemini API |
| **Maps** | Leaflet + React-Leaflet |
| **Charts** | Recharts |
| **State** | React hooks + SWR |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore & Authentication enabled
- Google Gemini API key (optional - fallback AI available)

### Installation

```bash
# Clone the repository
cd heatguard

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

Create `.env.local` with:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini AI (optional - fallback available)
GEMINI_API_KEY=your_gemini_key
# or
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Firestore Data Model

### `users` Collection

```typescript
{
  uid: string;           // Firebase Auth UID
  email: string;
  role: "reporter" | "helper" | "admin";
  name: string;
  createdAt: Timestamp;
}
```

### `reports` Collection

```typescript
{
  id: string;
  userId: string;        // Reporter's UID
  text: string;          // Situation description
  urgencyScore: number;  // 0-100
  resources: string[];   // ["water", "medical", "ORS"]
  explanation: string;   // AI reasoning
  status: "assigned" | "in_progress" | "resolved";
  location: {
    lat: number;
    lng: number;
  };
  allocationPlan: {
    campId: string;
    campName: string;
    resources: {...};
    priority: string;
  };
  createdAt: Timestamp;
}
```

### `camps` Collection

```typescript
{
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  supplies: {
    water: number;
    medicalKits: number;
    ORS: number;
    coolingKits: number;
  };
  status: "active" | "inactive";
}
```

---

## API Endpoints

### `POST /api/ai/analyze`

Analyzes report text and returns urgency assessment.

**Request:**
```json
{
  "text": "Elderly person fainting in the market"
}
```

**Response:**
```json
{
  "urgency_score": 85,
  "needed_resources": ["water", "medical", "ORS"],
  "explanation": "High urgency - elderly person showing heat stress symptoms"
}
```

### `POST /api/ai/allocate`

Allocates resources to nearest suitable camp.

**Request:**
```json
{
  "reports": [{
    "id": "report_123",
    "text": "...",
    "urgencyScore": 85,
    "resources": ["water", "medical"],
    "location": { "lat": 23.79, "lng": 86.43 }
  }],
  "camps": [{
    "id": "camp_1",
    "lat": 23.80,
    "lng": 86.44,
    "capacity": 100,
    "supplies": { "water": 500, ... }
  }]
}
```

**Response:**
```json
{
  "allocations": [{
    "reportId": "report_123",
    "campId": "camp_1",
    "campName": "Central Relief Camp",
    "resources": { "water": 10, "medicalKits": 2, "ORS": 20 },
    "priority": "high",
    "distance": 1.2
  }]
}
```

---

## Role-Based Access Control

| Role | Access |
|------|--------|
| **Reporter** | Submit reports, view own reports |
| **Helper** | View assigned tasks, update task status |
| **Admin** | Full access - all pages and analytics |

### Route Protection

- **Middleware** (`middleware.ts`): Protects `/dashboard/*` routes
- **RoleGuard** (`(auth)/RoleGuard.tsx`): Client-side role validation
- **useRole Hook** (`hooks/useRole.ts`): Programmatic role checking

---

## Key Pages

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Public landing page |
| Login | `/login` | User authentication |
| Signup | `/signup` | New user registration |
| Dashboard Home | `/dashboard` | Overview and quick stats |
| Submit Report | `/dashboard/reporter/submit` | Report emergency |
| Map View | `/dashboard/map` | Interactive map with heatmap |
| Camps | `/dashboard/camps` | Manage relief camps |
| Helpers | `/dashboard/helpers` | Manage helper tasks |
| Analytics | `/dashboard/analytics` | View statistics |

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

This project is for educational and demonstration purposes.

---

## Acknowledgments

- [Next.js](https://nextjs.org)
- [Firebase](https://firebase.google.com)
- [Google Gemini](https://gemini.google.com)
- [Leaflet](https://leafletjs.com)
- [Tailwind CSS](https://tailwindcss.com)This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
