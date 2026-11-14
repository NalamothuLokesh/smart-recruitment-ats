# Smart Recruitment & Applicant Tracking System (ATS)
## Role-Based Access Control (RBAC) & Permission Matrix

This document defines the server-enforced access boundaries across all system roles. Any violation of these rules is intercepted by the backend RBAC middleware (`requireAuth` and `requireRole(...)`), returning an HTTP `401 Unauthorized` or `403 Forbidden`.

---

## 1. Role Definitions

| Role | Scope & Description |
| :--- | :--- |
| **PUBLIC (Unauthenticated)** | External visitors exploring open job postings or creating a new candidate account. |
| **CANDIDATE** | External job seekers who apply for jobs, manage personal resumes, track stage progression, attend interviews, and respond to job offers. |
| **HR (Recruiter / Hiring Team)** | Internal recruitment professionals who create and manage job postings, review applicants, execute stage transitions, schedule interviews, and issue job offers. |
| **ADMIN (System Administrator)** | Organization superusers with full platform control, user provisioning (HR/Admin accounts), account suspension, and system-wide audit access. |

---

## 2. Granular Endpoint Permission Matrix

| Module / Resource | Endpoint | Method | PUBLIC | CANDIDATE | HR | ADMIN | Notes & Access Boundaries |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Auth** | `/api/v1/auth/register` | `POST` | ✅ | ❌ | ❌ | ❌ | Candidate self-registration only. |
| | `/api/v1/auth/login` | `POST` | ✅ | ✅ | ✅ | ✅ | Universal credentials login. |
| | `/api/v1/auth/me` | `GET` | ❌ | ✅ | ✅ | ✅ | Returns active user profile context. |
| **Admin** | `/api/v1/admin/users` | `GET` | ❌ | ❌ | ❌ | ✅ | User directory search and filter. |
| | `/api/v1/admin/users` | `POST` | ❌ | ❌ | ❌ | ✅ | Provision internal HR or ADMIN accounts. |
| | `/api/v1/admin/users/:id/role` | `PATCH` | ❌ | ❌ | ❌ | ✅ | Change role (`ADMIN`, `HR`, `CANDIDATE`). |
| | `/api/v1/admin/users/:id/status`| `PATCH` | ❌ | ❌ | ❌ | ✅ | Deactivate or restore user account. |
| | `/api/v1/admin/audit-logs` | `GET` | ❌ | ❌ | ❌ | ✅ | System-wide application audit trail. |
| **Jobs** | `/api/v1/jobs` | `GET` | ✅* | ✅* | ✅ | ✅ | *Public/Candidates restricted to `PUBLISHED` jobs only. |
| | `/api/v1/jobs/:id` | `GET` | ✅* | ✅* | ✅ | ✅ | *Must be `PUBLISHED` unless HR/Admin. |
| | `/api/v1/jobs` | `POST` | ❌ | ❌ | ✅ | ✅ | Create new job requisition. |
| | `/api/v1/jobs/:id` | `PUT` | ❌ | ❌ | ✅ | ✅ | Modify job requirements and details. |
| | `/api/v1/jobs/:id/status` | `PATCH` | ❌ | ❌ | ✅ | ✅ | Publish, close, or archive job postings. |
| **Candidates & Resumes** | `/api/v1/candidates/profile` | `GET` | ❌ | ✅ (Own) | ✅ (All) | ✅ (All) | HR/Admin can inspect candidate profiles. |
| | `/api/v1/candidates/profile` | `PUT` | ❌ | ✅ | ❌ | ❌ | Candidate edits their own profile. |
| | `/api/v1/candidates/resume` | `POST` | ❌ | ✅ | ❌ | ❌ | Upload resume file (max 5MB, PDF/DOC/DOCX). |
| | `/api/v1/candidates/resume/:id/download` | `GET` | ❌ | ✅ (Own) | ✅ (All) | ✅ (All) | Private stream delivery; never static public URL. |
| **Applications & Pipeline** | `/api/v1/applications` | `POST` | ❌ | ✅ | ❌ | ❌ | Candidate applies to a published job. |
| | `/api/v1/applications/my` | `GET` | ❌ | ✅ | ❌ | ❌ | Candidate views their submitted applications. |
| | `/api/v1/applications` | `GET` | ❌ | ❌ | ✅ | ✅ | HR/Admin recruitment pipeline board. |
| | `/api/v1/applications/:id/stage` | `PATCH` | ❌ | ❌ | ✅ | ✅ | Controlled state transition with audit log. |
| **Interviews** | `/api/v1/interviews` | `POST` | ❌ | ❌ | ✅ | ✅ | Schedule candidate interview. |
| | `/api/v1/interviews` | `GET` | ❌ | ✅ (Own) | ✅ (All) | ✅ (All) | Candidates see only their own interviews. |
| | `/api/v1/interviews/:id` | `PATCH` | ❌ | ❌ | ✅ | ✅ | Reschedule, cancel, or submit evaluation. |
| **Offers & Onboarding** | `/api/v1/offers` | `POST` | ❌ | ❌ | ✅ | ✅ | Generate offer for `SELECTED` candidate. |
| | `/api/v1/offers/:id/respond` | `PATCH` | ❌ | ✅ (Own) | ❌ | ❌ | Candidate accepts or declines offer. |
| | `/api/v1/offers/:id/onboarding` | `GET` | ❌ | ✅ (Own) | ✅ (All) | ✅ (All) | View onboarding checklist tasks. |
| | `/api/v1/offers/onboarding/:taskId` | `PATCH` | ❌ | ✅ (Own) | ✅ (All) | ✅ (All) | Toggle onboarding task completion. |
| **Analytics** | `/api/v1/analytics/summary` | `GET` | ❌ | ❌ | ✅ | ✅ | Real-time recruitment KPIs & pipeline funnel. |

---

## 3. Data Protection & File Privacy Architecture

1. **Storage Isolation**: Resumes uploaded via `POST /api/v1/candidates/resume` are stored under `backend/uploads/` with randomized unique filenames (`resume_{userId}_{timestamp}_{hash}.{ext}`).
2. **No Public Static Directory**: The `uploads/` directory is **never** exposed as static middleware (e.g., `express.static('uploads')` is strictly forbidden).
3. **Owner & Role Verification**: Every download request to `GET /api/v1/candidates/resume/:id/download` looks up the database record and verifies that `req.user.id === resume.candidate_id` OR `['HR', 'ADMIN'].includes(req.user.role)`.
4. **Content Header Sanitization**: Downloads are transmitted with explicit `Content-Type` headers and `Content-Disposition: attachment; filename="..."` to prevent MIME-sniffing and cross-site execution.

