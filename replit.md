# BrasilLojas — E-commerce Platform

## Overview

Full Brazilian e-commerce platform built as a pnpm workspace monorepo. Two customer-facing sites:
1. **BrasilLojas** (`/`) — Customer storefront (green #1B5E20 + red #C62828 branding)
2. **BrasilLojas Admin** (`/admin/`) — Admin panel restricted to the creator

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk (Google/phone/email)
- **Frontend**: React + Vite + Tailwind CSS v4 + Framer Motion
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Packages

- `artifacts/brasillojas` — customer storefront
- `artifacts/brasillojas-admin` — admin panel
- `artifacts/api-server` — Express API (port 8080, routed via `/api/`)
- `lib/db` — Drizzle ORM schema + PostgreSQL client
- `lib/api-spec` — OpenAPI spec (`openapi.yaml`)
- `lib/api-zod` — Zod schemas generated from spec
- `lib/api-client-react` — React hooks generated from spec (via Orval)

## API Routes

- `GET/POST /api/products` — product listing, creation
- `GET /api/products/featured` — featured products
- `GET /api/products/:id` — product detail
- `GET /api/categories` — category listing
- `GET/POST/PUT/DELETE /api/cart` — cart management (auth required)
- `GET/POST /api/orders` — order management (auth required)
- `GET /api/orders/all` — all orders (admin)
- `GET/POST /api/products/:id/reviews` — product reviews
- `GET/POST/PUT/DELETE /api/coupons` — coupon management
- `GET /api/coupons/validate/:code` — coupon validation
- `GET/PUT /api/users/profile` — user profile
- `GET /api/admin/dashboard` — admin dashboard stats

## DB Schema Tables

- `categories` — product categories
- `products` — product catalog
- `users` — Clerk-based user profiles
- `orders` — purchase orders with items JSON
- `cart_items` — per-user cart items
- `reviews` — product reviews
- `coupons` — discount coupons

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Important Notes

- Admin access controlled by `VITE_ADMIN_EMAIL` env var in admin site
- Seed script: `pnpm --filter @workspace/api-server dlx tsx src/seed.ts`
- Cart endpoint returns 401 for unauthenticated users (by design)
- Product images use Unsplash URLs from seed data
- Coupon codes: BEMVINDO10 (10%), FRETE0 (R$30 off), BLACK50 (50%)

## Recent updates (May 2026)
- **Stripe removed.** Payment is now PIX (5% off), Dinheiro, or Cartão na loja (customer goes to store). No online card processing.
- **WhatsApp checkout redirect:** On order confirm, picks one random salesperson from a list of 10 and redirects to `wa.me/` with a pre-filled message containing all customer + order details.
- **Delivery categories updated:** `moveis` + `eletronicos` = home delivery; all other categories = store pickup.
- **Admin data reset:** `DELETE /api/admin/reset-data` endpoint + "Zerar Dados de Teste" button in admin Dashboard with 2-step confirmation.
- **Boleto removed** from all UI and API spec; payment enum is now `[pix, dinheiro, cartao]`.

## Apr 2026 updates
- Real category/banner images and brand logo (logo.jpg) wired into Header, Footer, AdminLayout, Home, Receipt.
- Add-to-cart fixed (auth-aware, click event no longer hijacked by ProductCard Link wrapper).
- Category filters fixed: `Ofertas` returns products with discount, `Novidades` returns recently created products.
- Promo messaging changed from 50% to 10%.
- Payment methods added in Cart.tsx: PIX (5% off), Cartão Crédito (1-12x), Cartão Débito, Boleto. Backend stores `payment_method`/`payment_status` on `orders` (drizzle push run). Card auto-approved in sandbox; PIX/boleto stay pending. Real card processing requires Stripe (paid plan).
- Receipt page at `/receipt/:id` with auto window.print() after checkout (?print=1). Includes fake PIX copia-e-cola and boleto linha digitável.
- Admin Dashboard expanded: revenue today/week, sales bar chart for last 7 days, recent orders list with status + payment badges.
- API: `GET /admin/dashboard` now returns `recentOrders`, `salesByDay`, `revenue.today`, `revenue.week`. OpenAPI spec + client regenerated.
