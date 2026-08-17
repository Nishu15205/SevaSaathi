# SevaSaathi - Verified Home Care & Elder Support Platform

A comprehensive web application for connecting families in Delhi NCR with verified home care caregivers for elderly support.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui (New York style) |
| **Animations** | Framer Motion |
| **State Management** | Zustand (client state) |
| **Server State** | TanStack Query |
| **Icons** | Lucide React |
| **Form Validation** | Zod |
| **Password Hashing** | bcryptjs |
| **Notifications** | Sonner (toast) |

## Database

| Property | Details |
|----------|---------|
| **Database** | **SQLite** (SQL database, NOT MongoDB) |
| **ORM** | Prisma ORM |
| **DB File** | `db/custom.db` |
| **Schema File** | `prisma/schema.prisma` |
| **Migrations** | `prisma db push` |

### Why SQLite?
- Lightweight, file-based, zero-config database
- Perfect for sandbox/demo environments
- SQL-based (relational), supports joins, indexes, and transactions
- For production, the schema is designed to work with MySQL (just change provider)

### Database Models (11 tables)
1. **User** - All user accounts (Family, Caregiver, Admin)
2. **Patient** - Care recipient profiles created by family members
3. **Caregiver** - Caregiver professional profiles
4. **Verification** - Document verification records
5. **Booking** - Care service bookings
6. **Payment** - Payment tracking
7. **CareReport** - Daily care reports from caregivers
8. **Review** - Family reviews for caregivers
9. **Complaint** - Issue tracking and resolution
10. **Notification** - In-app notifications

## Authentication

- Password-based authentication with bcrypt hashing
- Email OTP verification on registration (6-digit code)
- Email OTP verification on password reset
- Role-based access control: `FAMILY`, `CAREGIVER`, `ADMIN`
- Client-side session via localStorage (Zustand store)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, Register, OTP, Password Reset
│   │   ├── bookings/       # Booking CRUD, status updates
│   │   ├── caregivers/     # Caregiver search, profiles
│   │   ├── patients/       # Patient/member profiles
│   │   ├── reports/        # Care reports
│   │   ├── reviews/        # Review CRUD
│   │   ├── complaints/     # Complaint management
│   │   ├── notifications/  # Notification system
│   │   ├── admin/          # Admin endpoints
│   │   └── search/         # Caregiver search
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── sevasaathi/         # Landing page components
│   ├── dashboard/          # Dashboard components
│   └── ui/                 # shadcn/ui components
├── stores/
│   └── authStore.ts        # Zustand auth store
├── lib/
│   ├── api.ts              # API client helper
│   ├── db.ts               # Prisma client
│   └── utils.ts            # Utility functions
└── hooks/                  # Custom React hooks

prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Seed data

db/
└── custom.db              # SQLite database file
```

## Getting Started

```bash
# Install dependencies
bun install

# Set up database
bun run db:push

# Seed demo data
bun run seed

# Run development server
bun run dev
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Family Member | anita.gupta@email.com | password123 |
| Caregiver | sunita.care@email.com | password123 |
| Admin | admin@sevasaathi.in | password123 |
