-- ============================================================================
-- Smart Recruitment & Applicant Tracking System (ATS)
-- Database Seed Data: seed_data.sql
-- Default test password for all synthetic accounts: Password123!
-- (Bcrypt hash: $2a$10$wKq9yF1uIe4dK3I8y4/Ue.v8bT8n4yR9vB4wK7uX0kE0zG5y2uM6O)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE notification_logs;
TRUNCATE TABLE onboarding_tasks;
TRUNCATE TABLE offers;
TRUNCATE TABLE interviews;
TRUNCATE TABLE application_audit_logs;
TRUNCATE TABLE applications;
TRUNCATE TABLE resumes;
TRUNCATE TABLE candidate_profiles;
TRUNCATE TABLE jobs;
TRUNCATE TABLE users;
TRUNCATE TABLE organizations;

-- 1. Organization
INSERT INTO organizations (id, name, domain, created_at) VALUES
(1, 'NovaTech Innovations Inc.', 'novatech.io', '2026-01-01 08:00:00');

-- 2. Synthetic Users (Known test password for all: Password123!)
-- Hash generated via bcrypt with 10 rounds for 'Password123!'
INSERT INTO users (id, org_id, full_name, email, password_hash, role, is_active, created_at) VALUES
(1, 1, 'Sarah Connor', 'admin@novatech.io', '$2a$10$DJDLJ6z2Tm8BAfo.rByi5O2WE0f3BAmKx1pPhM2FySfJIxt7vtgyi', 'ADMIN', TRUE, '2026-01-02 09:00:00'),
(2, 1, 'David Miller', 'hr@novatech.io', '$2a$10$DJDLJ6z2Tm8BAfo.rByi5O2WE0f3BAmKx1pPhM2FySfJIxt7vtgyi', 'HR', TRUE, '2026-01-03 09:30:00'),
(3, NULL, 'Alex Rivera', 'alex.rivera@example.com', '$2a$10$DJDLJ6z2Tm8BAfo.rByi5O2WE0f3BAmKx1pPhM2FySfJIxt7vtgyi', 'CANDIDATE', TRUE, '2026-01-10 10:15:00'),
(4, NULL, 'Elena Rostova', 'elena.rostova@example.com', '$2a$10$DJDLJ6z2Tm8BAfo.rByi5O2WE0f3BAmKx1pPhM2FySfJIxt7vtgyi', 'CANDIDATE', TRUE, '2026-01-11 11:45:00'),
(5, NULL, 'Marcus Chen', 'marcus.chen@example.com', '$2a$10$DJDLJ6z2Tm8BAfo.rByi5O2WE0f3BAmKx1pPhM2FySfJIxt7vtgyi', 'CANDIDATE', TRUE, '2026-01-12 14:20:00'),
(6, NULL, 'Priya Sharma', 'priya.sharma@example.com', '$2a$10$DJDLJ6z2Tm8BAfo.rByi5O2WE0f3BAmKx1pPhM2FySfJIxt7vtgyi', 'CANDIDATE', TRUE, '2026-01-13 16:00:00');

-- 3. Candidate Profiles
INSERT INTO candidate_profiles (id, user_id, phone, skills_json, experience_years, linkedin_url, updated_at) VALUES
(1, 3, '+1-555-0101', '["React", "Node.js", "TypeScript", "MySQL", "AWS"]', 5.5, 'https://linkedin.com/in/alexrivera-demo', '2026-01-10 10:20:00'),
(2, 4, '+1-555-0102', '["Python", "FastAPI", "Docker", "Kubernetes", "GCP"]', 6.0, 'https://linkedin.com/in/elenarostova-demo', '2026-01-11 11:50:00'),
(3, 5, '+1-555-0103', '["Figma", "UI/UX", "User Research", "Design Systems", "Tailwind"]', 4.0, 'https://linkedin.com/in/marcuschen-demo', '2026-01-12 14:25:00'),
(4, 6, '+1-555-0104', '["Go", "Microservices", "Kafka", "PostgreSQL", "CI/CD"]', 3.5, 'https://linkedin.com/in/priyasharma-demo', '2026-01-13 16:05:00');

-- 4. Sample Resumes (Representing stored private files in uploads/)
INSERT INTO resumes (id, candidate_id, original_filename, stored_filename, file_path, mime_type, file_size_bytes, uploaded_at) VALUES
(1, 3, 'Alex_Rivera_Resume.pdf', 'resume_3_1705000000001.pdf', 'uploads/resume_3_1705000000001.pdf', 'application/pdf', 245760, '2026-01-10 10:30:00'),
(2, 4, 'Elena_Rostova_CV.pdf', 'resume_4_1705000000002.pdf', 'uploads/resume_4_1705000000002.pdf', 'application/pdf', 312000, '2026-01-11 12:00:00'),
(3, 5, 'Marcus_Chen_Portfolio.pdf', 'resume_5_1705000000003.pdf', 'uploads/resume_5_1705000000003.pdf', 'application/pdf', 450200, '2026-01-12 14:30:00'),
(4, 6, 'Priya_Sharma_Resume.pdf', 'resume_6_1705000000004.pdf', 'uploads/resume_6_1705000000004.pdf', 'application/pdf', 198400, '2026-01-13 16:10:00');

-- 5. 4 Sample Jobs (Various statuses)
INSERT INTO jobs (id, org_id, created_by, title, department, location, employment_type, description, requirements, status, published_at, created_at) VALUES
(1, 1, 2, 'Senior Full-Stack Engineer', 'Engineering', 'Remote - USA', 'FULL_TIME', 
 'NovaTech is looking for an experienced Senior Full-Stack Engineer to architect resilient distributed systems and responsive web applications.', 
 'Requirements:\n- 5+ years building production Node.js & React applications\n- Deep understanding of SQL schema design and indexing\n- Experience with Docker and cloud microservices', 
 'PUBLISHED', '2026-01-05 10:00:00', '2026-01-05 09:00:00'),

(2, 1, 2, 'Lead Cloud DevOps Architect', 'Infrastructure', 'New York, NY (Hybrid)', 'FULL_TIME', 
 'Lead our infrastructure automation, Kubernetes orchestration, and multi-region deployment pipelines.', 
 'Requirements:\n- 6+ years Terraform, Kubernetes, Helm, AWS/GCP\n- Proven track record with zero-downtime blue/green deployments\n- Incident response and SRE observability expertise', 
 'PUBLISHED', '2026-01-06 11:00:00', '2026-01-06 10:00:00'),

(3, 1, 2, 'Product Designer (UI/UX)', 'Product & Design', 'San Francisco, CA', 'FULL_TIME', 
 'Shape the user experience across all NovaTech B2B enterprise dashboards and mobile workflows.', 
 'Requirements:\n- 4+ years UX/UI design for complex software systems\n- Mastery of Figma components, interactive prototyping, and design tokens\n- Strong portfolio demonstrating iterative user research', 
 'PUBLISHED', '2026-01-07 14:00:00', '2026-01-07 12:00:00'),

(4, 1, 1, 'VP of People & Culture', 'Human Resources', 'Chicago, IL (Hybrid)', 'FULL_TIME', 
 'Define global recruitment strategy, performance programs, and culture initiatives for a hyper-growth enterprise.', 
 'Requirements:\n- 8+ years human resources leadership in tech enterprises\n- Proven expertise scaling engineering organizations from 50 to 500+ headcount\n- Deep knowledge of modern labor compliance', 
 'DRAFT', NULL, '2026-01-08 15:00:00');

-- 6. 6 Applications across ALL stages
INSERT INTO applications (id, job_id, candidate_id, resume_id, current_stage, applied_at, updated_at) VALUES
(1, 1, 3, 1, 'OFFERED', '2026-01-14 09:00:00', '2026-01-28 17:00:00'),
(2, 1, 6, 4, 'INTERVIEW', '2026-01-15 10:30:00', '2026-01-22 14:00:00'),
(3, 2, 4, 2, 'SELECTED', '2026-01-16 11:15:00', '2026-01-25 16:30:00'),
(4, 3, 5, 3, 'SCREENING', '2026-01-17 13:45:00', '2026-01-20 10:00:00'),
(5, 2, 3, 1, 'REJECTED', '2026-01-18 15:20:00', '2026-01-24 11:00:00'),
(6, 3, 4, 2, 'APPLIED', '2026-01-19 16:40:00', '2026-01-19 16:40:00');

-- 7. Application Audit Logs (Stage history trail)
INSERT INTO application_audit_logs (id, application_id, changed_by, from_stage, to_stage, notes, changed_at) VALUES
(1, 1, 3, NULL, 'APPLIED', 'Candidate submitted initial application via job portal.', '2026-01-14 09:00:00'),
(2, 1, 2, 'APPLIED', 'SCREENING', 'Resume reviewed by HR. Matches full-stack requirements.', '2026-01-16 10:00:00'),
(3, 1, 2, 'SCREENING', 'INTERVIEW', 'Candidate cleared initial recruiter phone screen.', '2026-01-19 11:30:00'),
(4, 1, 2, 'INTERVIEW', 'SELECTED', 'Technical interview panel gave unanimous strong hire rating.', '2026-01-25 15:00:00'),
(5, 1, 2, 'SELECTED', 'OFFERED', 'Formal offer letter generated and dispatched to candidate.', '2026-01-28 17:00:00'),

(6, 2, 6, NULL, 'APPLIED', 'Candidate submitted initial application.', '2026-01-15 10:30:00'),
(7, 2, 2, 'APPLIED', 'SCREENING', 'HR screened portfolio and past Go backend repos.', '2026-01-18 09:15:00'),
(8, 2, 2, 'SCREENING', 'INTERVIEW', 'Technical interview scheduled with Lead Architect.', '2026-01-22 14:00:00'),

(9, 3, 4, NULL, 'APPLIED', 'Candidate applied for Lead Cloud DevOps Architect.', '2026-01-16 11:15:00'),
(10, 3, 2, 'APPLIED', 'SCREENING', 'Strong Kubernetes & AWS profile matched.', '2026-01-19 10:30:00'),
(11, 3, 2, 'SCREENING', 'INTERVIEW', 'System design interview scheduled.', '2026-01-21 14:00:00'),
(12, 3, 2, 'INTERVIEW', 'SELECTED', 'Hiring manager approved final hiring decision.', '2026-01-25 16:30:00'),

(13, 4, 5, NULL, 'APPLIED', 'Candidate submitted UX portfolio.', '2026-01-17 13:45:00'),
(14, 4, 2, 'APPLIED', 'SCREENING', 'Design lead reviewing case studies.', '2026-01-20 10:00:00'),

(15, 5, 3, NULL, 'APPLIED', 'Candidate applied for DevOps role.', '2026-01-18 15:20:00'),
(16, 5, 2, 'APPLIED', 'REJECTED', 'Profile is full-stack oriented; DevOps lead requires deep SRE kernel-level experience.', '2026-01-24 11:00:00'),

(17, 6, 4, NULL, 'APPLIED', 'Candidate submitted second application for Product Designer.', '2026-01-19 16:40:00');

-- 8. Interviews
INSERT INTO interviews (id, application_id, interviewer_id, scheduled_at, duration_minutes, meeting_link, status, feedback_notes, rating, created_at) VALUES
(1, 1, 2, '2026-01-23 15:00:00', 60, 'https://meet.novatech.io/interview-alex-101', 'COMPLETED', 
 'Strong algorithmic foundation, demonstrated deep understanding of high-throughput caching with Redis and MySQL index strategy.', 5, '2026-01-19 11:35:00'),
(2, 2, 2, '2026-02-10 14:00:00', 45, 'https://meet.novatech.io/interview-priya-202', 'SCHEDULED', 
 NULL, NULL, '2026-01-22 14:05:00'),
(3, 3, 1, '2026-01-24 16:00:00', 60, 'https://meet.novatech.io/interview-elena-303', 'COMPLETED', 
 'Excellent systems architectural knowledge. Solved the distributed consensus challenge with clarity.', 5, '2026-01-21 14:10:00');

-- 9. Offers
INSERT INTO offers (id, application_id, generated_by, salary_offered, joining_date, offer_letter_content, status, issued_at, responded_at, created_at) VALUES
(1, 1, 2, 165000.00, '2026-03-01', 
 '# Formal Offer of Employment\n\nDear Alex Rivera,\n\nNovaTech Innovations Inc. is thrilled to offer you the position of **Senior Full-Stack Engineer**.\n\n### Compensation Package\n- **Base Salary**: $165,000 USD gross per annum\n- **Stock Options**: 15,000 ISO Shares subject to standard 4-year vesting\n- **Benefits**: Comprehensive Medical, Dental, Vision & 401(k) matching\n\n### Start Date\nYour anticipated start date will be **March 1, 2026**.\n\nPlease sign and accept via your candidate portal.', 
 'ISSUED', '2026-01-28 17:00:00', NULL, '2026-01-28 16:30:00');

-- 10. Onboarding Tasks for Offer 1
INSERT INTO onboarding_tasks (id, offer_id, task_title, is_completed, due_date, completed_at) VALUES
(1, 1, 'Review & Digitally Sign Employment Agreement', FALSE, '2026-02-15', NULL),
(2, 1, 'Upload Government ID & Tax Verification Documents', FALSE, '2026-02-20', NULL),
(3, 1, 'Select Hardware & Development Machine Preferences', FALSE, '2026-02-22', NULL),
(4, 1, 'Complete Background Check Authorization Form', TRUE, '2026-02-10', '2026-01-29 10:15:00');

-- 11. Notification Logs
INSERT INTO notification_logs (id, recipient_email, event_type, subject, delivery_status, provider_response, created_at) VALUES
(1, 'alex.rivera@example.com', 'APPLICATION_RECEIVED', 'Application Received: Senior Full-Stack Engineer', 'SIMULATED', '{"messageId": "msg_001", "provider": "mock-smtp", "status": "delivered"}', '2026-01-14 09:00:05'),
(2, 'alex.rivera@example.com', 'STAGE_CHANGED', 'Update on your application with NovaTech', 'SIMULATED', '{"messageId": "msg_002", "provider": "mock-smtp", "status": "delivered"}', '2026-01-16 10:00:05'),
(3, 'alex.rivera@example.com', 'OFFER_ISSUED', 'Job Offer from NovaTech Innovations Inc.', 'SIMULATED', '{"messageId": "msg_003", "provider": "mock-smtp", "status": "delivered"}', '2026-01-28 17:00:05'),
(4, 'priya.sharma@example.com', 'INTERVIEW_SCHEDULED', 'Interview Invitation: Senior Full-Stack Engineer', 'SIMULATED', '{"messageId": "msg_004", "provider": "mock-smtp", "status": "delivered"}', '2026-01-22 14:00:05');

SET FOREIGN_KEY_CHECKS = 1;

