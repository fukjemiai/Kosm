# Kosm – Beauty Salon Booking & Billing System

Rezervační a fakturační systém pro kosmetické salony. Multi-tenant architektura s podporou více poboček, Keycloak autentizací a guest rezervacemi.

## Architektura

```
┌─────────────────┐  ┌──────────────────┐
│  Customer FE    │  │   Staff FE       │
│  (React + MUI)  │  │   (React + MUI)  │
│  :5173          │  │   :5174          │
└────────┬────────┘  └────────┬─────────┘
         │                    │
         └────────┬───────────┘
                  │
         ┌────────▼────────┐
         │  NestJS API     │
         │  :3000          │
         │  /api/v1/*      │
         └───┬─────────┬───┘
             │         │
    ┌────────▼──┐  ┌───▼──────────┐
    │ PostgreSQL│  │  Keycloak    │
    │ :5432     │  │  :8080       │
    └───────────┘  └──────────────┘
```

## Stack

| Vrstva | Technologie |
|--------|-------------|
| Backend API | NestJS, TypeScript, TypeORM |
| Databáze | PostgreSQL 16 |
| Auth | Keycloak 26 (OIDC/JWT) |
| Customer FE | React 19, MUI 6, Vite |
| Staff FE | React 19, MUI 6, Vite |
| Mail (dev) | MailHog |

## Quick Start

### 1. Infrastruktura (Docker)

```bash
cd docker
docker compose up -d
```

Tím se spustí:
- **PostgreSQL** na `localhost:5432`
- **Keycloak** na `http://localhost:8080` (admin/admin)
- **MailHog** UI na `http://localhost:8025`

### 2. Backend

```bash
cd packages/backend
cp .env.example .env
npm install
npm run migration:run   # Vytvoří DB tabulky
npm run dev             # NestJS na http://localhost:3000
```

API dokumentace (Swagger): `http://localhost:3000/api/docs`

### 3. Customer Frontend

```bash
cd packages/customer-fe
npm install
npm run dev             # http://localhost:5173
```

### 4. Staff Frontend

```bash
cd packages/staff-fe
npm install
npm run dev             # http://localhost:5174
```

## Dev účty (Keycloak)

| Role | Email | Heslo |
|------|-------|-------|
| Org Owner | owner@kosm.local | password |
| Staff | stylist@kosm.local | password |
| Customer | customer@kosm.local | password |

## Struktura monorepa

```
Kosm/
├── packages/
│   ├── backend/              # NestJS API
│   │   └── src/
│   │       ├── common/       # Guards, decorators, DTOs, enums
│   │       ├── database/     # Entity, migrace, data source
│   │       └── modules/      # Auth, Bookings, Billing, ...
│   ├── customer-fe/          # React booking web
│   │   └── src/
│   │       ├── components/   # UI komponenty
│   │       ├── pages/        # Stránky (booking flow, ...)
│   │       ├── api/          # API client + typy
│   │       └── context/      # Auth context (Keycloak)
│   └── staff-fe/             # React staff portál
│       └── src/
│           ├── components/   # Sidebar, TopBar
│           ├── pages/        # Calendar, Bookings, Billing, ...
│           └── context/      # Auth context
├── docker/
│   ├── docker-compose.yml
│   └── keycloak/             # Realm import
└── docs/                     # Technický design
```

## Klíčové funkce

- **Multi-salon** – jedna organizace, více poboček
- **Guest booking** – rezervace bez registrace (email + token link)
- **Double-booking prevention** – PostgreSQL exclusion constraint + SERIALIZABLE transakce
- **RBAC** – Keycloak role (org_owner, salon_manager, staff, accountant, customer)
- **Billing** – doklady, platby (hotově/kartou), export CSV/XLSX
- **Audit log** – kdo, kdy, co změnil
- **GDPR** – auto-expiry guest dat, minimalizace PII
- **Notifikace** – e-mail potvrzení + denní remindery (cron)

## API Endpointy (přehled)

### Public (Customer/Guest)
- `GET /salons/slug/:slug` – detail salonu
- `GET /services/by-salon/:id` – služby salonu
- `GET /staff/by-salon/:id` – specialistky
- `GET /availability/slots` – volné termíny
- `POST /bookings` – vytvořit rezervaci (auth)
- `POST /bookings/guest` – guest rezervace
- `GET /bookings/guest/:token` – guest detail
- `PUT /bookings/guest/:token/cancel` – guest storno

### Staff
- `GET /bookings/salon/:id` – rezervace salonu
- `PUT /bookings/:id/complete` – dokončit
- `PUT /bookings/:id/no-show` – no-show
- `POST /billing/invoices` – vystavit doklad
- `POST /billing/payments` – zaznamenat platbu
- `GET /billing/export/:orgId` – export CSV/XLSX

### Admin
- `POST /organizations` – vytvořit organizaci
- `POST /salons` – vytvořit salon
- `POST /staff` – přidat zaměstnance
- `POST /staff/assign` – přiřadit k salonu
