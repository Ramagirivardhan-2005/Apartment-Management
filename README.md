# 🏢 Enterprise Apartment Management System (RBAC Suite)

A production-ready, full-stack, enterprise-grade **Apartment Management System** designed to automate and digitize residential community operations. The platform delivers role-based access control (RBAC), multi-block isolation, automated room booking with dynamic advance rules, automated late fee and overdue tracking engines, cryptographic two-factor authentication, Razorpay payment processing, visitor gate security, and maintenance ticket tracking.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Roles](#3-system-roles)
4. [Complete System Workflow](#4-complete-system-workflow)
5. [System Flow](#5-system-flow)
6. [System Architecture](#6-system-architecture)
7. [Complete API Documentation](#7-complete-api-documentation)
8. [API Request/Response Flow](#8-api-requestresponse-flow)
9. [Authentication & Security](#9-authentication--security)
10. [Database Architecture](#10-database-architecture)
11. [Redis & Caching Architecture](#11-redis--caching-architecture)
12. [Payment Architecture](#12-payment-architecture)
13. [Email System](#13-email-system)
14. [Shop & Service Provider System](#14-shop--service-provider-system)
15. [Frontend Architecture](#15-frontend-architecture)
16. [Backend Architecture](#16-backend-architecture)
17. [Error Handling & Structured Logging](#17-error-handling--structured-logging)
18. [Deployment Guide](#18-deployment-guide)
19. [Environment Variables](#19-environment-variables)
20. [Project Structure](#20-project-structure)
21. [Installation & Local Setup](#21-installation--local-setup)
22. [API Examples (cURL)](#22-api-examples-curl)
23. [UI Showcase & Dashboards](#23-ui-showcase--dashboards)
24. [Future Enhancements](#24-future-enhancements)
25. [Contributors & Author](#25-contributors--author)

---

# 1. Project Overview

### 🏷️ Project Name
**Enterprise Apartment Management System (RBAC Suite)**

### 📖 Detailed Description
The Apartment Management System provides an all-in-one residential community ERP platform that connects **Super Administrators, Block Administrators, Front Desk Receptionists, Residents, and Security Personnel**. The system replaces disjointed spreadsheets, paper visitor logs, and manual payment tracking with a secure, automated digital workflow.

### 🎯 Purpose of the System
To provide a unified, multi-tenant digital hub that automates apartment allocations, recurring rent collections, visitor gate passes, complaint resolution, and administrative audits across complex multi-block residential towers.

### 🛑 Problems It Solves
- **Manual Spreadsheet Inefficiencies:** Eliminates manual record-keeping for room inventory, tenant verification, and vehicle parking allocations.
- **Overdue Rent Leakage:** Automates late fee computations across color-coded overdue tiers (Orange, Red, Dark Red) with automated daily cron recalculations.
- **Front Desk Bottlenecks:** Provides an 8-step booking wizard enforcing business constraints (e.g. maximum 4 rooms per resident, 60% vs. 4 months' advance rent calculation).
- **Gate Security Blind Spots:** Replaces manual registers with a digital check-in/out engine that logs visitor details, vehicles, and stay durations while strictly masking resident private data.
- **Lack of Auditing:** Maintains an immutable audit trail (`AuditLog`) capturing all administrative actions with IP addresses, user agents, and entity snapshots.

### 🌟 Key Highlights
- **Zero-Data First Run Detection:** Auto-detects empty database state and routes the initial user to create the root Super Admin (`ROOT-001`).
- **Cryptographic 2FA Authentication:** All authentication OTPs are SHA-256 hashed and verified using constant-time comparisons (`crypto.timingSafeEqual`).
- **Seamless Staff Onboarding:** New Admins and Receptionists verify via email OTP and proceed directly to portal activation without mandatory password creation.
- **Razorpay Integration:** Full order creation, client checkout modal, and HMAC-SHA256 signature verification with automated receipt generation (`RCP-YYYY-XXXXXX`).
- **Production Error Masking:** Central error handler logs detailed stack traces internally while returning user-safe responses (`"Something went wrong. Please try again later."`).

---

# 2. Technology Stack

### 💻 Frontend
| Technology / Library | Version | Purpose in Application |
|---|---|---|
| **React** | `^18.3.1` | Core UI framework for component-based reactive dashboard interfaces. |
| **Vite** | `^6.4.3` | High-performance build tool, dev server, and production bundler. |
| **Tailwind CSS** | `^3.4.1` | Utility-first styling framework for responsive dark-themed UI components. |
| **Lucide React** | `^0.344.0` | Comprehensive iconography set for navigation, status badges, and actions. |
| **Axios** | `^1.6.7` | HTTP client with centralized interceptors for JWT authorization headers and error handling. |
| **React Router DOM** | `^6.22.3` | Client-side routing, protected routes, and role-based redirect guards. |
| **Canvas Confetti** | `^1.9.4` | Visual celebration effects upon booking and payment completion. |
| **HTML2Canvas & DOMPurify** | `^1.4.1` / `^3.2.4` | Stamped payment receipt export and XSS sanitization. |

### ⚙️ Backend
| Technology / Library | Version | Purpose in Application |
|---|---|---|
| **Node.js** | `v18+` / `v20+` | Server-side JavaScript runtime environment. |
| **Express.js** | `^4.18.3` | RESTful API server framework with modular routing and middleware chaining. |
| **Mongoose** | `^8.2.1` | MongoDB Object Data Modeling (ODM) library for schema validation, hooks, and queries. |
| **JSON Web Token (jsonwebtoken)** | `^9.0.2` | Stateless authentication tokens signed with HMAC-SHA256 and 7-day expiration. |
| **bcryptjs** | `^2.4.3` | One-way password hashing using 10 cryptographic salt rounds. |
| **Razorpay SDK** | `^2.9.2` | Official payment gateway integration for order creation and verification. |
| **Nodemailer** | `^6.9.10` | SMTP email client for transactional notifications, OTPs, and welcome emails. |
| **Cloudinary** | `^2.0.3` | Cloud image and document storage for tenant identity proofs and attachments. |
| **Multer** | `^1.4.5-lts.1` | Multipart form-data middleware for handling file uploads. |
| **Node-Cron** | `^3.0.3` | Background task scheduling for automated daily overdue calculations and due reminders. |
| **Helmet** | `^7.1.0` | Security headers middleware for HTTP request protection. |
| **Express Rate Limit** | `^7.1.5` | IP-based request rate limiting (500 requests per 15 minutes). |
| **Morgan** | `^1.10.0` | HTTP request logger for development debugging. |
| **Dotenv** | `^16.4.5` | Environment variable management across local and production environments. |

---

# 3. System Roles

The system implements **5 core operational roles** with strict Role-Based Access Control (RBAC):

```mermaid
graph TD
    SA[Super Admin] -->|Manages| BA[Block Admin]
    BA -->|Manages| REC[Receptionist]
    BA -->|Manages| RES[Resident]
    BA -->|Oversees| SEC[Security Desk]
    REC -->|Books / Allocates| RES
    SEC -->|Logs Movements / Visitors| RES
```

| Role | Purpose | Key Permissions | Restrictions |
|---|---|---|---|
| **Super Admin** (`super_admin`) | System Owner & Global Controller | Global Block CRUD, Block Admin CRUD, Global Room & Parking oversight, Audit logs, Financial revenue reports. | Cannot be deleted if sole Super Admin. |
| **Block Admin** (`block_admin`) | Manager of a Specific Block Tower | Receptionist management (max 2/block), Room inventory CRUD within block, Parking allocation within block, Complaints resolution, Notice broadcasting, Overdue revenue dashboard. | Scoped strictly to assigned block (`assignedBlock`). Cannot view or modify data of other blocks. |
| **Receptionist** (`receptionist`) | Front Desk Operations & Onboarding | Resident registration, 8-Step Room Booking Wizard, Manual cash/bank payment recording, Stamped receipt generation, Visitor check-in/out. | Cannot create blocks, modify base rent rules, or access system audit logs. |
| **Resident** (`resident`) | Apartment Tenant / Owner | View room allocation, Browse & book available rooms, Request parking slots, Pay rent/dues online via Razorpay, Submit maintenance complaints, Download PDF receipts. | Read-only access to own allocations, dues, and notices. Cannot view other residents' details. |
| **Security Desk** (`security`) | Gatekeeper & Visitor Security | Visitor check-in (with vehicle & purpose), Visitor check-out (duration calculation), Resident movement logging (In/Out), Restricted resident directory lookup. | Strictly masked view: cannot view resident financial data, ID proofs, or contact credentials. |

---

# 4. Complete System Workflow

```mermaid
sequenceDiagram
    autonumber
    actor SA as Super Admin
    actor BA as Block Admin
    actor REC as Receptionist
    actor RES as Resident
    participant API as Backend API
    participant DB as MongoDB Atlas
    participant RZP as Razorpay

    SA->>API: 1. Setup Root Admin (First Run)
    API->>DB: Initialize ROOT-001 Super Admin
    SA->>API: 2. Create Block & Block Admin
    API->>DB: Create Block Admin (pending_verification)
    API-->>BA: Send Verification Email with 6-Digit OTP
    BA->>API: 3. Submit OTP to /api/auth/verify-otp
    API->>DB: Activate Account (isEmailVerified=true)
    API-->>BA: Issue JWT Token & Route to Dashboard
    BA->>API: 4. Create Receptionist
    API-->>REC: Send Verification Email with OTP
    REC->>API: 5. Verify OTP & Activate Account
    REC->>API: 6. Run 8-Step Booking Wizard for Resident
    API->>RZP: 7. Create Advance Payment Order
    RZP-->>RES: 8. Checkout Modal & Pay
    RES->>API: 9. Verify Razorpay Signature
    API->>DB: 10. Allocate Room, Parking & Mark Active
```

### Detailed Flow Descriptions:
1. **First-Time Super Admin Setup:** When `superAdminCount === 0`, `GET /api/auth/setup-status` returns `setupRequired: true`, guiding the operator to `/setup` to initialize `ROOT-001`.
2. **Staff Onboarding Without Password Creation:** Newly created Block Admins and Receptionists are registered in `pending_verification` status with `mustChangePassword = false`. They verify via a 6-digit email OTP (or 1-click email link) and are immediately authenticated and routed to portal operations without forced password setup.
3. **8-Step Room Booking Wizard:**
   - *Step 1 (Lookup):* Search resident by mobile/email or register a new profile.
   - *Step 2 (Duration):* Select stay dates and duration in months.
   - *Step 3 (Occupants):* Enter primary tenant and co-occupant information.
   - *Step 4 (KYC Documents):* Upload identity proofs (Aadhaar, Passport, etc.).
   - *Step 5 (Room Selection):* Select up to **maximum 4 rooms** with real-time availability filters.
   - *Step 6 (Advance Calculation):* Computes **60% advance rent for $\le 6$ months** or **4 months' advance rent for $>6$ months**.
   - *Step 7 (Parking Bay):* Optional allocation of standard or 4-wheeler parking slot.
   - *Step 8 (Confirmation & Receipt):* Generates stamped printable PDF receipt (`RCP-YYYY-XXXXXX`).
4. **Automated Overdue Tier Calculation Engine:** Daily midnight cron job evaluates all open dues:
   - **1–10 Days Overdue:** **ORANGE** ($\text{Late Fee: } \min(500, \text{days} \times 50)$)
   - **>10 Days Overdue:** **RED** ($\text{Late Fee: } 500 + (\text{days} - 10) \times 75$)
   - **>30 Days Overdue (Critical):** **DARK RED** ($\text{Late Fee: } 2000 + (\text{days} - 30) \times 100$)
5. **Visitor Gate Management:** Security desk checks in visitors with host flat details, visitor vehicle numbers, and captures entry timestamps. Upon departure, checkout computes the exact stay duration.

---

# 5. System Flow

```text
                               ┌─────────────────────────┐
                               │       Client User       │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │  React Frontend (Vite)  │
                               └────────────┬────────────┘
                                            │ HTTP / HTTPS (Axios)
                                            ▼
                               ┌─────────────────────────┐
                               │ Express Request Context │
                               │  (Generate RequestId)   │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │   Security Middleware   │
                               │ (Helmet, CORS, RateLim) │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │ Authentication & RBAC   │
                               │ (JWT + Block Scoping)   │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │   Modular Controllers   │
                               └──────┬────────────┬─────┘
                                      │            │
                         ┌────────────┘            └────────────┐
                         ▼                                      ▼
             ┌───────────────────────┐              ┌───────────────────────┐
             │  Business Services    │              │  External Services    │
             │  - Notification Engine│              │  - Razorpay Gateway   │
             │  - Overdue Cron Engine│              │  - Nodemailer SMTP    │
             │  - Audit Logger       │              │  - Cloudinary Storage │
             └───────────┬───────────┘              └───────────────────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │  Mongoose ODM Layer   │
             └───────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │  MongoDB Atlas Cluster│
             └───────────────────────┘
```

---

# 6. System Architecture

```mermaid
graph TB
    subgraph ClientLayer ["Client Layer (Frontend)"]
        UI[React 18 + Vite SPA]
        Tailwind[Tailwind CSS Dark Theme]
        AuthCtx[AuthContext & JWT Store]
        NotifCtx[NotificationContext]
    end

    subgraph APILayer ["API & Middleware Layer"]
        ReqCtx[RequestContext: X-Request-Id]
        RateLim[Express Rate Limiter: 500r/15m]
        SecMW[Helmet & CORS Middleware]
        JWTMiddleware[Protect: JWT Bearer Verification]
        RBACMiddleware[Authorize: Role-Based Access Guard]
        BlockGuard[checkBlockAccess: Assigned Block Guard]
    end

    subgraph ControllerLayer ["Modular Controllers"]
        AuthCtrl[authController]
        UserCtrl[userController]
        BlockCtrl[blockController]
        RoomCtrl[roomController]
        BookCtrl[bookingController]
        PayCtrl[paymentController]
        ParkCtrl[parkingController]
        SecCtrl[securityController]
        VisitCtrl[visitorController]
        CompCtrl[complaintController]
        AuditCtrl[auditController]
    end

    subgraph ServiceLayer ["Engines & Services"]
        CronSvc[Cron Service: Daily Overdue & Reminders]
        NotifSvc[Notification & Email Service]
        AuditSvc[Audit Logging Service]
        PaySvc[Razorpay Payment Service]
    end

    subgraph DataLayer ["Data & External Providers"]
        Mongo[(MongoDB Atlas Database)]
        Cloudinary[(Cloudinary File Store)]
        SMTP[Gmail / SMTP Mailer]
        RazorpayGateway[Razorpay Payment Gateway]
    end

    UI --> ReqCtx
    ReqCtx --> RateLim
    RateLim --> SecMW
    SecMW --> JWTMiddleware
    JWTMiddleware --> RBACMiddleware
    RBACMiddleware --> BlockGuard
    BlockGuard --> ControllerLayer
    ControllerLayer --> ServiceLayer
    ServiceLayer --> Mongo
    ServiceLayer --> Cloudinary
    ServiceLayer --> SMTP
    ServiceLayer --> RazorpayGateway
```

---

# 7. Complete API Documentation

### 🔐 Authentication & Identity APIs (`/api/auth`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `GET` | `/setup-status` | Public | Checks if system requires initial root Super Admin creation. |
| `POST` | `/initial-setup` | Public (First run) | Creates root Super Admin account (`ROOT-001`). |
| `POST` | `/login` | Public | Step 1 login: verifies credentials and dispatches 6-digit 2FA email OTP. |
| `POST` | `/verify-login-otp` | Public | Step 2 login: validates login OTP and returns JWT token + user profile. |
| `POST` | `/resend-login-otp` | Public | Resends 6-digit login 2FA OTP with 60s cooldown. |
| `POST` | `/register` | Public | Self-registration for residents with automatic email OTP generation. |
| `POST` | `/verify-otp` | Public | Verifies account OTP and issues JWT session without forced password creation. |
| `POST` | `/activate-account` | Public | 1-click email activation link handler. |
| `POST` | `/resend-otp` | Public | Resends account activation OTP. |
| `POST` | `/setup-password` | Public | Optional password setup for verified accounts. |
| `POST` | `/forgot-password` | Public | Dispatches password reset 6-digit OTP to registered email. |
| `POST` | `/verify-reset-otp` | Public | Validates password reset OTP and issues reset token. |
| `POST` | `/reset-password-otp`| Public | Resets user password using verified reset token. |
| `GET` | `/me` | Authenticated | Fetches current user profile and role details. |
| `PUT` | `/profile` | Authenticated | Updates current user's profile details. |
| `POST` | `/change-password` | Authenticated | Changes user password using current password verification. |
| `POST` | `/force-change-password`| Authenticated | Handles mandatory password change when `mustChangePassword = true`. |

### 🏢 Block Management APIs (`/api/blocks`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | Retrieves list of all active blocks (scoped for Block Admins). |
| `GET` | `/:id` | Authenticated | Retrieves detailed block profile by ID. |
| `POST` | `/` | `super_admin` | Creates a new block with total floors, rooms, and parking slots. |
| `PUT` | `/:id` | `super_admin` | Updates block metadata and assigned block admin. |
| `DELETE` | `/:id` | `super_admin` | Soft deletes block. |

### 🛏️ Room & Allocation APIs (`/api/rooms`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `GET` | `/available` | Public / Authenticated| Retrieves only rooms currently available for booking. |
| `GET` | `/` | Authenticated | Lists all rooms with filtering by block, type, and status. |
| `GET` | `/:id` | Authenticated | Retrieves room details by ID. |
| `POST` | `/` | `super_admin`, `block_admin` | Creates a new room under a specific block. |
| `PUT` | `/:id` | `super_admin`, `block_admin` | Updates room rent, capacity, amenities, or status. |
| `POST` | `/:id/allocate` | `super_admin`, `block_admin`, `receptionist` | Manually allocates room to resident. |
| `DELETE` | `/:id` | `super_admin`, `block_admin` | Soft deletes room from inventory. |

### 👥 User & Staff Management APIs (`/api/users`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | Lists users with role and status filtering. |
| `POST` | `/` | `super_admin`, `block_admin`, `receptionist` | Front desk resident registration. |
| `GET` | `/search` | Authenticated | Searches users by name, mobile, email, or registration ID. |
| `GET` | `/block-admins` | `super_admin` | Lists all Block Administrators with assigned blocks. |
| `POST` | `/block-admin` | `super_admin` | Creates Block Admin and dispatches verification OTP email. |
| `POST` | `/block-admin/:id/resend-otp` | `super_admin` | Resends verification OTP to Block Admin. |
| `PUT` | `/block-admin/:id/email` | `super_admin` | Updates Block Admin email and resends verification OTP. |
| `POST` | `/resident` | `super_admin`, `block_admin`, `receptionist` | Registers resident profile. |
| `GET` | `/:id` | Authenticated | Fetches user profile by ID. |
| `POST` | `/:id/verify-document` | `super_admin`, `block_admin` | Marks resident KYC identity document as verified. |

### 📅 Booking & Queue APIs (`/api/bookings`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `POST` | `/` | Authenticated | Creates room booking (enforcing max 4 rooms limit). |
| `GET` | `/` | Authenticated | Retrieves resident bookings or block booking list. |
| `POST` | `/queue` | Authenticated | Joins booking queue for fully occupied room types. |
| `GET` | `/queue` | Authenticated | Retrieves booking queue position. |
| `GET` | `/:id` | Authenticated | Retrieves booking details by ID. |

### 💳 Payment & Dues APIs (`/api/payments`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `POST` | `/razorpay/create-order` | Authenticated | Generates Razorpay order for room advance or due payment. |
| `POST` | `/razorpay/verify-payment` | Authenticated | Validates HMAC-SHA256 Razorpay signature and confirms booking. |
| `POST` | `/manual` | `super_admin`, `block_admin`, `receptionist` | Records cash/cheque/bank payment and generates stamped receipt. |
| `POST` | `/` | Authenticated | Processes resident direct payment. |
| `GET` | `/revenue` | `super_admin`, `block_admin`, `receptionist` | Aggregated revenue metrics and collection statistics. |
| `GET` | `/overdue-dashboard` | `super_admin`, `block_admin`, `receptionist` | Color-coded overdue dashboard (Orange/Red/Dark Red tiers). |
| `GET` | `/` | Authenticated | Lists payments with pagination and status filters. |
| `GET` | `/:id` | Authenticated | Retrieves payment and invoice details by ID. |

### 🚗 Parking Management APIs (`/api/parking`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | Lists parking slots with availability status. |
| `POST` | `/` | `super_admin`, `block_admin` | Adds new parking slot to block. |
| `PUT` | `/:id` | `super_admin`, `block_admin` | Updates parking slot status or vehicle type. |
| `POST` | `/:id/allocate` | `super_admin`, `block_admin`, `receptionist` | Allocates parking slot to resident. |
| `DELETE` | `/:id` | `super_admin`, `block_admin` | Deletes parking slot. |

### 🛎️ Receptionist Management APIs (`/api/receptionists`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `GET` | `/` | `super_admin`, `block_admin` | Lists receptionists (max 2 per block enforced). |
| `POST` | `/` | `super_admin`, `block_admin` | Creates receptionist and dispatches verification OTP email. |
| `DELETE` | `/:id` | `super_admin`, `block_admin` | Deactivates or removes receptionist. |

### 🚪 Visitor & Gate APIs (`/api/visitors`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | Lists visitors with date and status filters. |
| `POST` | `/` | `super_admin`, `block_admin`, `receptionist`, `security`, `resident` | Checks in visitor with vehicle and host flat details. |
| `POST` | `/:id/check-out`| `super_admin`, `block_admin`, `receptionist`, `security` | Checks out visitor and records stay duration. |

### 🛡️ Security Desk APIs (`/api/security`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `GET` | `/lookup-resident` | `super_admin`, `block_admin`, `receptionist`, `security` | Privacy-masked resident lookup (name, room, vehicle only). |
| `POST` | `/resident-movement` | `super_admin`, `block_admin`, `security` | Logs resident entry/exit gate movements. |
| `GET` | `/logs` | `super_admin`, `block_admin`, `security` | Retrieves gate security event logs. |
| `GET` | `/stats` | `super_admin`, `block_admin`, `security` | Gate statistics (visitors inside, movements count). |

### 📝 Complaint & Ticket APIs (`/api/complaints`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `POST` | `/` | Authenticated | Submits maintenance or parking complaint. |
| `GET` | `/` | Authenticated | Lists complaints (scoped to resident or block). |
| `GET` | `/:id` | Authenticated | Retrieves complaint details and resolution history. |
| `PUT` | `/:id/status` | `super_admin`, `block_admin` | Updates ticket status (`pending`, `in_progress`, `resolved`). |

### 📢 Announcements & Notice APIs (`/api/announcements`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | Retrieves active announcements for user's block. |
| `POST` | `/` | `super_admin`, `block_admin` | Publishes new complex or block announcement. |
| `DELETE` | `/:id` | `super_admin`, `block_admin` | Removes announcement. |

### 🔔 Notification APIs (`/api/notifications`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | Retrieves notifications for logged-in user. |
| `PUT` | `/mark-all-read` | Authenticated | Marks all unread notifications as read. |
| `PUT` | `/:id/read` | Authenticated | Marks single notification as read. |

### 📊 Report, Audit & Health APIs (`/api/reports`, `/api/audit`, `/api/health`)
| Method | Endpoint | Authorized Roles | Description |
|---|---|---|---|
| `GET` | `/api/reports/system-overview` | `super_admin`, `block_admin`, `receptionist` | Aggregated executive KPIs (occupancy, dues, revenue). |
| `GET` | `/api/reports/audit-logs` | `super_admin` | System audit trail viewer. |
| `GET` | `/api/audit` | `super_admin`, `block_admin` | Accesses immutable audit trail entries. |
| `GET` | `/api/health` | Public | System health check (database state & uptime). |

---

# 8. API Request/Response Flow

Every inbound HTTP request travels through the following validated pipeline:

```text
1. Client HTTP Request (with optional Authorization: Bearer <token>)
   ↓
2. RequestContext Middleware: Generates unique crypto UUID (req.id) & sets X-Request-Id header.
   ↓
3. Security Headers & Rate Limiting: Helmet sanitizes headers; RateLimiter enforces 500 req/15 min limit.
   ↓
4. Route Match: Directs request to modular route file (e.g. /api/payments).
   ↓
5. Authentication Middleware (protect): Verifies JWT signature & attaches user from MongoDB.
   ↓
6. Authorization Middleware (authorize / checkBlockAccess): Verifies role & block scope.
   ↓
7. Controller / Service: Executes business logic, Mongoose operations, external APIs (Razorpay/SMTP).
   ↓
8. Central Error Handler (errorHandler): Catches exceptions, sanitizes sensitive data, logs stack traces in console, returns safe JSON.
   ↓
9. Client Response: Structured JSON payload with correlation requestId.
```

---

# 9. Authentication & Security

- **JSON Web Tokens (JWT):** Signed using HMAC-SHA256 with 7-day expiration (`JWT_EXPIRES_IN=7d`).
- **Cryptographic OTP Hashing:** All one-time passcodes (`loginOtpHash`, `emailOtpHash`, `resetPasswordOtpHash`) are stored as **SHA-256 hashes**. Comparison is performed with `crypto.timingSafeEqual` to prevent timing attacks.
- **Password Protection:** Passwords are never stored in plaintext and are hashed using **bcryptjs** with 10 salt rounds.
- **Resource Scoping & Block Isolation:** Block Admins are strictly scoped to `req.user.assignedBlock` via `checkBlockAccess` middleware.
- **Sensitive Data Redaction:** Central logging utility (`logger.js`) automatically masks credit cards, CVVs, passwords, JWT tokens, and OTP codes before logging.

---

# 10. Database Architecture

The system uses **MongoDB Atlas** with **16 specialized Mongoose collections**:

```mermaid
erDiagram
    User ||--o{ Block : "manages (Block Admin)"
    Block ||--o{ Room : contains
    Block ||--o{ ParkingSlot : contains
    Room ||--o{ RoomAllocation : allocates
    User ||--o{ RoomAllocation : occupies
    User ||--o{ Booking : requests
    User ||--o{ Due : owes
    User ||--o{ Payment : makes
    User ||--o{ Complaint : submits
    User ||--o{ Notification : receives
    User ||--o{ AuditLog : triggers
    Visitor }o--|| Block : visits
```

### Key Collections & Indexes:
- `users`: Indexed on `email`, `mobile`, `employeeId`, `registrationId`, `role`.
- `payments`: Indexed on `receiptNumber` (unique), `paymentId` (sparse/unique), `razorpayOrderId`.
- `rooms`: Indexed on `roomNumber`, `blockId`, `status`.
- `dues`: Indexed on `resident`, `status`, `dueDate`, `overdueTier`.
- `auditlogs`: Indexed on `timestamp`, `performedBy`, `entityType`.

---

# 11. Redis & Caching Architecture

### Current Implementation:
- High-efficiency in-memory query indexing and Mongoose projection caching are utilized across all hot API routes.
- Real-time MongoDB compound indexes prevent redundant roundtrips for room availability and overdue dashboards.

### Redis Production Integration (Roadmap):
- **Session Cache:** Caching active JWT blacklists upon logout.
- **Room Lock Cache:** Redis distributed locks (`SET key val NX EX 300`) during multi-user simultaneous room booking checkout.

---

# 12. Payment Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Resident
    participant Frontend as React Client
    participant Backend as Express API
    participant Razorpay as Razorpay Gateway
    participant DB as MongoDB Atlas

    Resident->>Frontend: Select Room & Duration (Wizard)
    Frontend->>Backend: POST /api/payments/razorpay/create-order
    Backend->>Razorpay: razorpay.orders.create({ amount, currency: "INR" })
    Razorpay-->>Backend: Return order_id
    Backend-->>Frontend: Send order_id, key_id, amount
    Frontend->>Razorpay: Open Razorpay Checkout Modal
    Resident->>Razorpay: Complete Payment (Card/UPI/Netbanking)
    Razorpay-->>Frontend: Return payment_id & signature
    Frontend->>Backend: POST /api/payments/razorpay/verify-payment
    Backend->>Backend: Compute HMAC-SHA256 signature
    Backend->>DB: Record Payment (RCP-YYYY-XXXXXX) & Allocate Room
    Backend-->>Frontend: Payment Verified & Stamped Receipt
```

### Key Payment Controls:
- **Signature Integrity:** Verified using `crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)`.
- **Unique Stamped Receipts:** Formatted as `RCP-YYYY-XXXXXX` using cryptographic entropy.
- **Idempotency & Conflict Guard:** Unique sparse database indexing on `paymentId` prevents duplicate execution on network retry.

---

# 13. Email System

- **Protocol:** SMTP via **Nodemailer** (supports Gmail App Passwords and custom SMTP relays).
- **Security:** Zero plaintext OTPs in email logs.
- **Responsive HTML Templates:**
  - `adminOtpVerification`: Block Admin verification button & 6-digit OTP.
  - `receptionistOtpVerification`: Receptionist verification button & 6-digit OTP.
  - `userRegistrationEmail`: Resident registration welcome & OTP.
  - `loginOtp`: Two-Factor authentication OTP.
  - `forgotPasswordOtp`: Password recovery OTP.
  - `overdueWarning`: Automated late fee escalation notice.

---

# 14. Shop & Service Provider System

- **Modular Architecture:** The system structure is engineered to allow seamless integration of commercial community services (e.g. laundry, on-site grocery, maintenance contracts).
- **Extension Hooks:** Ready data models and controller hooks exist for extending service catalogs and vendor invoicing.

---

# 15. Frontend Architecture

```text
frontend/src/
├── api/
│   └── client.js             # Centralized Axios client with JWT interceptors
├── components/
│   ├── common/
│   │   ├── DemoRoleBar.jsx   # 1-Click interactive role switching toolbar
│   │   ├── ErrorBoundary.jsx # React exception boundary
│   │   ├── ProtectedRoute.jsx# Role-based route guard
│   │   ├── RazorpayModal.jsx # Razorpay checkout dialog
│   │   ├── ReceiptModal.jsx  # Printable stamped receipt modal
│   │   └── StatusBadge.jsx   # Overdue tier & status badge component
│   └── layout/
│       ├── AppLayout.jsx     # Master layout container
│       ├── Navbar.jsx        # Top navigation with live notifications
│       └── Sidebar.jsx       # Dynamic role-based navigation sidebar
├── context/
│   ├── AuthContext.jsx       # Global auth state & JWT token manager
│   └── NotificationContext.jsx# Live notification polling & unread counters
├── pages/
│   ├── auth/                 # Login, Register, VerifyOtp, Setup, ForgotPassword
│   ├── super-admin/          # Blocks, Block Admins, System Reports, Audit Logs
│   ├── block-admin/          # Rooms, Receptionists, Overdue Payments, Complaints
│   ├── receptionist/         # 8-Step Booking Wizard, Payments, Visitors, Rooms
│   ├── resident/             # Room Details, Online Rent, Complaints, Profile
│   └── security/             # Gate Visitor In/Out, Resident Directory Lookup
├── App.jsx                   # Master client-side routing table
├── main.jsx                  # React DOM root entry point
└── index.css                 # Tailwind CSS styles & animations
```

---

# 16. Backend Architecture

```text
backend/src/
├── config/
│   ├── db.js                 # Resilient MongoDB Atlas connection with auto-reconnect
│   └── razorpay.js           # Razorpay instance initialization
├── controllers/              # 15 domain controllers handling HTTP logic
├── middleware/
│   ├── auth.js               # JWT verification & RBAC authorization
│   ├── audit.js              # Administrative audit logger
│   ├── errorHandler.js       # Production error masking & logging
│   ├── requestContext.js     # Correlation requestId injector
│   └── upload.js             # Multer file upload handler
├── models/                   # 16 Mongoose data schemas
├── routes/                   # 15 Express route files
├── services/
│   ├── cronService.js        # Daily overdue engine & reminder cron
│   ├── emailService.js       # Nodemailer SMTP transporter
│   ├── notificationService.js# HTML email template renderer
│   └── paymentService.js     # Payment creation & verification helpers
├── utils/
│   ├── appError.js           # Custom operational error class
│   ├── asyncHandler.js       # Express async route wrapper
│   ├── idGenerator.js        # Unique registration & receipt ID generator
│   ├── logger.js             # Sanitized production console logger
│   └── otpUtils.js           # SHA-256 OTP hashing & timingSafeEqual helper
└── server.js                 # Express server bootstrap & graceful shutdown
```

---

# 17. Error Handling & Structured Logging

```text
[Incoming Error / Exception]
             ↓
[AppError Operational Check]
             ↓
    ┌────────┴────────┐
    ▼                 ▼
[Server Console Log]  [Client Response]
- HTTP Method         - HTTP Status: 500 (or operational code)
- Endpoint Path       - success: false
- Correlation ID      - message: "Something went wrong. Please try again later."
- Full Stack Trace    - requestId: "9504061a-2f61-..."
- Sanitized Payload   (No stack traces or database internals exposed)
```

---

# 18. Deployment Guide

### Deploying to Vercel (Frontend)
1. Import repository into **Vercel**.
2. Set Root Directory to `frontend`.
3. Set Build Command to `npm run build` and Output Directory to `dist`.
4. Add Environment Variable: `VITE_API_URL=https://your-backend-api.com/api`.

### Deploying Backend (Render / Railway / Cloud Server)
1. Set Root Directory to `backend`.
2. Build Command: `npm install`.
3. Start Command: `npm start`.
4. Configure all environment variables in your hosting provider's dashboard.

---

# 19. Environment Variables

Create a `backend/.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# Database
DATABASE_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/apartment_management?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_encryption_key
JWT_EXPIRES_IN=7d

# SMTP Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_PASSWORD=your_app_password
SMTP_FROM_NAME="Apartment Management System"
SMTP_FROM_EMAIL=your_email@gmail.com

# OTP Security Parameters
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
OTP_RESEND_COOLDOWN=60
OTP_MAX_ATTEMPTS=5

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

# 20. Project Structure

```text
Apartment-Management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seeds/
│   │   ├── services/
│   │   ├── tests/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

# 21. Installation & Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/Ramagirivardhan-2005/Apartment-Management.git
cd Apartment-Management
```

### 2. Backend Setup
```bash
cd backend
npm install
# Configure backend/.env with your MongoDB & SMTP credentials
npm run seed     # Optional: Populates demo blocks, rooms, parking & accounts
npm start        # Starts server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev      # Starts Vite client on http://localhost:5173
```

---

# 22. API Examples (cURL)

### 1. User Login (Step 1)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@apartment.com", "password": "Password123!"}'
```

### 2. Verify 2FA OTP (Step 2)
```bash
curl -X POST http://localhost:5000/api/auth/verify-login-otp \
  -H "Content-Type: application/json" \
  -d '{"verificationToken": "YOUR_VERIFY_TOKEN", "otp": "123456"}'
```

### 3. Fetch Available Rooms
```bash
curl -X GET http://localhost:5000/api/rooms/available \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Create Razorpay Advance Order
```bash
curl -X POST http://localhost:5000/api/payments/razorpay/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"roomId": "ROOM_OBJECT_ID", "durationMonths": 6, "amount": 18000}'
```

---

# 23. UI Showcase & Dashboards

| Role Portal | Dashboard Capabilities |
|---|---|
| **Super Admin Portal** | Complex overview KPIs, block creator modal, system audit trail viewer, global parking allocation matrix. |
| **Block Admin Portal** | Room inventory cards, receptionist manager (max 2), color-coded overdue tiers (Orange/Red/Dark Red), notice manager. |
| **Reception Desk** | 8-step room booking wizard, resident mobile search, manual payment recorder, stamped receipt printer. |
| **Resident Portal** | Room allocation card, Razorpay rent payment modal, maintenance ticket tracker, PDF receipts viewer. |
| **Security Gate** | Digital visitor pass check-in/out, duration calculator, resident gate movement logger. |

---

# 24. Future Enhancements

- 📱 Mobile App (React Native / Flutter) for instant gate push notifications.
- ⚡ Redis cluster integration for distributed real-time checkout locks.
- 📹 Automated License Plate Recognition (ALPR) for seamless vehicle gate check-in.
- 🏪 Residential community marketplace and verified local vendor booking.

---

# 25. Contributors & Author

**Author:** [Ramagiri Vardhan](https://github.com/Ramagirivardhan-2005)  
**Repository:** [https://github.com/Ramagirivardhan-2005/Apartment-Management](https://github.com/Ramagirivardhan-2005/Apartment-Management)  
**License:** MIT
