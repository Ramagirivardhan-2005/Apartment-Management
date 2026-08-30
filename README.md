# 🏢 Enterprise Apartment Management System (RBAC Suite)

A modern, full-stack, secure, role-based **Apartment Management System** built with **React (Vite + Tailwind CSS)** and **Node.js (Express + MongoDB + Mongoose + JWT + Cloudinary + Nodemailer + Razorpay)**.

---

## 🌟 5 Primary Roles & Credentials

All demo accounts come pre-configured with the default password: `Password123!`

| Role | Demo Email | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `superadmin@apartment.com` | `Password123!` | Global Complex System Overview, Block CRUD, Block Admin Assignment, System Inventory, Global Parking, Audit Trail & Financial Reports |
| **Block A Admin** | `blockadmin.a@apartment.com` | `Password123!` | Block A Rooms & Residents, Overdue Dashboard (Orange/Red/Dark Red), Block Parking, Maintenance Tickets, Notices, Block Revenue |
| **Block B Admin** | `blockadmin.b@apartment.com` | `Password123!` | Block B Isolated Administration |
| **Block C Admin** | `blockadmin.c@apartment.com` | `Password123!` | Block C Isolated Administration |
| **Receptionist** | `receptionist@apartment.com` | `Password123!` | Resident Mobile Search/Registration, 8-Step Room Booking Wizard (Max 4 Rooms, 60%/4mo Advance Rule), Parking Allocation, Payments & Receipts, Visitor Passes |
| **User / Resident (3d Overdue - Orange)** | `resident1@apartment.com` | `Password123!` | Resident Portal, Room & Parking Details, Online Rent Payment, Parking Complaint Submission, Status Tracking, Receipts Download |
| **User / Resident (13d Overdue - Red)** | `resident2@apartment.com` | `Password123!` | Overdue Red Tier (>10d overdue) account with automatic late fees |
| **User / Resident (35d Overdue - Dark Red)** | `resident3@apartment.com` | `Password123!` | Critical Overdue Tier account with automated escalation |
| **User / Resident (Paid)** | `resident4@apartment.com` | `Password123!` | Clean resident account with active parking slot & zero dues |
| **Security Desk** | `security@apartment.com` | `Password123!` | Visitor Check-In (Status: Inside), Visitor Check-Out (Duration Calculation), Resident Movements, Privacy-Restricted Resident Directory Lookup |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB Atlas** or Local MongoDB (configure in `backend/.env`)

### 2. Backend Setup
```bash
cd backend
cp .env.example .env   # Configure your environment variables in .env
npm install
npm run seed           # Optional: Seeds demo blocks, rooms, parking, accounts, dues & visitors
npm start              # Starts server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev            # Starts Vite client on http://localhost:5173
```

---

## 🔑 Core Features & Business Logic Implemented

1. **Strict Role-Based Access Control (RBAC)**:
   - Super Admin $\to$ Block Admins $\to$ Receptionist, Rooms, Parking, Residents.
   - Block isolation: Block Admins are strictly scoped to their assigned block.
   - Security Desk: Privacy-restricted resident lookup (no financial or ID proof data exposed).

2. **Automated Overdue Payment Color Engine & Late Fees**:
   - **1–10 Days Overdue**: **ORANGE** ($\text{Late Fee: } \min(500, \text{days} \times 50)$)
   - **>10 Days Overdue**: **RED** ($\text{Late Fee: } 500 + (\text{days} - 10) \times 75$)
   - **>30 Days Overdue (Critical)**: **DARK RED** ($\text{Late Fee: } 2000 + (\text{days} - 30) \times 100$)
   - Automatic cron job recalculation and reminder notifications.

3. **8-Step Interactive Room Booking Wizard**:
   - Step 1: Resident Search / Quick Lookup by Mobile
   - Step 2: Stay Duration & Room Preferences
   - Step 3: Occupants Information
   - Step 4: Identity Documents Verification
   - Step 5: Room Selection (**Max 4 Rooms Enforcement** with alert preventing 5th room selection)
   - Step 6: Advance Payment Calculation (**60% for $\le 6$ months**, **4 months' advance rent for $>6$ months**)
   - Step 7: Parking Bay Requirement & Vehicle Details
   - Step 8: Confirmation, Account Activation, & Printable Stamped Receipt

4. **Production Error Handling & Structured Logging**:
   - Central Express error handler logging full stack traces in server console while returning sanitized generic responses (`"Something went wrong. Please try again later."`) to clients.
   - Automatic redaction of sensitive credentials, passwords, tokens, OTPs, and card information.
   - React ErrorBoundary for frontend exception catching.
