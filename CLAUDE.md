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
- **Database**: SQLite (dev.db)
- **Payment**: Mercado Pago SDK
- **Validation**: React Hook Form + Zod

## Architecture

### Directory Structure

- `src/app/` - Next.js App Router pages and API routes
  - `(auth)/` - Login and register pages
  - `admin/` - Admin dashboard for disputes and platform management
  - `api/` - Backend API endpoints
- `src/components/` - React components including Shadcn/ui in `ui/`
- `src/lib/` - Core utilities: auth config, Prisma client, platform config, Mercado Pago integration
- `prisma/` - Database schema and SQLite database file

### Key Files

- `src/lib/auth.ts` - NextAuth configuration with JWT strategy
- `src/lib/config.ts` - Platform settings (10% fee, 48h auto-release, 7-day dispute window)
- `src/lib/prisma.ts` - Prisma client singleton
- `prisma/schema.prisma` - Database models: User, Ticket, Transaction, Dispute, Evidence

### Data Flow

1. Seller creates ticket listing with image upload
2. Buyer initiates purchase → Mercado Pago payment preference created
3. Webhook confirms payment → Transaction moves to escrow
4. After event + 48 hours → funds auto-release to seller
5. Buyer can open dispute within 7 days → admin resolves

### API Routes

- `/api/auth/register` - User registration
- `/api/tickets` - CRUD for ticket listings
- `/api/transactions` - Purchase and confirmation handling
- `/api/disputes` - Dispute creation, evidence upload, resolution
- `/api/webhooks/mercadopago` - Payment webhook handler

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - SQLite connection (default: `file:./dev.db`)
- `NEXTAUTH_SECRET` - JWT signing key
- `NEXTAUTH_URL` - App URL for auth callbacks
- `MERCADOPAGO_ACCESS_TOKEN` - Payment API token
- `MERCADOPAGO_PUBLIC_KEY` - Payment frontend key

## Test Credentials

- Buyer: comprador@teste.com / 123456
- Seller: vendedor@teste.com / 123456
- Admin: admin@passback.com / 123456

## Color Scheme

- Background: `#0B1F33`, Cards: `#0F2A44`, Inputs: `#1A3A5C`
- Primary CTA: `#16C784` (green), Accent: `#2DFF88`, Alert: `#FF8A00`
