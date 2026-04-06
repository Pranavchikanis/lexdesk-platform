# Agent-Executable PRD — Advocate Legal Platform
**Target Platform:** Antigravity AI (Agentic Build Environment)
**Document Version:** 1.0
**Status:** Agent-Ready
**Jurisdiction:** India (DPDPA 2023 / Bar Council of India Rules)

---

## 1. Product Overview

**Product Name:** LexDesk — Advocate Legal Platform

**Purpose:**
A full-stack web application enabling a solo advocate to acquire clients, manage case lifecycles, handle billing, and communicate securely with clients — all within a single, compliant, role-isolated platform.

**Target Users:**

| Role | Description |
|---|---|
| `VISITOR` | Unauthenticated public user browsing the platform |
| `CLIENT` | Registered user with at least one accepted matter |
| `ADVOCATE` | Primary platform owner; manages all cases and operations |
| `ADMIN` | Platform administrator; manages system config and user accounts |

**Core Value Proposition:**
- Replaces paper-based and email-based legal workflows with a structured, auditable digital system.
- Enforces attorney-client privilege, conflict checking, and DPDPA compliance by design.
- Enables client self-service (booking, document upload, invoice payment) without advocate intervention.

---

## 2. System Goals

### 2.1 Business Goals
- Convert public visitors to paying consultation clients.
- Reduce administrative overhead through automation of intake, reminders, and billing.
- Maintain full Bar Council of India advertising compliance on all public-facing content.
- Generate GST-compliant financial records without external accounting software dependency.
- Support scaling from solo advocate to multi-advocate firm without re-architecture.

### 2.2 User Goals

**VISITOR:**
- Evaluate advocate credentials and practice areas.
- Self-schedule a paid consultation without phone contact.
- Submit a case inquiry without technical knowledge.

**CLIENT:**
- Track case progress in real time.
- Securely share sensitive documents.
- Pay invoices online and access receipts.
- Communicate with advocate via a privileged, case-scoped channel.

**ADVOCATE:**
- Accept or reject inquiries after conflict checking.
- Manage all active cases, hearings, deadlines, and billing from one dashboard.
- Log billable time and auto-generate invoices.

**ADMIN:**
- Manage all user accounts.
- Monitor system health and compliance.
- Approve testimonials before publication.

### 2.3 System Goals (Agent-Oriented)

| Goal | Constraint |
|---|---|
| **Modularity** | Each module is a self-contained service with defined API boundaries. No module may directly access another module's database tables. |
| **Scalability** | Stateless backend; horizontal scaling via load balancer. Queue-based async for all side-effect operations. |
| **Fault Isolation** | Failure of Booking module must not impact Case Management or Messaging. Each module exposes a health endpoint. |
| **Observability** | All state transitions emit structured events. All API calls are logged with actor, timestamp, IP, and outcome. |
| **Security by Default** | All endpoints require explicit auth annotation. No endpoint is public unless explicitly marked `PUBLIC`. |

---

## 3. System Architecture (Agent-Oriented)

### 3.1 Frontend Layer

**Framework:** Next.js 14 (App Router) with TypeScript
**Styling:** Tailwind CSS
**State:** Zustand (client state) + React Query (server state)
**Auth:** NextAuth.js with JWT + refresh tokens

**Pages (Route Map):**

| Route | Access | Module |
|---|---|---|
| `/` | PUBLIC | Public Website |
| `/about` | PUBLIC | Public Website |
| `/practice-areas/[slug]` | PUBLIC | Public Website |
| `/fees` | PUBLIC | Public Website |
| `/blog` | PUBLIC | Public Website |
| `/blog/[slug]` | PUBLIC | Public Website |
| `/contact` | PUBLIC | Public Website |
| `/book` | PUBLIC | Appointment Booking |
| `/inquiry` | PUBLIC | Case Intake |
| `/ai-assist` | PUBLIC | AI Assistant |
| `/auth/login` | PUBLIC | Auth |
| `/auth/register` | PUBLIC | Auth |
| `/auth/verify` | PUBLIC | Auth |
| `/portal` | CLIENT | Client Portal |
| `/portal/cases/[caseId]` | CLIENT | Client Portal |
| `/portal/cases/[caseId]/documents` | CLIENT | Document Management |
| `/portal/cases/[caseId]/messages` | CLIENT | Messaging |
| `/portal/invoices` | CLIENT | Billing |
| `/portal/invoices/[invoiceId]` | CLIENT | Billing |
| `/dashboard` | ADVOCATE | Case Management |
| `/dashboard/cases/[caseId]` | ADVOCATE | Case Management |
| `/dashboard/intake` | ADVOCATE | Case Intake |
| `/dashboard/calendar` | ADVOCATE | Calendar |
| `/dashboard/billing` | ADVOCATE | Billing |
| `/dashboard/time-tracker` | ADVOCATE | Billing |
| `/dashboard/documents/[caseId]` | ADVOCATE | Document Management |
| `/admin` | ADMIN | Admin Panel |
| `/admin/users` | ADMIN | Admin Panel |
| `/admin/audit-logs` | ADMIN | Admin Panel |
| `/admin/testimonials` | ADMIN | Admin Panel |
| `/admin/settings` | ADMIN | Admin Panel |

**UI States (per authenticated page):**

Each authenticated page must handle: `LOADING` | `ERROR` | `EMPTY` | `POPULATED` | `SUBMITTING` | `SUCCESS`

**Interaction Patterns:**
- All forms: optimistic UI with rollback on error.
- Document vault: drag-and-drop upload with progress bar and per-file status.
- Case kanban: drag-to-update-status with immediate server sync.
- Calendar: month/week view toggle; hearing dates highlighted in red if within 7 days.

---

### 3.2 Backend Layer

**Runtime:** Node.js 20 with Express or NestJS
**API Style:** RESTful with versioned base path `/api/v1/`
**Auth Middleware:** JWT validation on all non-PUBLIC routes
**Queue:** BullMQ (Redis-backed) for async jobs
**Background Jobs:** Notification dispatch, PDF generation, virus scanning, conflict check indexing

**Service Boundaries (one service per module):**

| Service | Port (internal) | Responsibility |
|---|---|---|
| `auth-service` | 3001 | JWT issuance, 2FA, session management |
| `public-service` | 3002 | CMS pages, blog, testimonials |
| `intake-service` | 3003 | Inquiry submission, conflict check |
| `booking-service` | 3004 | Availability, appointment CRUD |
| `case-service` | 3005 | Case lifecycle, notes, hearings |
| `document-service` | 3006 | Upload, versioning, access control |
| `messaging-service` | 3007 | Per-case encrypted messages |
| `billing-service` | 3008 | Invoices, payments, time entries |
| `notification-service` | 3009 | Email, SMS, WhatsApp dispatch |
| `admin-service` | 3010 | User mgmt, audit logs, config |
| `ai-service` | 3011 | FAQ classifier, query routing |

All services communicate via internal HTTP. External traffic routes through a single API gateway.

---

### 3.3 Data Layer

**Primary DB:** PostgreSQL 15 (relational, ACID-compliant)
**Cache:** Redis 7 (sessions, rate limiting, queue backend)
**Search Index:** PostgreSQL full-text search (conflict check); optionally Meilisearch for blog
**Document Storage:** S3-compatible object store (AWS S3 or MinIO self-hosted)
**Migration Tool:** Prisma Migrate

**Core Entity Relationships:**

```
User ──< Case (via client_id)
Advocate ──< Case (via advocate_id)
Case ──< Document
Case ──< Message
Case ──< Invoice ──< TimeEntry
Case ──< Appointment (pre-acceptance)
Case ──< CaseEvent (audit trail)
Invoice ──< Payment
User ──< Notification
```

---

### 3.4 Infrastructure Layer

| Component | Technology | Notes |
|---|---|---|
| Object Storage | AWS S3 / MinIO | Per-case bucket prefix; AES-256 SSE |
| Auth | JWT (access: 15min) + Refresh Token (7d, HTTP-only cookie) | |
| 2FA | TOTP (ADVOCATE/ADMIN) + OTP-SMS (CLIENT optional) | |
| Message Queue | BullMQ on Redis | Dead-letter queue for failed jobs |
| Email | SendGrid / Amazon SES | Transactional only |
| SMS/WhatsApp | MSG91 / Twilio | OTP + reminders |
| Video | Zoom OAuth / Google Meet | Link generation on booking confirm |
| eSign | Digio API | Engagement letters, vakalatnamas |
| Payment | Razorpay | UPI, cards, net banking |
| CDN | Cloudflare | Static assets, public pages |
| Monitoring | Prometheus + Grafana or Datadog | Health endpoints per service |
| Logging | Structured JSON → CloudWatch / Loki | Immutable; 90-day retention |

---

## 4. Core Entities & Data Models

### 4.1 User

```json
{
  "id": "uuid",
  "email": "string | unique | not-null",
  "phone": "string | unique | nullable",
  "password_hash": "string | not-null",
  "role": "VISITOR | CLIENT | ADVOCATE | ADMIN",
  "is_verified": "boolean | default: false",
  "is_active": "boolean | default: true",
  "two_fa_enabled": "boolean | default: false",
  "two_fa_secret": "string | nullable | encrypted",
  "last_login_at": "timestamp | nullable",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Constraints:**
- `email` must pass RFC 5322 validation.
- `role` is immutable post-creation except by ADMIN.
- `password_hash` uses bcrypt, cost factor 12.
- `two_fa_enabled` must be `true` for ADVOCATE and ADMIN or login is blocked.

---

### 4.2 ClientProfile

```json
{
  "id": "uuid",
  "user_id": "uuid | FK: User | unique",
  "full_name": "string | not-null",
  "address": "string | nullable",
  "id_type": "AADHAAR | PAN | PASSPORT | OTHER",
  "id_number_encrypted": "string | nullable | AES-256",
  "date_of_birth": "date | nullable",
  "preferred_language": "string | default: 'en'",
  "created_at": "timestamp"
}
```

---

### 4.3 AdvocateProfile

```json
{
  "id": "uuid",
  "user_id": "uuid | FK: User | unique",
  "full_name": "string | not-null",
  "bar_registration_number": "string | unique | not-null",
  "enrollment_date": "date | not-null",
  "high_court": "string | not-null",
  "practice_areas": "string[] | not-null",
  "bio": "text | nullable",
  "profile_photo_url": "string | nullable",
  "office_address": "string | nullable",
  "languages_spoken": "string[]",
  "education": "jsonb",
  "awards": "jsonb",
  "consultation_fee_inr": "integer | not-null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

### 4.4 Case

```json
{
  "id": "uuid",
  "case_number": "string | unique | auto-generated",
  "client_id": "uuid | FK: User",
  "advocate_id": "uuid | FK: User",
  "matter_type": "CIVIL | CRIMINAL | FAMILY | CORPORATE | LABOUR | CONSUMER | OTHER",
  "title": "string | not-null",
  "description": "text | not-null",
  "status": "NEW | UNDER_REVIEW | CONFLICT_FLAGGED | ACCEPTED | ACTIVE | ON_HOLD | CLOSED | REJECTED",
  "urgency": "LOW | MEDIUM | HIGH | URGENT",
  "opposing_party_name": "string | nullable",
  "opposing_party_advocate": "string | nullable",
  "court_name": "string | nullable",
  "cnr_number": "string | nullable",
  "next_hearing_date": "date | nullable",
  "limitation_date": "date | nullable",
  "engagement_letter_signed": "boolean | default: false",
  "engagement_letter_url": "string | nullable",
  "conflict_check_result": "CLEAR | FLAGGED | CONFLICT | PENDING",
  "conflict_check_at": "timestamp | nullable",
  "internal_notes": "text | nullable",
  "closed_at": "timestamp | nullable",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Constraints:**
- `case_number` format: `LEX-YYYY-NNNN` (auto-incremented per year).
- `status` transitions are enforced by state machine (see Section 8).
- `internal_notes` is never returned in CLIENT-scoped API responses.
- `conflict_check_result` must be `CLEAR` before status can advance to `ACCEPTED`.

---

### 4.5 Document

```json
{
  "id": "uuid",
  "case_id": "uuid | FK: Case",
  "uploaded_by": "uuid | FK: User",
  "file_name": "string | not-null",
  "file_type": "PDF | JPEG | PNG | DOCX | XLSX",
  "file_size_bytes": "integer | not-null",
  "storage_key": "string | not-null",
  "storage_bucket": "string | not-null",
  "version": "integer | default: 1",
  "previous_version_id": "uuid | nullable | FK: Document",
  "virus_scan_status": "PENDING | CLEAN | INFECTED",
  "is_confidential": "boolean | default: true",
  "request_id": "uuid | nullable | FK: DocumentRequest",
  "created_at": "timestamp"
}
```

**Constraints:**
- Max file size: 25 MB per file.
- Allowed types: PDF, JPEG, PNG, DOCX, XLSX only.
- `storage_key` format: `cases/{case_id}/documents/{document_id}/{version}/{file_name}`.
- Virus scan must return `CLEAN` before file is accessible via download URL.
- Files with `virus_scan_status: INFECTED` are quarantined and admin is notified.

---

### 4.6 Message

```json
{
  "id": "uuid",
  "case_id": "uuid | FK: Case",
  "sender_id": "uuid | FK: User",
  "content_encrypted": "text | not-null | AES-256",
  "is_read": "boolean | default: false",
  "read_at": "timestamp | nullable",
  "attachment_id": "uuid | nullable | FK: Document",
  "created_at": "timestamp"
}
```

**Constraints:**
- `content_encrypted` decrypted only client-side or at API response layer; never stored plain.
- Sender must be either the `client_id` or `advocate_id` of the parent Case.
- Messages are append-only; no UPDATE or DELETE operations permitted on this table.

---

### 4.7 Invoice

```json
{
  "id": "uuid",
  "invoice_number": "string | unique | auto-generated",
  "case_id": "uuid | FK: Case",
  "client_id": "uuid | FK: User",
  "advocate_id": "uuid | FK: User",
  "status": "DRAFT | ISSUED | PARTIALLY_PAID | PAID | OVERDUE | CANCELLED",
  "line_items": "jsonb",
  "subtotal_inr": "integer",
  "gst_rate_percent": "decimal | default: 18.00",
  "gst_amount_inr": "integer",
  "total_inr": "integer",
  "amount_paid_inr": "integer | default: 0",
  "due_date": "date | not-null",
  "issued_at": "timestamp | nullable",
  "paid_at": "timestamp | nullable",
  "pdf_url": "string | nullable",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Constraints:**
- `invoice_number` format: `INV-YYYY-NNNN`.
- All monetary amounts stored in paise (integer); display layer divides by 100.
- `line_items` schema: `[{ description: string, quantity: decimal, rate_inr: integer, amount_inr: integer }]`.
- GST computed as: `gst_amount_inr = subtotal_inr * (gst_rate_percent / 100)`.

---

### 4.8 TimeEntry

```json
{
  "id": "uuid",
  "case_id": "uuid | FK: Case",
  "advocate_id": "uuid | FK: User",
  "invoice_id": "uuid | nullable | FK: Invoice",
  "activity_type": "DRAFTING | RESEARCH | COURT_ATTENDANCE | CLIENT_CALL | CORRESPONDENCE | REVIEW | OTHER",
  "description": "string | not-null",
  "duration_minutes": "integer | not-null",
  "rate_per_hour_inr": "integer | not-null",
  "amount_inr": "integer | computed",
  "billed": "boolean | default: false",
  "entry_date": "date | not-null",
  "created_at": "timestamp"
}
```

**Constraints:**
- `amount_inr = (duration_minutes / 60) * rate_per_hour_inr`.
- `billed` set to `true` when entry is added to an Invoice.
- `billed` entries cannot be modified.

---

### 4.9 Appointment

```json
{
  "id": "uuid",
  "visitor_name": "string | not-null",
  "visitor_email": "string | not-null",
  "visitor_phone": "string | not-null",
  "advocate_id": "uuid | FK: User",
  "consultation_type": "IN_PERSON | PHONE | VIDEO",
  "matter_summary": "text | not-null | min: 50 chars",
  "opposing_party_name": "string | nullable",
  "slot_start": "timestamp | not-null",
  "slot_end": "timestamp | not-null",
  "status": "PENDING_PAYMENT | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW",
  "payment_id": "uuid | nullable | FK: Payment",
  "video_link": "string | nullable",
  "conflict_check_result": "PENDING | CLEAR | FLAGGED",
  "converted_to_case_id": "uuid | nullable | FK: Case",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

### 4.10 Payment

```json
{
  "id": "uuid",
  "reference_type": "APPOINTMENT | INVOICE",
  "reference_id": "uuid | not-null",
  "payer_id": "uuid | nullable | FK: User",
  "gateway": "RAZORPAY | PAYU",
  "gateway_order_id": "string | not-null",
  "gateway_payment_id": "string | nullable",
  "amount_inr": "integer | not-null",
  "currency": "INR",
  "status": "CREATED | AUTHORIZED | CAPTURED | FAILED | REFUNDED",
  "failure_reason": "string | nullable",
  "receipt_url": "string | nullable",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

### 4.11 Notification

```json
{
  "id": "uuid",
  "user_id": "uuid | FK: User",
  "type": "EMAIL | SMS | WHATSAPP | IN_APP",
  "event": "string | not-null",
  "subject": "string | nullable",
  "body": "text | not-null",
  "status": "QUEUED | SENT | FAILED | DELIVERED",
  "sent_at": "timestamp | nullable",
  "retry_count": "integer | default: 0",
  "metadata": "jsonb | nullable",
  "created_at": "timestamp"
}
```

---

### 4.12 AuditLog

```json
{
  "id": "uuid",
  "actor_id": "uuid | nullable | FK: User",
  "actor_role": "VISITOR | CLIENT | ADVOCATE | ADMIN | SYSTEM",
  "action": "string | not-null",
  "resource_type": "string | not-null",
  "resource_id": "uuid | nullable",
  "ip_address": "inet | not-null",
  "user_agent": "string | nullable",
  "metadata": "jsonb | nullable",
  "created_at": "timestamp | not-null | immutable"
}
```

**Constraints:**
- Table is INSERT-only. No UPDATE or DELETE permitted at application level.
- Retained for minimum 5 years.

---

### 4.13 ConflictCheckRecord

```json
{
  "id": "uuid",
  "checked_by": "uuid | FK: User",
  "reference_type": "INQUIRY | APPOINTMENT",
  "reference_id": "uuid | not-null",
  "party_names_checked": "string[]",
  "matched_case_ids": "uuid[]",
  "result": "CLEAR | FLAGGED | CONFLICT",
  "notes": "text | nullable",
  "checked_at": "timestamp | not-null"
}
```

---

## 5. Module Decomposition

---

### Module 01 — Authentication & Authorization

**Purpose:** Issue and validate JWTs; enforce RBAC; manage 2FA; handle sessions.

**Owned Entities:** `User`, `AuditLog` (auth events)

**Key Features:**
- Email/password registration with email verification link.
- Login with JWT (15-min access token) + HTTP-only refresh token (7 days).
- TOTP-based 2FA mandatory for ADVOCATE and ADMIN.
- OTP-SMS optional 2FA for CLIENT.
- Role-based middleware injected into all other services.
- Session invalidation on password change or manual logout.
- Rate limiting: max 5 failed login attempts per IP per 15 minutes → 30-minute lockout.

**Inputs:**
- `POST /api/v1/auth/register` — email, password, role
- `POST /api/v1/auth/login` — email, password, otp (if 2FA enabled)
- `POST /api/v1/auth/refresh` — refresh token cookie
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/verify-email` — token
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password` — token, new_password

**Outputs:**
- JWT access token (response body)
- Refresh token (HTTP-only cookie)
- `auth.user_registered` event → Notification service
- `auth.login_failed` event → AuditLog

**Dependencies:** Notification Service (OTP delivery), Redis (rate limiting, refresh token store)

**Edge Cases:**
- Email already registered → 409 Conflict.
- Expired email verification link → resend endpoint.
- 2FA secret lost → admin-only account recovery flow.
- Refresh token reuse (rotation attack) → invalidate all sessions for that user.

**Success Criteria:**
- JWT validated in < 5ms.
- 2FA enforced: ADVOCATE/ADMIN cannot reach any protected endpoint without TOTP.
- Failed login attempts logged in AuditLog with IP.

---

### Module 02 — Public Website / CMS

**Purpose:** Serve all unauthenticated public-facing pages; manage CMS content.

**Owned Entities:** `AdvocateProfile` (read-only), `BlogPost`, `Testimonial`, `PracticeArea`, `FeeStructure`

**Key Features:**
- Static-rendered homepage, about, practice areas, fees, contact pages.
- Blog: CRUD by ADVOCATE via CMS; public read with SEO metadata.
- Testimonials: submitted by ADVOCATE → ADMIN approval queue → published.
- Practice area pages with schema markup (LegalService JSON-LD).
- Cookie consent banner (opt-in for analytics).
- Legal disclaimer rendered in footer on all pages.

**Inputs:**
- `GET /api/v1/public/profile` — advocate profile for public display
- `GET /api/v1/public/blog` — paginated posts
- `GET /api/v1/public/blog/:slug`
- `GET /api/v1/public/testimonials` — approved only
- `GET /api/v1/public/practice-areas`
- `GET /api/v1/public/fees`
- `POST /api/v1/cms/blog` (ADVOCATE) — create post
- `PUT /api/v1/cms/blog/:id` (ADVOCATE)
- `DELETE /api/v1/cms/blog/:id` (ADVOCATE)
- `POST /api/v1/cms/testimonials` (ADVOCATE) — submit for moderation

**Outputs:**
- HTML pages (SSG/SSR via Next.js)
- `cms.testimonial_submitted` event → Admin notification

**Dependencies:** Admin Module (testimonial approval)

**Edge Cases:**
- Blog slug collision → append `-2`, `-3` suffix automatically.
- Testimonial published without PII → validation rule: no names, phone numbers, or case numbers in testimonial body.
- Profile photo missing → render initials avatar as fallback.

**Success Criteria:**
- LCP < 2.5s on 4G (mobile).
- All public pages pass WCAG 2.1 AA audit.
- Legal disclaimer present on every rendered page.

---

### Module 03 — Case Intake & Inquiry System

**Purpose:** Capture visitor inquiries; run conflict checks; route to ADVOCATE intake queue.

**Owned Entities:** `Case` (status: NEW, UNDER_REVIEW, CONFLICT_FLAGGED, ACCEPTED, REJECTED), `ConflictCheckRecord`

**Key Features:**
- Multi-step intake form (5 steps): matter type → party details → factual summary → urgency → contact.
- CAPTCHA (Google reCAPTCHA v3) on form submission.
- DPDPA consent checkbox — required field.
- Conflict check: fuzzy match `opposing_party_name` + `visitor_name` against all existing Case records.
- Intake queue in advocate dashboard with NEW/FLAGGED badge.
- Accept flow: triggers client account creation + engagement letter generation.
- Reject flow: sends rejection notification to visitor email.

**Inputs:**
- `POST /api/v1/intake/submit` (PUBLIC) — full inquiry payload
- `GET /api/v1/intake/queue` (ADVOCATE) — pending inquiries
- `POST /api/v1/intake/:caseId/conflict-check` (ADVOCATE)
- `POST /api/v1/intake/:caseId/accept` (ADVOCATE)
- `POST /api/v1/intake/:caseId/reject` (ADVOCATE) — reason: string

**Outputs:**
- `intake.submitted` event → Notification (advocate email alert)
- `intake.accepted` event → Auth service (create CLIENT account) + Document service (init case folder) + eSign service (generate engagement letter)
- `intake.rejected` event → Notification (visitor rejection email)
- `conflict_check.completed` event → Case record updated

**Dependencies:** Auth Module, Notification Module, Document Module, Billing Module (engagement letter eSign)

**Edge Cases:**
- Duplicate inquiry from same email within 24h → deduplicate, do not create second case.
- Conflict check finds partial match → status set to `CONFLICT_FLAGGED`; ADVOCATE must manually review before accepting.
- CAPTCHA score < 0.5 → reject with 422, log IP.
- Intake submitted outside business hours → auto-reply notification dispatched immediately.

**Success Criteria:**
- Conflict check completes within 3 seconds for a database of 10,000 case records.
- All inquiries appear in advocate dashboard within 30 seconds of submission.
- No case can reach status `ACCEPTED` unless `conflict_check_result = CLEAR`.

---

### Module 04 — Appointment Booking System

**Purpose:** Allow public users to book paid consultations in real-time available slots.

**Owned Entities:** `Appointment`, `Payment` (type: APPOINTMENT), `AvailabilitySlot`

**Key Features:**
- Advocate sets weekly availability template + blocked dates.
- Real-time slot availability with 15-min slot granularity.
- Consultation types: IN_PERSON, PHONE, VIDEO.
- Pre-payment required (Razorpay) before slot is confirmed.
- Webhook-verified payment confirmation triggers slot lock.
- Video link auto-generated via Zoom/Meet OAuth on confirmation.
- Conflict check on `opposing_party_name` field (preliminary; non-blocking).
- Cancellation: client may cancel up to 24h before slot for refund; <24h → no refund.
- Post-consultation: ADVOCATE can initiate case conversion from appointment record.

**Inputs:**
- `GET /api/v1/booking/availability?date=YYYY-MM-DD` (PUBLIC)
- `POST /api/v1/booking/appointments` (PUBLIC) — create appointment + Razorpay order
- `POST /api/v1/booking/payments/verify` (PUBLIC) — Razorpay webhook
- `GET /api/v1/booking/appointments/:id` (CLIENT | ADVOCATE)
- `PATCH /api/v1/booking/appointments/:id/cancel` (CLIENT | ADVOCATE)
- `POST /api/v1/booking/appointments/:id/convert-to-case` (ADVOCATE)
- `GET /api/v1/booking/availability/template` (ADVOCATE)
- `PUT /api/v1/booking/availability/template` (ADVOCATE)
- `POST /api/v1/booking/availability/block` (ADVOCATE) — block dates

**Outputs:**
- `booking.confirmed` event → Notification (SMS + email to visitor; email to ADVOCATE) + Calendar sync
- `booking.cancelled` event → Notification + Payment refund trigger (if eligible)
- `booking.converted` event → Intake module (pre-populate case from appointment data)

**Dependencies:** Notification Module, Payment (Razorpay), Auth Module, Intake Module (conversion)

**Edge Cases:**
- Race condition on slot selection → optimistic lock on slot record; 409 if already taken.
- Payment timeout (> 15 min) → slot released, appointment cancelled.
- Razorpay webhook replay attack → idempotency key check on `gateway_payment_id`.
- Video link generation fails → fall back to phone consultation type; alert ADVOCATE.
- Advocate blocks a slot already booked → notify client with reschedule option.

**Success Criteria:**
- Slot availability query responds in < 200ms.
- Slot double-booking rate = 0% under concurrent load.
- Payment webhook processed in < 5 seconds.

---

### Module 05 — Client Portal

**Purpose:** Authenticated workspace for registered clients to manage their matters.

**Owned Entities:** `Case` (CLIENT-scoped read), `Appointment`, `Notification`

**Key Features:**
- Dashboard: list of client's cases with status badges and next hearing date.
- Case detail view: timeline, documents, messages, invoices (tabs).
- Read-only access to case status; cannot modify status.
- Engagement letter eSign flow embedded in portal.
- Notification centre with unread count badge.
- Account settings: update phone, password, 2FA toggle.

**Inputs:**
- `GET /api/v1/portal/cases` (CLIENT) — all client's cases
- `GET /api/v1/portal/cases/:id` (CLIENT) — case detail
- `GET /api/v1/portal/cases/:id/timeline` (CLIENT)
- `POST /api/v1/portal/esign/:documentId/sign` (CLIENT)
- `GET /api/v1/portal/notifications` (CLIENT)
- `PATCH /api/v1/portal/notifications/:id/read` (CLIENT)

**Outputs:**
- `esign.completed` event → Case service (update `engagement_letter_signed = true`)

**Dependencies:** Auth Module, Case Management Module, Document Module, Messaging Module, Billing Module

**Edge Cases:**
- Client attempts to access another client's case ID → 403 Forbidden (enforced by RBAC middleware).
- Client account exists but no cases assigned → empty state with "Your inquiry is under review" message.
- eSign link expired (> 72h) → regenerate on demand via ADVOCATE action.

**Success Criteria:**
- CLIENT API responses contain zero fields from `internal_notes` or other ADVOCATE-only fields.
- Portal loads in < 2.5s on 4G.
- RBAC violation attempts are logged in AuditLog and return 403 (never 404).

---

### Module 06 — Document Management System

**Purpose:** Secure per-case document storage with versioning, access control, and virus scanning.

**Owned Entities:** `Document`, `DocumentRequest`

**Key Features:**
- Drag-and-drop upload interface; multi-file supported.
- Allowed types: PDF, JPEG, PNG, DOCX, XLSX. Max 25MB per file.
- Pre-signed S3 URL upload (client uploads directly to S3; metadata saved to DB after).
- Virus scan via ClamAV or VirusTotal API after upload; quarantine if infected.
- Versioning: if a file with same name uploaded to same case, create new version linked to previous.
- Document requests: ADVOCATE can request specific documents from CLIENT via named request record.
- Access log: every download is recorded in AuditLog.
- Confidentiality flag: documents marked `is_confidential = true` are accessible to ADVOCATE only.

**Inputs:**
- `POST /api/v1/documents/upload-url` (CLIENT | ADVOCATE) — generate pre-signed S3 URL
- `POST /api/v1/documents/confirm` (CLIENT | ADVOCATE) — confirm upload, trigger virus scan
- `GET /api/v1/documents?caseId=:id` (CLIENT | ADVOCATE)
- `GET /api/v1/documents/:id/download-url` (CLIENT | ADVOCATE) — pre-signed download URL
- `DELETE /api/v1/documents/:id` (ADVOCATE | ADMIN)
- `POST /api/v1/documents/requests` (ADVOCATE) — create document request
- `GET /api/v1/documents/requests?caseId=:id` (CLIENT | ADVOCATE)
- `PATCH /api/v1/documents/requests/:id/fulfill` (SYSTEM) — auto on upload matching request

**Outputs:**
- `document.uploaded` event → Notification (ADVOCATE alert for CLIENT uploads)
- `document.infected` event → Quarantine + Admin alert + Client notification
- `document.request_fulfilled` event → Notification to ADVOCATE

**Dependencies:** Auth Module, Case Module (case ownership validation), Notification Module

**Edge Cases:**
- Upload to S3 succeeds but `confirm` call fails → orphaned S3 object. Implement S3 lifecycle rule to delete unconfirmed objects after 1 hour.
- Virus scan service down → set `virus_scan_status: PENDING`; retry scan via queue every 5 min; block download until status resolved.
- File size exceeds 25MB → reject at pre-signed URL generation stage (enforced via S3 policy conditions).
- CLIENT uploads a document with `is_confidential = true` flag → only ADVOCATE can set this flag; CLIENT uploads default to `false`.

**Success Criteria:**
- Pre-signed URL generation < 200ms.
- Virus scan completes within 60 seconds of upload confirmation.
- Zero unauthorized cross-case document access verifiable in AuditLog.

---

### Module 07 — Messaging System

**Purpose:** Encrypted, per-case communication channel between CLIENT and ADVOCATE.

**Owned Entities:** `Message`

**Key Features:**
- Thread scoped strictly to a single case; no cross-case messaging.
- Messages encrypted at rest (AES-256 on `content_encrypted`).
- Real-time delivery via WebSocket (Socket.IO) with polling fallback.
- File attachment links (references Document record; not inline upload).
- Read receipts: `is_read` flipped on message open; `read_at` recorded.
- Message history fully exportable by ADVOCATE as PDF.
- Append-only: no edit or delete operations.

**Inputs:**
- `GET /api/v1/messages?caseId=:id` (CLIENT | ADVOCATE) — paginated history
- `POST /api/v1/messages` (CLIENT | ADVOCATE) — send message
- `PATCH /api/v1/messages/:id/read` (CLIENT | ADVOCATE)
- `GET /api/v1/messages/export?caseId=:id` (ADVOCATE) — PDF export
- WebSocket: `ws://messaging-service/cases/:caseId` — real-time channel

**Outputs:**
- `message.sent` event → Notification (in-app + email to recipient if offline)

**Dependencies:** Auth Module, Case Module (access validation), Document Module (attachment ref), Notification Module

**Edge Cases:**
- WebSocket connection dropped → client falls back to polling every 10 seconds.
- Message sent to CLOSED case → 403 Forbidden; case must be re-opened by ADVOCATE first.
- Sender not a party to the case (CLIENT from different case) → 403, logged in AuditLog.
- Attachment document deleted after message sent → message preserved; attachment shows "File no longer available."

**Success Criteria:**
- Message delivery latency < 1 second via WebSocket.
- All message content encrypted in DB; decryption only at API response layer.
- No message record permits UPDATE or DELETE at database constraint level.

---

### Module 08 — Case Management Dashboard

**Purpose:** ADVOCATE's central workspace for all case operations, hearings, notes, and time tracking.

**Owned Entities:** `Case`, `CaseEvent`, `TimeEntry`, `HearingDate`

**Key Features:**
- Kanban board (columns: UNDER_REVIEW, ACCEPTED, ACTIVE, ON_HOLD, CLOSED) and list view toggle.
- Case status transitions via drag (kanban) or dropdown (list); enforced by state machine.
- Hearing calendar: add/edit hearing dates with court name, CNR, and notes.
- Limitation date alerts: cases where `limitation_date` is within 30 days highlighted in red.
- Internal case notes (never visible to CLIENT).
- Time tracker: start/stop timer per case with activity type; manual entry fallback.
- eCourts API sync: fetch latest status by CNR number on demand.
- Case closure: generate PDF case summary; archive all documents.

**Inputs:**
- `GET /api/v1/cases` (ADVOCATE) — all cases with filters
- `GET /api/v1/cases/:id` (ADVOCATE) — full case detail including internal_notes
- `PATCH /api/v1/cases/:id/status` (ADVOCATE)
- `POST /api/v1/cases/:id/hearings` (ADVOCATE)
- `PUT /api/v1/cases/:id/hearings/:hearingId`
- `DELETE /api/v1/cases/:id/hearings/:hearingId`
- `POST /api/v1/cases/:id/notes` (ADVOCATE)
- `POST /api/v1/cases/:id/time-entries` (ADVOCATE)
- `GET /api/v1/cases/:id/time-entries` (ADVOCATE)
- `POST /api/v1/cases/:id/ecourts-sync` (ADVOCATE) — trigger eCourts API fetch
- `POST /api/v1/cases/:id/close` (ADVOCATE)
- `GET /api/v1/cases/:id/summary-pdf` (ADVOCATE)

**Outputs:**
- `case.status_changed` event → Notification (CLIENT alert) + AuditLog
- `case.hearing_added` event → Notification (reminder scheduling)
- `case.closed` event → Document archive + Notification to CLIENT

**Dependencies:** All modules (case is the central entity)

**Edge Cases:**
- Status transition not permitted by state machine → 422 with `allowed_transitions` in error body.
- eCourts API unavailable → return last synced data with `last_synced_at` timestamp.
- Closing a case with outstanding unpaid invoices → 409; must resolve billing first or ADVOCATE confirms forced close.
- Time entry added to a CLOSED case → 403 Forbidden.

**Success Criteria:**
- Case list loads (100 cases) in < 500ms.
- State machine rejects invalid transitions 100% of the time.
- `internal_notes` field absent from all CLIENT-facing API responses.

---

### Module 09 — Billing & Payments

**Purpose:** Invoice lifecycle, online payment, GST receipts, and time-based billing.

**Owned Entities:** `Invoice`, `Payment`, `TimeEntry`

**Key Features:**
- Generate invoice from selected unbilled time entries + manual line items.
- Draft → Issue flow: invoice emailed to client on issue.
- Razorpay payment link embedded in client portal.
- Webhook-verified payment capture → invoice status to `PAID`.
- GST computation (18% default, configurable) with HSN code for legal services.
- PDF invoice generation with advocate letterhead.
- Overdue detection: cron job runs daily; invoices past due date → status `OVERDUE` + reminder notification.
- Partial payments recorded; status → `PARTIALLY_PAID`.
- Retainer management: consultation fee payments linked to Appointment, not Invoice.

**Inputs:**
- `POST /api/v1/billing/invoices` (ADVOCATE)
- `GET /api/v1/billing/invoices?caseId=:id` (ADVOCATE | CLIENT)
- `GET /api/v1/billing/invoices/:id` (ADVOCATE | CLIENT)
- `PATCH /api/v1/billing/invoices/:id/issue` (ADVOCATE)
- `PATCH /api/v1/billing/invoices/:id/cancel` (ADVOCATE)
- `POST /api/v1/billing/invoices/:id/payment-link` (CLIENT) — create Razorpay order
- `POST /api/v1/billing/payments/webhook` (PUBLIC) — Razorpay webhook
- `GET /api/v1/billing/invoices/:id/pdf` (ADVOCATE | CLIENT)
- `GET /api/v1/billing/time-entries?caseId=:id` (ADVOCATE)
- `POST /api/v1/billing/time-entries` (ADVOCATE)
- `PATCH /api/v1/billing/time-entries/:id` (ADVOCATE) — only if not billed

**Outputs:**
- `invoice.issued` event → Notification (CLIENT email with PDF)
- `invoice.paid` event → Notification (receipt to CLIENT) + AuditLog
- `invoice.overdue` event → Notification (reminder to CLIENT; alert to ADVOCATE)

**Dependencies:** Notification Module, Auth Module, Case Module

**Edge Cases:**
- Razorpay webhook received for already-paid invoice → idempotency check; return 200, no state change.
- Invoice cancelled after partial payment → trigger refund flow; status → `CANCELLED`; refund to payment gateway.
- Time entry rate updated after being billed → 403; billed entries are immutable.
- CLIENT attempts to access invoice for a case they don't own → 403.

**Success Criteria:**
- GST computation accurate to two decimal places.
- Payment webhook processed within 5 seconds.
- PDF invoice generated in < 3 seconds.

---

### Module 10 — Notification System

**Purpose:** Centralized async dispatch for all email, SMS, WhatsApp, and in-app notifications.

**Owned Entities:** `Notification`

**Key Features:**
- Queue-based processing via BullMQ; never blocks HTTP threads.
- Channel routing: EMAIL (all events), SMS (OTP, hearing reminders, payment), WhatsApp (hearing reminders, case updates — opt-in only), IN_APP (all authenticated events).
- Template engine: Handlebars for dynamic content.
- Retry logic: 3 attempts with exponential backoff (1min, 5min, 15min).
- Dead-letter queue for permanently failed notifications; ADMIN alerted.
- Scheduled notifications: hearing reminders dispatched at 30d, 7d, 1d, 1h before hearing.
- Unsubscribe/opt-out respected per channel.

**Inputs (internal events only — not exposed as public API):**
- Queue: `notification.dispatch` job with `{ user_id, type, event, template_id, data }`
- `GET /api/v1/notifications` (CLIENT | ADVOCATE) — in-app list
- `PATCH /api/v1/notifications/preferences` (CLIENT | ADVOCATE) — channel opt-in/out

**Outputs:**
- Email via SendGrid / SES
- SMS via MSG91 / Twilio
- WhatsApp via MSG91 Business API
- In-app notification record in DB

**Dependencies:** Auth Module (user lookup for contact details), all other modules (event producers)

**Edge Cases:**
- User phone number invalid → skip SMS; log failure; proceed with email.
- SendGrid rate limit hit → exponential backoff; switch to SES fallback if available.
- Hearing date deleted after reminder scheduled → cancel pending BullMQ job by job ID.
- User opts out of SMS → filter at dispatch time; do not send.

**Success Criteria:**
- In-app notification appears < 5 seconds after event.
- Email delivery rate > 95%.
- Zero reminder dispatch for cancelled/deleted hearings.

---

### Module 11 — Admin Panel

**Purpose:** Platform administration: user management, audit, configuration, testimonial moderation.

**Owned Entities:** `User`, `AuditLog`, `Testimonial`, `SystemConfig`

**Key Features:**
- User list with search, filter by role, suspend/reactivate.
- Audit log viewer: immutable, filterable by actor, action, resource, date range.
- Testimonial moderation: view pending → approve/reject with reason.
- System configuration: manage integration keys (payment, SMS, eSign) stored encrypted.
- Data export: DPDPA-compliant export of all data for a given user.
- Data deletion: right-to-erasure workflow — flag data for deletion with 72h delay.
- Analytics overview: inquiry volume, conversion rate, revenue summary.

**Inputs:**
- `GET /api/v1/admin/users` (ADMIN)
- `PATCH /api/v1/admin/users/:id/suspend` (ADMIN)
- `PATCH /api/v1/admin/users/:id/activate` (ADMIN)
- `GET /api/v1/admin/audit-logs` (ADMIN)
- `GET /api/v1/admin/testimonials/pending` (ADMIN)
- `PATCH /api/v1/admin/testimonials/:id/approve` (ADMIN)
- `PATCH /api/v1/admin/testimonials/:id/reject` (ADMIN)
- `GET /api/v1/admin/config` (ADMIN)
- `PUT /api/v1/admin/config` (ADMIN)
- `POST /api/v1/admin/data-export/:userId` (ADMIN)
- `POST /api/v1/admin/data-delete/:userId` (ADMIN)
- `GET /api/v1/admin/analytics` (ADMIN)

**Outputs:**
- `admin.user_suspended` event → Notification to affected user
- `admin.testimonial_approved` event → Public CMS update
- `admin.data_deletion_scheduled` event → 72h timer; then cascade delete

**Dependencies:** All modules (read access for audit and analytics)

**Edge Cases:**
- Admin attempts to delete ADVOCATE account with active cases → 409; must close/transfer cases first.
- Data export request → async job; admin receives download link via email when ready.
- ADMIN cannot suspend another ADMIN (prevent lockout) → 403.

**Success Criteria:**
- Audit log query for 1M records returns in < 2 seconds with proper indexing.
- Right-to-erasure completes within 72 hours of request.
- All admin actions logged in AuditLog.

---

### Module 12 — AI Assistant / Query Classifier

**Purpose:** 24/7 public chatbot for general legal FAQ and inquiry routing.

**Owned Entities:** `AISession` (ephemeral, not persisted to main DB)

**Key Features:**
- Stateless chat widget embedded on public pages.
- LLM-backed (via API: OpenAI GPT-4o or Anthropic Claude) with legal FAQ system prompt.
- Classifies query into: CIVIL | CRIMINAL | FAMILY | CORPORATE | LABOUR | CONSUMER | OUT_OF_SCOPE.
- On classification: renders "Book a Consultation" or "Submit Inquiry" CTA specific to matter type.
- Disclaimer displayed on every message: "This is general information, not legal advice."
- Conversation history stored client-side only (sessionStorage); not sent to backend DB.
- Rate limit: 20 messages per IP per hour.
- Out-of-scope queries (e.g., non-legal) → graceful redirect: "I can only assist with legal queries."

**Inputs:**
- `POST /api/v1/ai/chat` (PUBLIC) — `{ message: string, session_id: string }`

**Outputs:**
- `{ reply: string, classification: string | null, cta: { type: string, url: string } | null }`

**Dependencies:** None (fully standalone module)

**Edge Cases:**
- LLM API unavailable → fallback to static FAQ responses from pre-defined JSON map.
- Hallucinated legal advice risk → system prompt includes hard instruction: never cite specific statutes or case law; never give case-specific advice.
- Rate limit exceeded → 429 with retry-after header.

**Success Criteria:**
- Classification accuracy > 85% on test set of 200 legal queries.
- Disclaimer present in 100% of responses.
- LLM API unavailability handled gracefully with static fallback in < 500ms.

---

## 6. API Contracts (Agent-Readable)

### 6.1 Auth — POST /api/v1/auth/login

```
Method:   POST
Auth:     PUBLIC
Path:     /api/v1/auth/login

Request:
{
  "email": "string | required",
  "password": "string | required | min: 8",
  "otp": "string | optional | 6-digit | required if user.two_fa_enabled = true"
}

Response 200:
{
  "access_token": "string (JWT)",
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "CLIENT | ADVOCATE | ADMIN"
  }
}
Set-Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh

Response 401: { "error": "INVALID_CREDENTIALS" }
Response 403: { "error": "2FA_REQUIRED" } | { "error": "OTP_INVALID" }
Response 423: { "error": "ACCOUNT_LOCKED", "retry_after_seconds": 1800 }
Response 422: { "error": "EMAIL_NOT_VERIFIED" }
```

---

### 6.2 Intake — POST /api/v1/intake/submit

```
Method:   POST
Auth:     PUBLIC
Path:     /api/v1/intake/submit

Request:
{
  "matter_type": "CIVIL | CRIMINAL | FAMILY | CORPORATE | LABOUR | CONSUMER | OTHER",
  "title": "string | required | max: 200",
  "description": "string | required | min: 100 | max: 2000",
  "urgency": "LOW | MEDIUM | HIGH | URGENT",
  "opposing_party_name": "string | optional",
  "visitor_name": "string | required",
  "visitor_email": "string | required | email",
  "visitor_phone": "string | required | E.164 format",
  "preferred_contact": "EMAIL | PHONE | WHATSAPP",
  "consent_given": "boolean | required | must be true",
  "captcha_token": "string | required"
}

Response 201:
{
  "inquiry_id": "uuid",
  "status": "NEW",
  "message": "Your inquiry has been received. You will be contacted within 1 business day."
}

Response 409: { "error": "DUPLICATE_INQUIRY", "existing_id": "uuid" }
Response 422: { "error": "CAPTCHA_FAILED" } | { "error": "CONSENT_REQUIRED" }
Response 422: { "errors": [{ "field": "string", "message": "string" }] }
```

---

### 6.3 Booking — GET /api/v1/booking/availability

```
Method:   GET
Auth:     PUBLIC
Path:     /api/v1/booking/availability

Query:
  date: "YYYY-MM-DD | required"
  consultation_type: "IN_PERSON | PHONE | VIDEO | optional"

Response 200:
{
  "date": "YYYY-MM-DD",
  "slots": [
    {
      "slot_id": "uuid",
      "start": "ISO 8601 timestamp",
      "end": "ISO 8601 timestamp",
      "available": "boolean",
      "consultation_types": ["IN_PERSON", "PHONE", "VIDEO"]
    }
  ]
}

Response 400: { "error": "INVALID_DATE_FORMAT" }
Response 404: { "error": "NO_AVAILABILITY_CONFIGURED" }
```

---

### 6.4 Booking — POST /api/v1/booking/appointments

```
Method:   POST
Auth:     PUBLIC
Path:     /api/v1/booking/appointments

Request:
{
  "slot_id": "uuid | required",
  "consultation_type": "IN_PERSON | PHONE | VIDEO",
  "visitor_name": "string | required",
  "visitor_email": "string | required | email",
  "visitor_phone": "string | required | E.164",
  "matter_summary": "string | required | min: 50 | max: 500",
  "opposing_party_name": "string | optional",
  "captcha_token": "string | required"
}

Response 201:
{
  "appointment_id": "uuid",
  "status": "PENDING_PAYMENT",
  "payment": {
    "razorpay_order_id": "string",
    "amount_inr": "integer (paise)",
    "currency": "INR",
    "key": "string (Razorpay public key)"
  }
}

Response 409: { "error": "SLOT_UNAVAILABLE" }
Response 422: { "error": "CAPTCHA_FAILED" }
```

---

### 6.5 Documents — POST /api/v1/documents/upload-url

```
Method:   POST
Auth:     CLIENT | ADVOCATE
Path:     /api/v1/documents/upload-url

Request:
{
  "case_id": "uuid | required",
  "file_name": "string | required",
  "file_type": "PDF | JPEG | PNG | DOCX | XLSX",
  "file_size_bytes": "integer | required | max: 26214400"
}

Response 200:
{
  "upload_url": "string (pre-signed S3 PUT URL, expires 15min)",
  "document_id": "uuid (provisional)",
  "storage_key": "string"
}

Response 403: { "error": "CASE_ACCESS_DENIED" }
Response 413: { "error": "FILE_TOO_LARGE", "max_bytes": 26214400 }
Response 415: { "error": "UNSUPPORTED_FILE_TYPE", "allowed": ["PDF","JPEG","PNG","DOCX","XLSX"] }
```

---

### 6.6 Documents — POST /api/v1/documents/confirm

```
Method:   POST
Auth:     CLIENT | ADVOCATE
Path:     /api/v1/documents/confirm

Request:
{
  "document_id": "uuid | required",
  "request_id": "uuid | optional"
}

Response 200:
{
  "document_id": "uuid",
  "virus_scan_status": "PENDING",
  "message": "File received. Virus scan in progress."
}

Response 404: { "error": "DOCUMENT_NOT_FOUND" }
Response 409: { "error": "ALREADY_CONFIRMED" }
```

---

### 6.7 Messages — POST /api/v1/messages

```
Method:   POST
Auth:     CLIENT | ADVOCATE
Path:     /api/v1/messages

Request:
{
  "case_id": "uuid | required",
  "content": "string | required | max: 5000",
  "attachment_id": "uuid | optional | FK: Document"
}

Response 201:
{
  "id": "uuid",
  "case_id": "uuid",
  "sender_id": "uuid",
  "content": "string (plaintext; stored encrypted)",
  "attachment_id": "uuid | null",
  "created_at": "ISO 8601"
}

Response 403: { "error": "NOT_A_PARTY_TO_CASE" }
Response 403: { "error": "CASE_IS_CLOSED" }
Response 422: { "error": "CONTENT_REQUIRED" }
```

---

### 6.8 Cases — PATCH /api/v1/cases/:id/status

```
Method:   PATCH
Auth:     ADVOCATE
Path:     /api/v1/cases/:id/status

Request:
{
  "status": "UNDER_REVIEW | ACCEPTED | ACTIVE | ON_HOLD | CLOSED | REJECTED",
  "reason": "string | required if status = REJECTED | max: 500"
}

Response 200:
{
  "id": "uuid",
  "previous_status": "string",
  "new_status": "string",
  "updated_at": "ISO 8601"
}

Response 422:
{
  "error": "INVALID_STATE_TRANSITION",
  "current_status": "string",
  "allowed_transitions": ["string"]
}
Response 409: { "error": "CONFLICT_CHECK_REQUIRED" }
Response 409: { "error": "ENGAGEMENT_LETTER_NOT_SIGNED" }
```

---

### 6.9 Billing — POST /api/v1/billing/invoices

```
Method:   POST
Auth:     ADVOCATE
Path:     /api/v1/billing/invoices

Request:
{
  "case_id": "uuid | required",
  "line_items": [
    {
      "description": "string | required",
      "quantity": "decimal | required",
      "rate_inr": "integer | required (paise)",
      "time_entry_id": "uuid | optional"
    }
  ],
  "gst_rate_percent": "decimal | default: 18.00",
  "due_date": "YYYY-MM-DD | required"
}

Response 201:
{
  "id": "uuid",
  "invoice_number": "string",
  "status": "DRAFT",
  "subtotal_inr": "integer",
  "gst_amount_inr": "integer",
  "total_inr": "integer",
  "pdf_url": "null (generated on issue)"
}

Response 422: { "errors": [{ "field": "string", "message": "string" }] }
Response 409: { "error": "TIME_ENTRY_ALREADY_BILLED", "entry_id": "uuid" }
```

---

### 6.10 Conflict Check — POST /api/v1/intake/:caseId/conflict-check

```
Method:   POST
Auth:     ADVOCATE
Path:     /api/v1/intake/:caseId/conflict-check

Request:
{
  "party_names": ["string"] // min 1, max 10 names
}

Response 200:
{
  "result": "CLEAR | FLAGGED | CONFLICT",
  "matched_cases": [
    {
      "case_id": "uuid",
      "case_number": "string",
      "match_reason": "string",
      "match_party": "string"
    }
  ],
  "checked_at": "ISO 8601"
}

Response 404: { "error": "CASE_NOT_FOUND" }
```

---

## 7. Key Workflows (Executable Flows)

### 7.1 Consultation Booking Flow

**Actors:** VISITOR, booking-service, payment-service (Razorpay), notification-service, calendar-service
**Trigger:** VISITOR submits `POST /api/v1/booking/appointments`

```
Step 1  VISITOR requests GET /api/v1/booking/availability?date=YYYY-MM-DD
        → booking-service returns available slots

Step 2  VISITOR submits POST /api/v1/booking/appointments
        → booking-service validates CAPTCHA
        → booking-service acquires optimistic lock on slot (Redis key: slot:{slot_id}, TTL: 15min)
        → booking-service creates Appointment record with status=PENDING_PAYMENT
        → booking-service creates Razorpay order via Razorpay API
        → Returns Razorpay order details to client

Step 3  VISITOR completes payment in Razorpay widget
        → Razorpay sends webhook POST /api/v1/booking/payments/verify

Step 4  booking-service validates webhook signature (HMAC-SHA256)
        → booking-service verifies idempotency: check Payment.gateway_payment_id not already processed
        → booking-service updates Payment.status = CAPTURED
        → booking-service updates Appointment.status = CONFIRMED
        → booking-service releases slot optimistic lock; marks slot as BOOKED

Step 5  If consultation_type = VIDEO:
        → booking-service calls Zoom/Google Meet OAuth API to generate meeting link
        → Stores link in Appointment.video_link

Step 6  booking-service enqueues notification.dispatch jobs:
        → EMAIL to visitor: confirmation + receipt + video_link (if applicable)
        → EMAIL to ADVOCATE: new booking notification
        → SMS to visitor: booking confirmation

Step 7  booking-service enqueues calendar sync job:
        → Adds event to ADVOCATE's Google/Outlook calendar

Step 8  booking-service enqueues 2 reminder jobs in BullMQ:
        → Job 1: delay = (slot_start - 24h) → SMS + EMAIL reminder
        → Job 2: delay = (slot_start - 1h) → SMS reminder

FAILURE STATES:
  - Razorpay webhook not received within 15min → slot lock expires → Appointment.status = CANCELLED
  - Payment captured but video link generation fails → mark Appointment.consultation_type = PHONE; notify ADVOCATE
  - Duplicate webhook → idempotency check returns early; return HTTP 200 with no DB change
```

---

### 7.2 Case Intake & Acceptance Flow

**Actors:** VISITOR, intake-service, auth-service, notification-service, document-service
**Trigger:** VISITOR submits `POST /api/v1/intake/submit`

```
Step 1  intake-service validates CAPTCHA token with Google reCAPTCHA v3
        → Score < 0.5 → return 422, log IP

Step 2  intake-service checks for duplicate inquiry:
        → Query: Case WHERE visitor_email = :email AND created_at > NOW() - 24h
        → If found → return 409 DUPLICATE_INQUIRY

Step 3  intake-service creates Case record: status=NEW, conflict_check_result=PENDING
        → intake-service enqueues notification.dispatch: EMAIL to ADVOCATE (new inquiry)

Step 4  ADVOCATE opens intake queue: GET /api/v1/intake/queue
        → Reviews case detail

Step 5  ADVOCATE runs POST /api/v1/intake/:caseId/conflict-check with party names
        → intake-service performs full-text search on all Case.opposing_party_name + ClientProfile.full_name
        → Returns CLEAR | FLAGGED | CONFLICT
        → Updates Case.conflict_check_result and creates ConflictCheckRecord

Step 6  If CONFLICT → ADVOCATE must reject or manually override with documented reason
        If FLAGGED → ADVOCATE may proceed with acknowledgment
        If CLEAR → ADVOCATE may accept

Step 7  ADVOCATE calls POST /api/v1/intake/:caseId/accept
        → intake-service validates conflict_check_result != CONFLICT
        → auth-service creates User (role=CLIENT) for visitor_email
        → auth-service sends welcome email with set-password link (expires 48h)
        → document-service initializes S3 folder: cases/{case_id}/
        → intake-service generates engagement letter PDF via template engine
        → intake-service calls Digio API to create eSign request
        → eSign link sent to client email via notification-service
        → Case.status → ACCEPTED

Step 8  CLIENT signs engagement letter via Digio widget
        → Digio webhook → intake-service updates Case.engagement_letter_signed = true
        → Case.status → ACTIVE
        → Client portal unlocked for this case

FAILURE STATES:
  - Set-password link expires → CLIENT requests resend from login page → new link generated
  - Digio API unavailable → store eSign request in pending state; retry hourly
  - ADVOCATE rejects → Case.status = REJECTED → notification-service sends rejection email to visitor
```

---

### 7.3 Document Upload & Review Flow

**Actors:** CLIENT, document-service, S3, virus-scanner, notification-service, ADVOCATE
**Trigger:** ADVOCATE creates DocumentRequest OR CLIENT proactively uploads

```
Step 1  ADVOCATE calls POST /api/v1/documents/requests (optional step)
        → Creates DocumentRequest record with description + deadline
        → notification-service: in-app + email to CLIENT with portal link

Step 2  CLIENT calls POST /api/v1/documents/upload-url
        → document-service validates CLIENT owns the case_id
        → document-service checks file_type and file_size_bytes
        → document-service generates pre-signed S3 PUT URL (expires 15min)
        → document-service creates provisional Document record: virus_scan_status=PENDING

Step 3  CLIENT uploads file directly to S3 using pre-signed URL
        → S3 enforces: content-type header must match file_type; size enforced by policy condition

Step 4  CLIENT calls POST /api/v1/documents/confirm with document_id
        → document-service verifies S3 object exists at storage_key
        → document-service checks version: if file_name exists in case → increment version, set previous_version_id
        → document-service enqueues virus-scan job to BullMQ

Step 5  Virus scanner (ClamAV worker) processes job:
        → Downloads file from S3 to ephemeral worker storage
        → Scans file
        → Updates Document.virus_scan_status = CLEAN | INFECTED
        → If INFECTED: moves file to quarantine S3 prefix; enqueues admin alert notification
        → If CLEAN: document becomes downloadable

Step 6  document-service enqueues notification.dispatch:
        → In-app + email to ADVOCATE: new document uploaded for Case #{case_number}

Step 7  If upload fulfills a DocumentRequest:
        → document-service updates DocumentRequest.status = FULFILLED
        → document-service emits document.request_fulfilled event

Step 8  ADVOCATE views document via GET /api/v1/documents/:id/download-url
        → document-service checks virus_scan_status = CLEAN before issuing pre-signed GET URL
        → AuditLog entry created: actor=ADVOCATE, action=DOCUMENT_DOWNLOADED, resource_id=document_id

FAILURE STATES:
  - S3 upload URL expires before CLIENT uploads → CLIENT must request new URL
  - Virus scan worker crashes → job remains in BullMQ; worker restarts and retries up to 3 times
  - File infected → CLIENT notified to re-upload a clean version; infected file blocked permanently
```

---

### 7.4 Case Lifecycle Management Flow

**Actors:** ADVOCATE, case-service, billing-service, notification-service
**Trigger:** ADVOCATE updates case via dashboard

```
Step 1  ADVOCATE loads case dashboard: GET /api/v1/cases
        → Returns all cases with status, next_hearing_date, urgency

Step 2  ADVOCATE selects case, updates status: PATCH /api/v1/cases/:id/status
        → case-service validates transition via state machine
        → If invalid → returns 422 with allowed_transitions
        → If valid → updates Case.status, creates CaseEvent audit record
        → notification-service: in-app notification to CLIENT of status change

Step 3  ADVOCATE adds hearing date: POST /api/v1/cases/:id/hearings
        → case-service stores HearingDate record
        → notification-service enqueues 3 reminder jobs: 30d, 7d, 1d before hearing
        → case-service syncs with eCourts API if CNR present

Step 4  ADVOCATE logs time: POST /api/v1/billing/time-entries
        → billing-service validates case is ACTIVE
        → Creates TimeEntry record; billed=false

Step 5  ADVOCATE generates invoice: POST /api/v1/billing/invoices
        → billing-service aggregates selected time entries
        → Computes subtotal, GST, total
        → Creates Invoice in DRAFT status
        → ADVOCATE reviews → PATCH /api/v1/billing/invoices/:id/issue
        → billing-service generates PDF, uploads to S3
        → notification-service: email to CLIENT with invoice PDF

Step 6  CLIENT pays invoice via portal
        → billing-service creates Razorpay order
        → On webhook: Invoice.status = PAID
        → notification-service: receipt to CLIENT

Step 7  ADVOCATE closes case: POST /api/v1/cases/:id/close
        → case-service checks: no DRAFT or ISSUED invoices outstanding
        → If check fails → returns 409 with outstanding invoice IDs
        → case-service updates Case.status = CLOSED, Case.closed_at = NOW()
        → case-service generates case summary PDF
        → document-service archives all case documents (sets archive flag; retains in S3)
        → notification-service: case closure notification to CLIENT
        → BullMQ: cancel all pending reminder jobs for this case

FAILURE STATES:
  - Status transition to CLOSED with outstanding invoices → 409; ADVOCATE must resolve billing
  - eCourts API sync fails → log failure; return last known data with staleness indicator
  - Case summary PDF generation fails → async retry; ADVOCATE notified when ready
```

---

## 8. State Machines

### 8.1 Case Lifecycle

```
States:
  NEW → UNDER_REVIEW → ACCEPTED → ACTIVE → CLOSED
                     ↘ REJECTED
  ACTIVE → ON_HOLD → ACTIVE
  ACTIVE → CLOSED
  NEW → REJECTED (immediate rejection without review)
  UNDER_REVIEW → CONFLICT_FLAGGED → UNDER_REVIEW (after manual review)

Transitions:

  NEW → UNDER_REVIEW
    Trigger: ADVOCATE opens intake record
    Guard: none

  UNDER_REVIEW → CONFLICT_FLAGGED
    Trigger: conflict_check_result = FLAGGED
    Guard: conflict check completed

  CONFLICT_FLAGGED → UNDER_REVIEW
    Trigger: ADVOCATE manually reviews and overrides with documented reason
    Guard: override_reason must be recorded

  UNDER_REVIEW → ACCEPTED
    Trigger: ADVOCATE calls accept endpoint
    Guard: conflict_check_result IN (CLEAR, manually_overridden)

  ACCEPTED → ACTIVE
    Trigger: CLIENT signs engagement letter (Digio webhook)
    Guard: engagement_letter_signed = true

  ACTIVE → ON_HOLD
    Trigger: ADVOCATE sets status
    Guard: none

  ON_HOLD → ACTIVE
    Trigger: ADVOCATE sets status
    Guard: none

  ACTIVE → CLOSED
    Trigger: ADVOCATE calls close endpoint
    Guard: no DRAFT or ISSUED invoices exist

  UNDER_REVIEW → REJECTED
    Trigger: ADVOCATE calls reject endpoint
    Guard: rejection_reason must be provided

  NEW → REJECTED
    Trigger: ADVOCATE calls reject endpoint
    Guard: rejection_reason must be provided

FORBIDDEN TRANSITIONS (return 422):
  Any transition not listed above.
  CLOSED → any state (cases cannot be reopened; create new case instead)
```

---

### 8.2 Appointment Lifecycle

```
States:
  PENDING_PAYMENT → CONFIRMED → COMPLETED
                 ↘ CANCELLED
  CONFIRMED → CANCELLED
  CONFIRMED → NO_SHOW

Transitions:

  PENDING_PAYMENT → CONFIRMED
    Trigger: Razorpay webhook payment capture received
    Guard: webhook signature valid + payment not already processed

  PENDING_PAYMENT → CANCELLED
    Trigger: Payment timeout (15 min) OR VISITOR cancels before payment
    Guard: slot lock TTL expired OR manual cancellation

  CONFIRMED → CANCELLED
    Trigger: CLIENT or ADVOCATE cancels
    Guard: cancellation_time > 24h before slot_start (for CLIENT); no guard for ADVOCATE
    Side-effect: refund initiated if CLIENT cancels > 24h before; no refund otherwise

  CONFIRMED → NO_SHOW
    Trigger: System sets at slot_end + 15 min if status still CONFIRMED
    Guard: automated cron job

  CONFIRMED → COMPLETED
    Trigger: ADVOCATE manually marks complete via dashboard
    Guard: current time > slot_start

FORBIDDEN TRANSITIONS:
  COMPLETED → any
  NO_SHOW → any (terminal)
  CANCELLED → any (terminal)
```

---

### 8.3 Invoice Lifecycle

```
States:
  DRAFT → ISSUED → PAID
               ↓
          PARTIALLY_PAID → PAID
               ↓
           OVERDUE → PAID
  DRAFT → CANCELLED
  ISSUED → CANCELLED (only if no payment received)

Transitions:

  DRAFT → ISSUED
    Trigger: ADVOCATE calls issue endpoint
    Guard: at least one line item exists; due_date is in the future

  ISSUED → PARTIALLY_PAID
    Trigger: Payment webhook; amount_paid < total_inr
    Guard: payment captured successfully

  ISSUED → PAID
    Trigger: Payment webhook; amount_paid = total_inr
    Guard: payment captured successfully

  PARTIALLY_PAID → PAID
    Trigger: Additional payment captured; cumulative amount_paid = total_inr

  ISSUED → OVERDUE
    Trigger: Daily cron job; due_date < TODAY AND status = ISSUED
    Guard: automated

  PARTIALLY_PAID → OVERDUE
    Trigger: Daily cron job; due_date < TODAY AND status = PARTIALLY_PAID

  OVERDUE → PAID
    Trigger: Payment captured; total amount settled

  ISSUED → CANCELLED
    Trigger: ADVOCATE cancels
    Guard: Payment.status != CAPTURED for this invoice

  DRAFT → CANCELLED
    Trigger: ADVOCATE cancels
    Guard: none

FORBIDDEN TRANSITIONS:
  PAID → any
  CANCELLED → any (terminal)
```

---

## 9. Non-Functional Requirements (Strict Constraints)

### 9.1 Security Rules

| Rule ID | Constraint | Enforcement Point |
|---|---|---|
| SEC-01 | All API endpoints require explicit RBAC annotation; no default public access | API gateway middleware |
| SEC-02 | JWT access token TTL: 900 seconds (15 min) | auth-service JWT issuance |
| SEC-03 | Refresh tokens stored in HTTP-only, Secure, SameSite=Strict cookie; never in localStorage | auth-service |
| SEC-04 | All data in transit over TLS 1.3 minimum | Cloudflare / load balancer |
| SEC-05 | All S3 documents encrypted with SSE-AES256; server-side encryption enforced via bucket policy | S3 bucket config |
| SEC-06 | Message content encrypted with AES-256 before DB insert; decrypted at API response layer only | messaging-service |
| SEC-07 | CLIENT identity documents (`id_number_encrypted`) encrypted at application level, AES-256 | client-service |
| SEC-08 | Mandatory TOTP 2FA for ADVOCATE and ADMIN; enforced at auth middleware, not UI | auth-service |
| SEC-09 | Rate limiting: 100 req/min per IP on public endpoints; 1000 req/min per authenticated user | API gateway |
| SEC-10 | CAPTCHA (reCAPTCHA v3, score ≥ 0.5) required on all PUBLIC POST endpoints | intake-service, booking-service |
| SEC-11 | `internal_notes` field stripped from all CLIENT-scoped API serializers | case-service serializer layer |
| SEC-12 | AuditLog table: INSERT-only; no UPDATE/DELETE at ORM or DB level (trigger enforced) | PostgreSQL trigger |
| SEC-13 | Pre-signed S3 URLs expire in 15 min (upload) and 5 min (download) | document-service |
| SEC-14 | Session invalidated on password change; all refresh tokens for that user revoked | auth-service |
| SEC-15 | Admin cannot access privileged case content without explicit ADVOCATE grant | case-service RBAC |

### 9.2 Performance Targets

| Metric | Target | Measurement |
|---|---|---|
| API read endpoint latency (P95) | < 500ms | APM (Datadog/Grafana) |
| Page LCP (mobile, 4G) | < 2.5 seconds | Lighthouse / Web Vitals |
| Slot availability query | < 200ms | APM |
| Conflict check (10K case DB) | < 3 seconds | load test |
| Message WebSocket delivery | < 1 second | synthetic monitoring |
| PDF generation | < 3 seconds | APM |
| Virus scan completion | < 60 seconds | queue monitoring |
| Payment webhook processing | < 5 seconds | Razorpay dashboard |

### 9.3 Scalability Constraints

- Backend services must be stateless; no in-process session storage.
- All shared state in Redis (sessions, rate limits, job queues).
- PostgreSQL connection pooling via PgBouncer; max 20 connections per service instance.
- S3 object storage with no capacity ceiling; `cases/` prefix per case for isolation.
- BullMQ workers horizontally scalable; each worker type (email, sms, pdf, virus-scan) independently scalable.
- Database schema designed for multi-tenancy: `advocate_id` present on all case-related tables for future firm expansion.

### 9.4 Reliability Requirements

| Requirement | Specification |
|---|---|
| Uptime SLA | 99.9% monthly (max 43.8 min/month downtime) |
| Database backups | Automated daily snapshots; 30-day retention; encrypted |
| Recovery Point Objective | ≤ 24 hours |
| Recovery Time Objective | ≤ 4 hours |
| Graceful degradation | Booking failure must not impact inquiry form; each module independently deployable |
| BullMQ dead-letter queue | All jobs that fail 3 retries → DLQ; ADMIN alerted via email |
| Health endpoints | Each service exposes `GET /health` → `{ status: "ok" | "degraded", checks: {...} }` |
| Circuit breaker | External API calls (Razorpay, Digio, eCourts) wrapped in circuit breaker (3 failures → open for 30s) |

### 9.5 Compliance Constraints

| Rule | Requirement | Implementation |
|---|---|---|
| DPDPA-01 | Explicit, informed consent at intake | `consent_given: boolean` required field on intake and booking forms; stored with timestamp |
| DPDPA-02 | Purpose limitation | Data collected only for stated legal service purpose; no marketing use without separate consent |
| DPDPA-03 | Right to erasure | Admin executes data deletion within 72h of request; cascades across all tables |
| DPDPA-04 | Data localization | All data stored in India-region cloud infrastructure (AWS ap-south-1) |
| BCI-01 | No superlative claims | CMS content validator rejects posts containing keywords: "best", "top-rated", "most experienced" |
| BCI-02 | Testimonials anonymised | Testimonial body validated: no names (pattern match), no phone numbers, no case reference numbers |
| BCI-03 | Legal disclaimer | Middleware injects disclaimer header into all public page responses |
| GST-01 | GST-compliant invoices | Invoice PDF includes: GSTIN, HSN code 998212, GST rate, tax amount, place of supply |
| WCAG-01 | Accessibility | All public pages pass WCAG 2.1 AA automated audit (axe-core); manual audit before launch |

---

## 10. Integrations (Explicit Contracts)

### 10.1 Razorpay

```
Purpose:       Payment collection for consultation fees and case invoices
Interaction:   REST API (server-to-server) + Client-side Razorpay.js widget + Webhooks
Credentials:   key_id (public), key_secret (private, env var)

Create Order:
  POST https://api.razorpay.com/v1/orders
  Body: { amount: integer (paise), currency: "INR", receipt: string, notes: {} }
  Response: { id: string (order_id), ... }

Verify Payment Webhook:
  Event: payment.captured
  Validation: HMAC-SHA256(webhook_secret, raw_body) === X-Razorpay-Signature header
  Idempotency: check Payment table for existing gateway_payment_id before processing

Refund:
  POST https://api.razorpay.com/v1/payments/:payment_id/refund
  Body: { amount: integer (paise), speed: "normal" }

Data Exchanged:
  Outbound: amount, currency, receipt, customer_name, customer_email, customer_contact
  Inbound: payment_id, order_id, status, method, captured_at

Failure Fallback:
  Razorpay API unreachable → return 503 to client with "Payment service temporarily unavailable"
  Webhook not received → slot/invoice remains in PENDING state; cron job cancels after 15min (bookings) / 7 days (invoices)
```

---

### 10.2 Digio (eSign)

```
Purpose:       Legally binding electronic signature on engagement letters and vakalatnamas
Interaction:   REST API (server-to-server) + Digio embedded widget for client signing
Credentials:   client_id, client_secret (env vars)

Create Sign Request:
  POST https://api.digio.in/client/sign/request
  Body: { signers: [{ identifier: email, name: string }], file_name: string, file_data: base64 }
  Response: { request_id: string, signing_url: string }

Webhook (Signing Complete):
  Event: sign_request.completed
  Payload: { request_id: string, status: "completed", signed_file_url: string }
  Action: update Case.engagement_letter_signed = true, store signed_file_url

Data Exchanged:
  Outbound: PDF document (base64), signer email, signer name
  Inbound: signing status, signed document URL

Failure Fallback:
  Digio API unavailable → store pending eSign request; retry every 1 hour via BullMQ
  Signing link expired (typically 72h) → ADVOCATE regenerates via dashboard action
```

---

### 10.3 MSG91 / Twilio (SMS + WhatsApp)

```
Purpose:       OTP delivery, hearing reminders, booking confirmations, invoice alerts
Interaction:   REST API (server-to-server)

SMS Send:
  POST https://api.msg91.com/api/v5/flow/
  Body: { flow_id: string, sender: string, mobiles: string, VAR1: string, ... }

WhatsApp Send (opt-in users only):
  POST https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/
  Body: { integrated_number: string, content_type: "template", payload: { messaging_product: "whatsapp", to: string, type: "template", template: { name: string, language: {}, components: [] } } }

OTP Flow:
  POST https://api.msg91.com/api/v5/otp
  Verify: POST https://api.msg91.com/api/v5/otp/verify

Data Exchanged:
  Outbound: recipient phone, message template ID, dynamic variables (name, date, amount, link)
  Inbound: delivery status (delivered, failed, undelivered)

Failure Fallback:
  SMS delivery fails → notification.status = FAILED; retry up to 3 times
  WhatsApp not delivered → fallback to SMS automatically
  Phone number invalid → skip SMS channel; proceed with email only
```

---

### 10.4 SendGrid / Amazon SES (Email)

```
Purpose:       All transactional email: OTP, confirmations, invoices, reminders, account setup
Interaction:   REST API (SendGrid) or SMTP/SDK (SES)

Send Email:
  POST https://api.sendgrid.com/v3/mail/send
  Headers: Authorization: Bearer SENDGRID_API_KEY
  Body: { from: {}, to: [], subject: string, content: [{ type: "text/html", value: string }], template_id: string, dynamic_template_data: {} }

Bounce Handling:
  SendGrid webhook: event=bounce → mark user email as invalid; disable email notifications

Data Exchanged:
  Outbound: recipient email, template ID, dynamic variables
  Inbound: delivery events (delivered, opened, bounced, spam_reported)

Failure Fallback:
  SendGrid unavailable → switch to Amazon SES as secondary provider
  Both unavailable → queue email for retry up to 24h; mark notification.status = QUEUED
```

---

### 10.5 eCourts Services API (NIC)

```
Purpose:       Fetch case status and next hearing dates using CNR number
Interaction:   REST API (NIC eCourts)
Base URL:      https://services.ecourts.gov.in/ecourtindia_v6/ (verify current endpoint)

Fetch Case Status:
  GET /case_status?cno={cnr_number}&token={api_token}
  Response: { case_no: string, case_type: string, filing_date: string, next_hearing_date: string, case_status: string }

Data Exchanged:
  Outbound: CNR number, API token
  Inbound: case status, next hearing date, court details

Failure Fallback:
  API unavailable → return last synced data with { last_synced_at: timestamp, data_stale: true }
  CNR not found → notify ADVOCATE: "CNR number not found in eCourts; please verify manually"
  Rate limit → retry after 60 seconds; maximum 2 retries
```

---

### 10.6 Google Calendar / Outlook 365

```
Purpose:       Two-way calendar sync for appointment bookings
Interaction:   OAuth 2.0 + REST API (Google Calendar API v3 / Microsoft Graph API)

Create Event:
  POST https://www.googleapis.com/calendar/v3/calendars/primary/events
  Body: { summary: string, start: { dateTime: ISO8601 }, end: { dateTime: ISO8601 }, description: string, attendees: [{ email: string }] }

Delete Event:
  DELETE https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}

Data Exchanged:
  Outbound: event title (case type + client initials), start/end time, description (matter type only; no confidential details), attendee email (ADVOCATE only)
  Inbound: event ID for future update/delete

Failure Fallback:
  OAuth token expired → trigger re-authentication flow; queue calendar sync until re-authed
  API unavailable → log failure; manual calendar entry instructions sent to ADVOCATE
```

---

## 11. Agent Execution Plan

### 11.1 Task Breakdown

**Module 01 — Auth Service:**
- T01-01: Implement User entity and Prisma schema
- T01-02: Implement registration + email verification endpoints
- T01-03: Implement login + JWT issuance + refresh token rotation
- T01-04: Implement TOTP 2FA (speakeasy library)
- T01-05: Implement OTP-SMS 2FA for CLIENT
- T01-06: Implement RBAC middleware (role guard factory)
- T01-07: Implement rate limiting (Redis sliding window)
- T01-08: Implement password reset flow
- T01-09: Write unit tests: token validation, RBAC, rate limiting

**Module 02 — Public CMS Service:**
- T02-01: Implement AdvocateProfile, BlogPost, Testimonial, PracticeArea, FeeStructure Prisma schemas
- T02-02: Implement public read endpoints (profile, blog, testimonials, fees)
- T02-03: Implement CMS write endpoints (ADVOCATE-scoped: blog CRUD, testimonial submit)
- T02-04: Implement SEO metadata generation (JSON-LD schema for LegalService)
- T02-05: Implement BCI compliance content validator (reject superlative keywords)
- T02-06: Implement testimonial PII validator
- T02-07: Build Next.js SSG/SSR pages for all public routes
- T02-08: Implement cookie consent component

**Module 03 — Intake Service:**
- T03-01: Implement Case entity and Prisma schema
- T03-02: Implement multi-step intake form (frontend) with validation
- T03-03: Implement intake submission endpoint with CAPTCHA verification
- T03-04: Implement conflict check engine (PostgreSQL full-text search + fuzzy match using pg_trgm)
- T03-05: Implement ConflictCheckRecord entity
- T03-06: Implement intake queue endpoint for ADVOCATE
- T03-07: Implement accept/reject endpoints with downstream event emission
- T03-08: Integrate Digio eSign for engagement letter generation
- T03-09: Write integration tests: conflict check accuracy, state transitions

**Module 04 — Booking Service:**
- T04-01: Implement AvailabilitySlot and Appointment Prisma schemas
- T04-02: Implement availability template CRUD (ADVOCATE)
- T04-03: Implement real-time availability query endpoint with Redis slot locking
- T04-04: Implement appointment creation + Razorpay order generation
- T04-05: Implement Razorpay webhook handler with HMAC validation + idempotency
- T04-06: Implement Zoom/Google Meet OAuth link generation
- T04-07: Implement cancellation + refund trigger
- T04-08: Implement appointment-to-case conversion endpoint
- T04-09: Implement BullMQ reminder scheduling (24h, 1h before slot)
- T04-10: Write concurrency tests: slot double-booking prevention

**Module 05 — Client Portal (Frontend):**
- T05-01: Implement authenticated portal layout with RBAC guard
- T05-02: Implement case list dashboard with status badges
- T05-03: Implement case detail page with tabs (documents, messages, invoices, timeline)
- T05-04: Implement Digio eSign widget embedding for engagement letters
- T05-05: Implement notification centre with unread count
- T05-06: Implement account settings page (password, phone, 2FA)
- T05-07: Write E2E test: CLIENT cannot access another CLIENT's case

**Module 06 — Document Service:**
- T06-01: Implement Document and DocumentRequest Prisma schemas
- T06-02: Implement pre-signed S3 upload URL generation with policy conditions
- T06-03: Implement upload confirmation + S3 object verification
- T06-04: Implement file versioning logic
- T06-05: Implement ClamAV/VirusTotal virus scan BullMQ worker
- T06-06: Implement quarantine logic for infected files
- T06-07: Implement DocumentRequest CRUD
- T06-08: Implement pre-signed S3 download URL with access log
- T06-09: Write tests: version increment, infected file quarantine, access control

**Module 07 — Messaging Service:**
- T07-01: Implement Message Prisma schema with AES-256 encryption/decryption hooks
- T07-02: Implement paginated message history endpoint
- T07-03: Implement send message endpoint with case-party validation
- T07-04: Implement WebSocket server (Socket.IO) with case-scoped rooms
- T07-05: Implement polling fallback endpoint
- T07-06: Implement read receipts
- T07-07: Implement PDF export of message history
- T07-08: Enforce INSERT-only constraint at PostgreSQL level (trigger or no UPDATE/DELETE grants)
- T07-09: Write tests: message isolation, encryption verification, closed case blocking

**Module 08 — Case Management Dashboard:**
- T08-01: Implement Case Management backend extensions: hearings, notes, CaseEvent
- T08-02: Implement PATCH status endpoint with state machine validation
- T08-03: Implement hearing CRUD endpoints
- T08-04: Implement limitation date alert query (cases within 30 days)
- T08-05: Implement eCourts API sync endpoint with circuit breaker
- T08-06: Implement case close endpoint with billing guard
- T08-07: Implement case summary PDF generation (Puppeteer/Playwright)
- T08-08: Build Kanban board UI (frontend) with drag-to-update
- T08-09: Build hearing calendar UI with colour coding
- T08-10: Write state machine unit tests covering all transition rules

**Module 09 — Billing Service:**
- T09-01: Implement Invoice, TimeEntry, Payment Prisma schemas
- T09-02: Implement time entry CRUD (with immutability guard on billed entries)
- T09-03: Implement invoice creation with line items + GST calculation
- T09-04: Implement invoice issue endpoint + PDF generation
- T09-05: Implement Razorpay payment link creation for CLIENT
- T09-06: Implement payment webhook handler (idempotent)
- T09-07: Implement overdue detection cron job (daily)
- T09-08: Implement partial payment recording
- T09-09: Write tests: GST accuracy, webhook idempotency, immutable billed entries

**Module 10 — Notification Service:**
- T10-01: Implement Notification Prisma schema
- T10-02: Implement BullMQ notification dispatcher with channel routing
- T10-03: Implement SendGrid email integration with template engine (Handlebars)
- T10-04: Implement MSG91 SMS + WhatsApp integration
- T10-05: Implement retry logic with exponential backoff
- T10-06: Implement dead-letter queue handler with ADMIN alert
- T10-07: Implement in-app notification endpoints
- T10-08: Implement notification preference management
- T10-09: Implement scheduled reminder job manager (create, cancel by job ID)
- T10-10: Write tests: channel routing, retry exhaustion, reminder cancellation

**Module 11 — Admin Panel:**
- T11-01: Implement Admin Panel backend: user management CRUD
- T11-02: Implement audit log viewer endpoint with pagination + filters
- T11-03: Implement testimonial moderation endpoints
- T11-04: Implement system configuration CRUD with encrypted storage
- T11-05: Implement data export job (async, generates ZIP, emails link)
- T11-06: Implement data deletion workflow with 72h delay and cascade
- T11-07: Implement analytics aggregate queries
- T11-08: Build Admin Panel frontend pages
- T11-09: Write tests: ADMIN cannot suspend another ADMIN, data deletion cascade

**Module 12 — AI Assistant:**
- T12-01: Design LLM system prompt with BCI compliance constraints
- T12-02: Implement chat API endpoint with rate limiting
- T12-03: Implement classification parser (extract category from LLM response)
- T12-04: Implement static FAQ fallback (JSON map for LLM downtime)
- T12-05: Build chat widget UI with disclaimer display
- T12-06: Write tests: disclaimer present in responses, rate limit enforcement, classification accuracy

---

### 11.2 Parallelization Strategy

The following modules have no inter-dependencies at build time and can be assigned to parallel agent instances:

**Parallel Track A (Infrastructure + Auth):**
- T01 (Auth Service) — prerequisite for all other modules
- Database schema migration (all entities) — prerequisite for all services

**Parallel Track B (can start after T01 completes):**
- T02 (Public CMS)
- T04 (Booking Service)
- T10 (Notification Service)
- T12 (AI Assistant)

**Parallel Track C (can start after T01 + T03 complete):**
- T05 (Client Portal)
- T06 (Document Service)
- T07 (Messaging Service)
- T09 (Billing Service)

**Parallel Track D (depends on T03 + T06 + T09 complete):**
- T08 (Case Management Dashboard)
- T11 (Admin Panel)

---

### 11.3 Dependency Graph

```
[DB Schema] ──────────────────────────────┐
[Auth - T01] ─────────────────────────────┤
                                           ▼
[Intake - T03] ──┬──> [Client Portal - T05]
                 ├──> [Document Service - T06]
                 ├──> [Messaging Service - T07]
                 └──> [Case Management - T08]

[Notification - T10] ◄── ALL modules (event consumer)

[Booking - T04] ──┬──> [Billing - T09] (payment pattern reuse)
                  └──> [Notification - T10]

[Billing - T09] ──> [Case Management - T08] (close guard)

[Case Mgmt - T08] ──> [Admin Panel - T11]
[Document - T06] ──> [Admin Panel - T11]

[Public CMS - T02] ── standalone
[AI Assistant - T12] ── standalone

Execution Order:
  Phase 0: DB Schema + Auth
  Phase 1: Notification, Intake, Booking, Public CMS, AI Assistant (parallel)
  Phase 2: Client Portal, Document Service, Messaging, Billing (parallel, after Phase 1)
  Phase 3: Case Management Dashboard, Admin Panel (parallel, after Phase 2)
  Phase 4: Integration testing + E2E test suites
```

---

### 11.4 Validation Checkpoints

| Checkpoint | After Module(s) | Verification Required |
|---|---|---|
| CP-01 | Auth (T01) | JWT issued; 2FA enforced for ADVOCATE; RBAC guard rejects unauthorized role |
| CP-02 | DB Schema | All migrations run cleanly; foreign keys enforced; AuditLog INSERT-only trigger active |
| CP-03 | Intake (T03) | Intake form submits; conflict check returns CLEAR/FLAGGED/CONFLICT; accept triggers client account creation |
| CP-04 | Booking (T04) | Slot selected; payment order created; webhook processes; slot locked; no double-booking under load |
| CP-05 | Document (T06) | Pre-signed URL generated; file uploaded to S3; virus scan executes; infected file quarantined |
| CP-06 | Messaging (T07) | Message encrypted in DB; WebSocket delivers in < 1s; CLIENT from different case blocked (403) |
| CP-07 | Billing (T09) | Invoice created with correct GST; payment captured via webhook; invoice status transitions correctly |
| CP-08 | Notifications (T10) | Email sent; SMS sent; reminder dispatched at correct delay; cancelled hearing cancels job |
| CP-09 | Case Mgmt (T08) | State machine rejects invalid transitions; internal_notes absent from CLIENT API; eCourts sync works |
| CP-10 | Client Portal (T05) | CLIENT cannot access another case; eSign flow completes; portal loads in < 2.5s |
| CP-11 | Admin Panel (T11) | ADMIN can suspend user; audit log query returns; testimonial approved → appears on public site |
| CP-12 | Full E2E | Complete booking → intake → case acceptance → document upload → message → invoice → payment → close flow executes without errors |

---

## 12. Testing Strategy

### 12.1 Unit Tests (Per Module)

| Module | Key Unit Tests |
|---|---|
| Auth | JWT generation/validation, bcrypt hash, TOTP verification, rate limit counter |
| Intake | Conflict check matching accuracy (CLEAR/FLAGGED/CONFLICT scenarios), CAPTCHA rejection |
| Booking | Slot availability query, optimistic lock acquisition, Razorpay HMAC validation |
| Documents | Pre-signed URL generation, version increment logic, virus scan status transitions |
| Messaging | AES-256 encrypt/decrypt roundtrip, case-party validation, INSERT-only enforcement |
| Billing | GST calculation (multiple rates), billed entry immutability, overdue detection |
| Notifications | Channel routing logic, retry backoff timing, job cancellation |
| Case Mgmt | All state machine transition rules (valid + invalid), limitation date alert query |

### 12.2 Integration Tests (Cross-Module)

| Test ID | Scenario |
|---|---|
| INT-01 | Intake accepted → CLIENT account created → engagement letter generated → eSign webhook → Case status ACTIVE |
| INT-02 | Document uploaded → virus scan CLEAN → ADVOCATE download → AuditLog entry created |
| INT-03 | Invoice issued → Razorpay payment captured via webhook → Invoice status PAID → receipt notification sent |
| INT-04 | Hearing added → BullMQ job created → hearing deleted → BullMQ job cancelled |
| INT-05 | Case closed with outstanding invoice → 409 returned → invoice paid → case closed successfully |
| INT-06 | Admin suspends CLIENT → CLIENT login attempt → 403 returned |
| INT-07 | Testimonial submitted → admin approves → appears on public endpoint |

### 12.3 End-to-End Tests (User Flows)

| Test ID | Flow | Tool |
|---|---|---|
| E2E-01 | VISITOR books consultation → pays → receives confirmation email | Playwright |
| E2E-02 | VISITOR submits inquiry → ADVOCATE runs conflict check → accepts → CLIENT receives credentials → signs engagement letter | Playwright |
| E2E-03 | CLIENT uploads document → virus scan passes → ADVOCATE downloads → AuditLog records download | Playwright |
| E2E-04 | ADVOCATE and CLIENT exchange messages → real-time delivery via WebSocket | Playwright + WebSocket client |
| E2E-05 | ADVOCATE creates invoice → CLIENT pays via portal → receipt generated | Playwright |
| E2E-06 | CLIENT attempts to access another CLIENT's case URL → 403 returned | Playwright |
| E2E-07 | ADVOCATE closes case → summary PDF generated → all documents archived | Playwright |

---

## 13. Assumptions

| ID | Assumption | Implication |
|---|---|---|
| A-01 | Single advocate deployment (no multi-advocate firm at launch) | All cases have one `advocate_id`; schema supports future extension |
| A-02 | Indian jurisdiction (Maharashtra / High Court) | DPDPA applies; Razorpay used; GST 18% on legal services; INR only |
| A-03 | Bar Council of India advertising rules apply | CMS validator, testimonial anonymisation enforced |
| A-04 | Advocate manages their own platform (no separate clerk role) | No clerk/paralegal role at launch; can be added as future role |
| A-05 | Consultation fee is fixed (not variable by matter type) | Single `consultation_fee_inr` on AdvocateProfile; can be extended per practice area |
| A-06 | eSign via Digio is legally valid for engagement letters in target jurisdiction | If not, fallback to physical signature with scanned upload |
| A-07 | S3-compatible storage available (AWS or self-hosted MinIO) | Bucket names and keys designed for either provider |
| A-08 | eCourts API access is available and stable | Circuit breaker protects against API instability; CNR sync is optional enhancement |
| A-09 | WhatsApp Business API requires opt-in | WhatsApp notifications only sent to users who have explicitly opted in |
| A-10 | Engagement letter template is a static PDF template with dynamic fields | No advanced document assembly at launch; ADVOCATE uploads custom template optionally |

---

## 14. Success Criteria

The PRD is considered implementation-complete if all of the following are satisfied:

| Criterion | Condition |
|---|---|
| Module independence | Each of the 12 modules can be assigned to a separate AI agent and built without requiring clarification from another module's agent, using this PRD alone. |
| API unambiguity | Every API endpoint defined in Section 6 specifies: method, path, auth requirement, request schema, success response schema, and all expected error codes. No endpoint has undefined behavior. |
| Data model completeness | Every entity in Section 4 has: all fields with types and constraints, all relationships, and a valid JSON schema. No field is listed without a type. |
| Workflow determinism | Every workflow in Section 7 specifies exact API calls, state transitions, and failure handling paths. No step says "handle appropriately" without specifying the exact handling. |
| State machine coverage | Every allowed and forbidden state transition for Case, Appointment, and Invoice is explicitly listed in Section 8. No ambiguous "etc." transitions. |
| Feature traceability | Every feature from the input specification (Sections 1–7 of the source document) maps to at least one module, API endpoint, entity field, or workflow step in this PRD. |
| Security non-negotiables | All 15 security rules in Section 9.1 have a designated enforcement point. No security rule is aspirational without an implementation target. |
| Compliance traceability | All DPDPA and Bar Council of India rules map to a concrete implementation constraint in Section 9.5. |
| Parallelization feasibility | The dependency graph in Section 11.3 enables a minimum of 4 modules to be built in parallel at any phase. |

---

*PRD Version: 1.0 | Target: Antigravity AI Agent Execution | Jurisdiction: India*
*Input Source: LexDesk Advocate Website Feature Specification v1.0*
