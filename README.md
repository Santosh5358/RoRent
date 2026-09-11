# Room Rent & Electricity Management System

A full-stack application for landlords to manage properties, rooms, tenants, rent,
and electricity billing with meter-image OCR, PDF receipts, reports, and role-based auth.

- **Backend:** Spring Boot 3.3.4 · Java 17 · Maven · SQLite (zero-setup) · JWT security
- **Frontend:** Angular 18.2 (standalone components + signals) · Tailwind CSS

## Prerequisites

- **JDK 17** (backend Maven build targets Java 17)
- **Maven 3.9+**
- **Node.js 18+** and npm (frontend)

## Running the backend

```powershell
cd backend
# Ensure Maven uses JDK 17
$env:JAVA_HOME="C:\Program Files\Java\jdk-17"
mvn spring-boot:run
```

- Starts on **http://localhost:8081** (override with `SERVER_PORT`).
- Creates and seeds a SQLite database file `roomrent.db` on first run.
- Uploaded meter images are stored under `backend/uploads/`.

## Running the frontend

```powershell
cd frontend
npm install
npm start
```

- Serves on **http://localhost:4400**.
- `proxy.conf.json` forwards `/api` and `/uploads` to the backend on port 8081.

## Demo login

| Email                    | Password      | Role  |
|--------------------------|---------------|-------|
| admin@roomrent.local     | password123   | OWNER |

Seeded data includes "Shanti Apartment" with 4 rooms, 3 tenants, meter readings,
bills (one PAID, one PARTIALLY_PAID), and payments.

## Key features

- Properties / Rooms / Tenants CRUD with room assignment history
- Electricity rate configuration (property/room scoped, with rate history)
- Meter reading workflow: upload image → OCR detect → confirm/edit → save
  - `Units = Current − Previous`, `Charge = Units × Rate`
  - Meter reset/replacement handling and lower-reading warnings
- Bill generation: `Total = Rent + Electricity + Other − Discount`
  - No duplicate bill per tenant/room/month unless regenerated
  - Historical bills snapshot the rate and never change when rates change later
- Payments with partial-payment support and automatic bill status
- Dashboard with summary cards, recent activity, and notifications
- Reports with CSV export; PDF receipts per bill
- Amounts formatted in INR (₹, en-IN)

## OCR

A pluggable `OcrService` is used. The default `MockOcrService` derives a plausible
reading from the uploaded image. To use a real OCR provider, implement `OcrService`
and mark it `@Primary`.
