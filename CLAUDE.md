# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Passback is a secure ticket resale platform built with Next.js. It uses an escrow-based payment system where funds are held until the buyer confirms receiving the ticket at the event. The UI is in Brazilian Portuguese.

## Development Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint

# Prisma database commands
npx prisma db push           # Push schema changes to database
npx prisma db push --force-reset  # Reset database completely
npx prisma studio            # Visual database editor (port 5555)
npx prisma generate          # Regenerate Prisma client after schema changes
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Shadcn/ui components
- **Backend**: Next.js API Routes, NextAuth (JWT sessions), Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Payment**: Asaas API (PIX e Cartao de Credito)
- **Validation**: React Hook Form + Zod

## Architecture

### Directory Structure

- `src/app/` - Next.js App Router pages and API routes
  - `(auth)/` - Login and register pages
  - `admin/` - Admin dashboard for disputes and platform management
  - `api/` - Backend API endpoints
- `src/components/` - React components including Shadcn/ui in `ui/`
- `src/lib/` - Core utilities: auth config, Prisma client, platform config, Asaas integration
- `prisma/` - Database schema

### Key Files

- `src/lib/auth.ts` - NextAuth configuration with JWT strategy
- `src/lib/config.ts` - Platform settings (10% fee, 48h auto-release, 7-day dispute window)
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/asaas.ts` - Asaas payment integration (PIX, Credit Card)
- `prisma/schema.prisma` - Database models: User, Ticket, Transaction, Dispute, Evidence

### Payment Flow (Asaas)

1. Seller creates ticket listing with image upload
2. Buyer initiates purchase → Asaas payment created (PIX or Credit Card)
3. For PIX: QR Code displayed inline → Buyer scans and pays
4. For Credit Card: Redirects to Asaas checkout
5. Webhook `/api/webhooks/asaas` confirms payment → Transaction moves to "paid"
6. Buyer confirms receipt → Transaction moves to "released"
7. Buyer can open dispute within 7 days → admin resolves

### API Routes

- `/api/auth/register` - User registration
- `/api/tickets` - CRUD for ticket listings
- `/api/transactions` - Purchase and confirmation handling
- `/api/disputes` - Dispute creation, evidence upload, resolution
- `/api/webhooks/asaas` - Payment webhook handler

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection (Neon pooler)
- `DIRECT_URL` - PostgreSQL direct connection (Neon)
- `NEXTAUTH_SECRET` - JWT signing key
- `NEXTAUTH_URL` - App URL for auth callbacks
- `ASAAS_API_KEY` - Asaas API key (starts with `$aact_`)
- `ASAAS_ENVIRONMENT` - `sandbox` or `production`
- `ASAAS_WEBHOOK_TOKEN` - Token to validate webhooks
- `NEXT_PUBLIC_APP_URL` - Public app URL

## Asaas Integration

### Sandbox vs Production

- **Sandbox**: `https://sandbox.asaas.com/api/v3`
- **Production**: `https://api.asaas.com/v3`

Set `ASAAS_ENVIRONMENT=sandbox` for testing, `ASAAS_ENVIRONMENT=production` for live.

### Webhook Events

Configure webhook URL: `https://your-domain.com/api/webhooks/asaas`

Events handled:
- `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED` → Transaction status: "paid"
- `PAYMENT_REFUNDED` → Transaction status: "refunded"
- `PAYMENT_DELETED` → Transaction status: "cancelled"
- `PAYMENT_CHARGEBACK_REQUESTED` → Transaction status: "disputed"

### Customer Requirement

Asaas requires a customer to be created before payments. The system automatically:
1. Creates customer using buyer's CPF/CNPJ
2. Stores `asaasCustomerId` in User model
3. Reuses customer for future purchases

**Important**: Buyers must have CPF registered in their profile to make purchases.

## Test Credentials

- Buyer: comprador@teste.com / 123456
- Seller: vendedor@teste.com / 123456
- Admin: admin@passback.com / 123456

## Color Scheme

- Background: `#0B1F33`, Cards: `#0F2A44`, Inputs: `#1A3A5C`
- Primary CTA: `#16C784` (green), Accent: `#2DFF88`, Alert: `#FF8A00`
