# Smart Recruitment & Applicant Tracking System (ATS)
## Team Work Distribution & 4-Week Delivery Roadmap (Qveto Framework)

This document establishes the 4-week project execution timeline, division of ownership, branch isolation strategy, and acceptance criteria across all team members.

---

## 1. Team Ownership & Modular Division

| Teammate / Role | Area of Responsibility | Assigned Module File(s) | Pre-wired API Handlers |
| :--- | :--- | :--- | :--- |
| **Team Lead / Principal Architect** | Core Backend, DB Schema, RBAC, API Client & Test Harness | `backend/`, `database/`, `src/api/client.js`, `src/context/` | Complete Full-Stack Core |
| **Teammate 1: Admin Engineer** | Admin Operations & User Provisioning | `src/modules/admin/AdminDashboard.jsx` | `adminApi.*` |
| **Teammate 2: Job Catalog Engineer** | Job Creation & Public Job Board | `src/modules/hr-jobs/JobManagementPage.jsx`<br>`src/modules/hr-jobs/PublicJobBoard.jsx` | `jobsApi.*` |
| **Teammate 3: Pipeline Lead** | Candidate Pipeline & Stage State Machine | `src/modules/hr-pipeline/HrPipelineBoard.jsx` | `applicationsApi.*` |
| **Teammate 4: Interviews & Offers Specialist** | Interview Scheduling & Offer Letter Generator | `src/modules/interviews-offers/InterviewSchedulerPage.jsx`<br>`src/modules/interviews-offers/OfferOnboardingPage.jsx` | `interviewsApi.*`<br>`offersApi.*` |
| **Teammate 5: Candidate Experience Engineer** | Candidate Portal, Resume Uploads & Status Tracker | `src/modules/candidate/CandidateDashboard.jsx` | `candidateApi.*`<br>`applicationsApi.*` |
| **Teammate 6: Analytics & BI Engineer** | Recruitment Metrics, KPIs & Stage Conversion Funnel | `src/modules/analytics/HiringAnalyticsPage.jsx` | `analyticsApi.*` |

---

## 2. Qveto 4-Week Phased Milestone Roadmap

### Phase 1: Architecture, Core Foundation & Shell (Week 1)
- **Goal**: Deliver a 100% complete, runnable backend, normalized MySQL database schema, authenticated session wrapper, and ready-to-code frontend shell.
- **Architect Deliverables**:
  - Normalized database schema migrations (`001_init_schema.sql`) and synthetic data seed runner (`seed.js`).
  - Express.js backend with JWT authentication, role guards (`requireAuth`, `requireRole`), and upload middleware.
  - Complete helper client (`frontend/src/api/client.js`) wrapping all REST endpoints with automated JWT injection.
  - Teammate modular placeholder files under `src/modules/` with props and mock hooks.
- **Milestone Gate 1**: All team members can clone repository, execute `npm run db:seed`, boot backend & frontend, and view their assigned modular placeholder page.

### Phase 2: Feature Implementation & Domain Modules (Week 2)
- **Goal**: Teammates build their dedicated views in their isolated file without touching backend or central routing files.
- **Teammate Tasks**:
  - **Teammate 1**: User table with role selector and status toggle in `AdminDashboard.jsx`.
  - **Teammate 2**: Job creation form, markdown editor preview, and public job catalog filter in `JobManagementPage.jsx` & `PublicJobBoard.jsx`.
  - **Teammate 3**: Kanban board columns for `APPLIED`, `SCREENING`, `INTERVIEW`, `SELECTED`, `OFFERED`, `REJECTED` in `HrPipelineBoard.jsx`.
  - **Teammate 4**: Interview date/time selector, video link generator, and offer composition dialog in `InterviewSchedulerPage.jsx`.
  - **Teammate 5**: Multi-step profile form, resume file dropzone with validation feedback, and application tracker in `CandidateDashboard.jsx`.
  - **Teammate 6**: Metric summary cards (time-to-hire, volume) and conversion funnel bar visualization in `HiringAnalyticsPage.jsx`.
- **Milestone Gate 2**: Component UI review demo with live backend data.

### Phase 3: Advanced Workflows, Stage Machine & Security Hardening (Week 3)
- **Goal**: Inter-module workflow testing and validation.
- **Key Milestones**:
  - Candidate applies to a job with uploaded PDF resume -> appears automatically on HR Kanban board.
  - HR advances stage to `INTERVIEW` -> triggers interview scheduling modal.
  - Interviewer submits rating & feedback -> candidate moved to `SELECTED`.
  - HR issues formal offer -> candidate views offer letter in Candidate Portal, clicks `Accept`, automatically creating onboarding checklist tasks.
  - Onboarding checklist progress tracks in real-time.
- **Milestone Gate 3**: Full end-to-end recruitment lifecycle test successfully executed across Admin, HR, and Candidate accounts.

### Phase 4: Verification, Test Coverage & Production Launch (Week 4)
- **Goal**: Comprehensive automated testing, performance audit, and release readiness.
- **Deliverables**:
  - Jest & Supertest test suite passes with 100% green status on RBAC and edge cases (`npm run test:backend`).
  - Production build optimization (`npm run frontend:build`).
  - Security audit: No secrets committed, `.gitignore` protects `uploads/` and `.env`.
  - Executive demo and handoff documentation.
- **Milestone Gate 4**: Production sign-off and deployment.

---

## 3. Git Branching & Merge Conflict Prevention Rules

To guarantee zero merge conflicts during Phase 2 and Phase 3:
1. **Never edit outside your assigned module file**:
   - Work strictly within `frontend/src/modules/<your-assigned-folder>/`.
   - Routing (`App.jsx`), client API (`client.js`), and Auth Context (`AuthContext.jsx`) are centrally maintained by the Team Lead. If an additional endpoint wrapper is needed, request an architect update.
2. **Branch Naming Standard**:
   - `feature/admin-dashboard` (Teammate 1)
   - `feature/job-management` (Teammate 2)
   - `feature/pipeline-board` (Teammate 3)
   - `feature/interview-offers` (Teammate 4)
   - `feature/candidate-portal` (Teammate 5)
   - `feature/analytics-reporting` (Teammate 6)
3. **Commit Message Format**:
   - Follow Conventional Commits: `feat(pipeline): add drag-and-drop stage card`, `fix(interviews): correct timezone offset`.
4. **Pull Request Protocol**:
   - Branch off `main`.
   - Rebase on `main` before opening PR: `git checkout main && git pull && git checkout feature/<name> && git rebase main`.
   - Require 1 Architect review approval prior to merging.

