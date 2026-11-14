# Smart Recruitment & Applicant Tracking System (ATS)
## 5-Member Team Work Distribution & 4-Week Delivery Roadmap (Qveto Framework)

This document formalizes the division of ownership, Git workflow rules, and milestone deliverables for our **5-member team**:
- **1 Team Lead / Principal Architect** (Backend, DB, Security, Code Reviews & Team Support)
- **4 Frontend / Feature Engineers** (Modular, conflict-free UI domain ownership)

---

## 1. Team Roster & Ownership Matrix

| Member | Role Title | Primary Area of Responsibility | Assigned Files / Modules |
| :--- | :--- | :--- | :--- |
| **You (Team Lead)** | **Principal Full-Stack Architect & Lead** | • 100% Backend API (`backend/src/`)<br>• MySQL Database & Migrations (`database/`)<br>• Security, RBAC & Upload Isolation<br>• Central API Client (`src/api/client.js`)<br>• GitHub PR Reviews & Merge Approvals<br>• Technical Unblocking & Architecture Support | `backend/`<br>`database/`<br>`src/api/client.js`<br>`src/context/AuthContext.jsx`<br>`tests/backend/` |
| **Teammate 1** | **Candidate Experience & Public Portal Engineer** | • Public Job Openings & Discovery<br>• Candidate Portal & Profile Management<br>• Private Resume Vault & Uploader<br>• Candidate Stage Progress Timeline | `src/modules/hr-jobs/PublicJobBoard.jsx`<br>`src/modules/candidate/CandidateDashboard.jsx` |
| **Teammate 2** | **Recruiter Pipeline & Requisitions Lead** | • Job Requisition Management (`DRAFT`, `PUBLISHED`, `CLOSED`)<br>• 6-Stage Recruitment Kanban Board (`APPLIED` $\to$ `OFFERED`)<br>• Candidate Detail Drawer & Resume Viewer<br>• Stage State Machine Transitions & Audit Prompts | `src/modules/hr-jobs/JobManagementPage.jsx`<br>`src/modules/hr-pipeline/HrPipelineBoard.jsx` |
| **Teammate 3** | **Interviews, Offers & Onboarding Specialist** | • Virtual Interview Scheduling & Video Room Links<br>• Interviewer Evaluation Scorecards & 1-5 Star Ratings<br>• Formal Offer Letter Generator (Markdown/HTML)<br>• Pre-Hire Onboarding Checklist & Task Tracker | `src/modules/interviews-offers/InterviewSchedulerPage.jsx`<br>`src/modules/interviews-offers/OfferOnboardingPage.jsx` |
| **Teammate 4** | **Administration, Security & Analytics Engineer** | • System Administration Console & User Directory<br>• Role Assignments (`ADMIN`, `HR`, `CANDIDATE`)<br>• Internal Staff Account Provisioning<br>• Executive Hiring KPIs & Funnel Conversion Analytics | `src/modules/admin/AdminDashboard.jsx`<br>`src/modules/analytics/HiringAnalyticsPage.jsx` |

---

## 2. Team Lead Responsibility & Governance Policy

As Team Lead, your scope of work is **strictly defined to high-leverage architectural leadership and quality control**:

1. **Zero Frontend Module Coding**: You do not code individual UI views. Your teammates own their assigned JSX files 100%.
2. **Backend & Security Stewardship**: You own all endpoints, database constraints, migrations, seed runners, and unit tests.
3. **Gatekeeper for Git Pushes & PRs**:
   - `main` branch is protected. No direct commits allowed.
   - Every teammate creates a feature branch and opens a Pull Request.
   - You verify that:
     1. PR modifies **only** their assigned files in `src/modules/`.
     2. No breaking changes or secret exposures exist.
     3. Backend tests (`npm run test:backend`) and frontend build (`npm run frontend:build`) pass.
4. **Active Technical Mentorship**: You help teammates debug API integration issues, inspect network payloads, and unblock frontend state challenges.

---

## 3. Qveto 4-Week Phased Milestone Roadmap

### Phase 1: Architecture, Core Foundation & Shell (Week 1)
- **Team Lead**:
  - Deliver normalized MySQL schema (`001_init_schema.sql`) and automated runner (`seed.js`).
  - Implement full REST API endpoints with RBAC middleware and Multer file upload storage.
  - Provide pre-configured `client.js` with all helper functions and JWT interceptor.
  - Setup React + Vite shell, `AuthContext`, role-based routing, and modular component templates.
- **Teammates 1–4**:
  - Clone repository, run `npm install`, execute `npm run db:seed`, and verify login on local machine.
  - Inspect assigned files and verify mock data renders.
- **Milestone Gate 1 Sign-Off**: All 5 members have local environments running with live backend connectivity.

### Phase 2: Feature Implementation & Domain Isolation (Week 2)
- **Teammate 1**: Build interactive Public Job Board filters and Candidate Portal profile/resume views.
- **Teammate 2**: Build Job Requisition creator and 6-stage Kanban drag/promotion board.
- **Teammate 3**: Build Interview scheduling dialog, scorecard form, and Offer letter generator.
- **Teammate 4**: Build Admin user directory, role changer, and Analytics KPI summary cards.
- **Team Lead**: Monitor PRs, assist with data formatting, and run backend integration checks.
- **Milestone Gate 2 Sign-Off**: All 4 feature branches compile with zero errors and demo live data.

### Phase 3: End-to-End Recruitment Lifecycle Workflows (Week 3)
- **Collaborative Cross-Module Flow Testing**:
  1. *Teammate 1*: Candidate registers and applies for a job with a PDF resume.
  2. *Teammate 2*: HR sees candidate card appear in Kanban `APPLIED` column, screens candidate, and advances to `INTERVIEW`.
  3. *Teammate 3*: HR schedules an interview; interviewer submits scorecard rating; candidate approved to `SELECTED`; HR generates formal offer letter.
  4. *Teammate 1*: Candidate receives offer banner in Candidate Portal, clicks `Accept Offer`.
  5. *Teammate 3*: Candidate appears in Onboarding Checklist with automated pre-hire tasks.
  6. *Teammate 4*: Admin verifies audit log trail and Analytics reflects new hire, computing accurate time-to-hire and acceptance rates.
- **Milestone Gate 3 Sign-Off**: Complete end-to-end user journey executed without manual database interventions.

### Phase 4: Polish, Automated Testing, Security Audit & Launch (Week 4)
- **Team Lead**:
  - Run full backend automated test suite (`npm run test:backend`).
  - Perform security audit: verify `uploads/` directory is never exposed publicly and `.env` is omitted from Git.
- **Teammates 1–4**:
  - UI polish: responsive styling on mobile/tablet screens, empty state messages, loading spinners.
- **Milestone Gate 4 Sign-Off**: Production build (`npm run frontend:build`) passes cleanly; final project submission.

---

## 4. Git Branching Rules & Conflict Prevention

1. **Branch Naming Standard**:
   - `feature/cand-portal` (Teammate 1)
   - `feature/recruiter-pipeline` (Teammate 2)
   - `feature/interviews-offers` (Teammate 3)
   - `feature/admin-analytics` (Teammate 4)
2. **Commit Standard**:
   - `feat(pipeline): add stage transition modal notes`
   - `fix(interviews): format ISO scheduled timestamp`
3. **PR Protocol**:
   - Rebase on `main` before submitting PR:
     ```bash
     git checkout main && git pull
     git checkout <your-branch> && git rebase main
     ```
   - Request review from Team Lead.
   - Require 1 Team Lead approval before merging.
