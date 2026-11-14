# Smart Recruitment & Applicant Tracking System (ATS)
## Comprehensive API Contract Specification (`v1`)

- **Base URL**: `http://localhost:5000/api/v1`
- **Default Content-Type**: `application/json`
- **Authentication**: `Authorization: Bearer <JWT>` header on all protected endpoints.
- **Error Format**:
```json
{
  "success": false,
  "message": "Human-readable description of error",
  "errors": [ { "field": "email", "message": "Valid email is required." } ]
}
```

---

## 1. Authentication & Session (`/auth`)

### `POST /auth/register`
Candidate self-signup. Sets default role to `CANDIDATE`.
- **Access**: Public
- **Request Body**:
```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "Password123!",
  "phone": "+1-555-0199",
  "skills": ["React", "Node.js", "Docker"],
  "experienceYears": 4.5,
  "linkedinUrl": "https://linkedin.com/in/janedoe-demo"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Candidate registration successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 7,
      "orgId": null,
      "fullName": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "CANDIDATE",
      "isActive": true
    }
  }
}
```

### `POST /auth/login`
Authenticates Admin, HR, or Candidate credentials.
- **Access**: Public
- **Request Body**:
```json
{
  "email": "hr@novatech.io",
  "password": "Password123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "orgId": 1,
      "orgName": "NovaTech Innovations Inc.",
      "fullName": "David Miller",
      "email": "hr@novatech.io",
      "role": "HR",
      "isActive": true
    }
  }
}
```

### `GET /auth/me`
Retrieves authenticated user profile and candidate details if role is `CANDIDATE`.
- **Access**: Authenticated (`ADMIN`, `HR`, `CANDIDATE`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "orgId": null,
    "fullName": "Alex Rivera",
    "email": "alex.rivera@example.com",
    "role": "CANDIDATE",
    "isActive": true,
    "createdAt": "2026-01-10 10:15:00",
    "profile": {
      "id": 1,
      "phone": "+1-555-0101",
      "skills": ["React", "Node.js", "TypeScript", "MySQL", "AWS"],
      "experienceYears": 5.5,
      "linkedinUrl": "https://linkedin.com/in/alexrivera-demo",
      "updatedAt": "2026-01-10 10:20:00"
    }
  }
}
```

---

## 2. Admin Management (`/admin`)

### `GET /admin/users`
Paginated search/filter of users.
- **Access**: `ADMIN`
- **Query Params**: `?page=1&limit=20&role=HR&search=David`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "org_id": 1,
      "full_name": "David Miller",
      "email": "hr@novatech.io",
      "role": "HR",
      "is_active": true,
      "created_at": "2026-01-03 09:30:00",
      "org_name": "NovaTech Innovations Inc."
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### `POST /admin/users`
Admin provisions an internal HR or Admin account.
- **Access**: `ADMIN`
- **Request Body**:
```json
{
  "fullName": "Rachel Green",
  "email": "rachel.hr@novatech.io",
  "password": "Password123!",
  "role": "HR"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "User 'Rachel Green' provisioned successfully with role 'HR'.",
  "data": { "id": 8, "orgId": 1, "fullName": "Rachel Green", "email": "rachel.hr@novatech.io", "role": "HR", "isActive": true }
}
```

### `PATCH /admin/users/:id/role`
- **Access**: `ADMIN`
- **Request Body**: `{ "role": "HR" }`
- **Response `200 OK`**: `{ "success": true, "message": "User role updated successfully.", "data": { "id": 5, "role": "HR" } }`

### `PATCH /admin/users/:id/status`
- **Access**: `ADMIN`
- **Request Body**: `{ "isActive": false }`
- **Response `200 OK`**: `{ "success": true, "message": "User status changed to inactive.", "data": { "id": 5, "isActive": false } }`

### `GET /admin/audit-logs`
- **Access**: `ADMIN`
- **Query Params**: `?page=1&limit=25&applicationId=1`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "application_id": 1,
      "from_stage": "SELECTED",
      "to_stage": "OFFERED",
      "notes": "Formal offer letter generated and dispatched to candidate.",
      "changed_at": "2026-01-28 17:00:00",
      "changed_by_name": "David Miller",
      "changed_by_role": "HR",
      "job_title": "Senior Full-Stack Engineer",
      "candidate_name": "Alex Rivera"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 25, "totalPages": 1 }
}
```

---

## 3. Jobs Management (`/jobs`)

### `GET /jobs`
Lists job requisitions. Guests/Candidates only see `PUBLISHED` jobs; HR/Admin see all statuses (`DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`).
- **Access**: Public / Authenticated
- **Query Params**: `?status=PUBLISHED&department=Engineering&search=react&page=1&limit=20`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "org_id": 1,
      "created_by": 2,
      "title": "Senior Full-Stack Engineer",
      "department": "Engineering",
      "location": "Remote - USA",
      "employment_type": "FULL_TIME",
      "description": "NovaTech is looking for an experienced Senior Full-Stack Engineer...",
      "requirements": "Requirements:\n- 5+ years building production Node.js & React...",
      "status": "PUBLISHED",
      "published_at": "2026-01-05 10:00:00",
      "created_at": "2026-01-05 09:00:00",
      "created_by_name": "David Miller",
      "org_name": "NovaTech Innovations Inc.",
      "applications_count": 2
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### `GET /jobs/:id`
- **Access**: Public (if `PUBLISHED`) / `HR`, `ADMIN` (any status)
- **Response `200 OK`**: Returns single job object matching schema above.

### `POST /jobs`
Create new job requisition.
- **Access**: `HR`, `ADMIN`
- **Request Body**:
```json
{
  "title": "Site Reliability Engineer",
  "department": "Infrastructure",
  "location": "Austin, TX",
  "employmentType": "FULL_TIME",
  "description": "Maintain reliability and latency SLA targets...",
  "requirements": "- 4+ years Linux SRE experience\n- Prometheus and Grafana",
  "status": "DRAFT"
}
```
- **Response `201 Created`**: Returns created job object.

### `PUT /jobs/:id`
- **Access**: `HR`, `ADMIN`
- **Request Body**: Same schema as `POST /jobs`.
- **Response `200 OK`**: Returns updated job object.

### `PATCH /jobs/:id/status`
- **Access**: `HR`, `ADMIN`
- **Request Body**: `{ "status": "PUBLISHED" }`
- **Response `200 OK`**: Returns updated job with updated `published_at` timestamp.

---

## 4. Candidate & Resumes (`/candidates`)

### `GET /candidates/profile`
- **Access**: `CANDIDATE` (own profile), or `HR`/`ADMIN` (can pass `?candidateId=3`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "userId": 3,
    "fullName": "Alex Rivera",
    "email": "alex.rivera@example.com",
    "phone": "+1-555-0101",
    "skills": ["React", "Node.js", "TypeScript", "MySQL", "AWS"],
    "experienceYears": 5.5,
    "linkedinUrl": "https://linkedin.com/in/alexrivera-demo",
    "resumes": [
      {
        "id": 1,
        "original_filename": "Alex_Rivera_Resume.pdf",
        "stored_filename": "resume_3_1705000000001.pdf",
        "mime_type": "application/pdf",
        "file_size_bytes": 245760,
        "uploaded_at": "2026-01-10 10:30:00"
      }
    ]
  }
}
```

### `PUT /candidates/profile`
- **Access**: `CANDIDATE`
- **Request Body**:
```json
{
  "phone": "+1-555-9988",
  "skills": ["React", "Node.js", "GraphQL", "Tailwind CSS"],
  "experienceYears": 6.0,
  "linkedinUrl": "https://linkedin.com/in/alexrivera-updated"
}
```
- **Response `200 OK`**: Returns refreshed profile object.

### `POST /candidates/resume`
Private resume upload.
- **Access**: `CANDIDATE`
- **Headers**: `Content-Type: multipart/form-data`
- **Form Data**: `resume` (file: .pdf, .doc, or .docx, max 5MB)
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Resume uploaded successfully.",
  "data": {
    "id": 5,
    "candidateId": 3,
    "originalFilename": "Alex_Rivera_2026.pdf",
    "storedFilename": "resume_3_1709123456789_a1b2c3.pdf",
    "mimeType": "application/pdf",
    "fileSizeBytes": 245760,
    "uploadedAt": "2026-01-15T12:00:00.000Z"
  }
}
```

### `GET /candidates/resume/:id/download`
Authorized streaming file download.
- **Access**: Resume Owner (`CANDIDATE`), `HR`, `ADMIN`
- **Response**: Binary stream with `Content-Disposition: attachment; filename="Alex_Rivera_Resume.pdf"` and correct MIME type. Never exposes file storage system path or public URL.

---

## 5. Applications & Pipeline (`/applications`)

### `POST /applications`
Candidate applies to a published position.
- **Access**: `CANDIDATE`
- **Request Body**:
```json
{
  "jobId": 1,
  "resumeId": 1
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Application submitted successfully.",
  "data": {
    "id": 7,
    "job_id": 1,
    "candidate_id": 3,
    "resume_id": 1,
    "current_stage": "APPLIED",
    "applied_at": "2026-01-20 10:00:00",
    "updated_at": "2026-01-20 10:00:00",
    "job_title": "Senior Full-Stack Engineer",
    "department": "Engineering",
    "candidate_name": "Alex Rivera",
    "timeline": [
      {
        "id": 18,
        "from_stage": null,
        "to_stage": "APPLIED",
        "notes": "Candidate submitted initial application.",
        "changed_at": "2026-01-20 10:00:00",
        "changed_by_name": "Alex Rivera",
        "changed_by_role": "CANDIDATE"
      }
    ]
  }
}
```

### `GET /applications/my`
Candidate tracks all submitted applications and chronological stage audit timeline.
- **Access**: `CANDIDATE`
- **Response `200 OK`**: Array of application objects with embedded `timeline` and `interviews`.

### `GET /applications`
HR/Admin pipeline management view with pagination, stage filter, and search.
- **Access**: `HR`, `ADMIN`
- **Query Params**: `?page=1&limit=20&jobId=1&stage=INTERVIEW&search=Alex`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "job_id": 1,
      "candidate_id": 3,
      "resume_id": 1,
      "current_stage": "OFFERED",
      "applied_at": "2026-01-14 09:00:00",
      "updated_at": "2026-01-28 17:00:00",
      "job_title": "Senior Full-Stack Engineer",
      "department": "Engineering",
      "candidate_name": "Alex Rivera",
      "candidate_email": "alex.rivera@example.com",
      "candidate_phone": "+1-555-0101",
      "experience_years": "5.5",
      "skills": ["React", "Node.js", "TypeScript", "MySQL", "AWS"],
      "resume_filename": "Alex_Rivera_Resume.pdf",
      "interview_count": 1,
      "offer_id": 1,
      "offer_status": "ISSUED"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### `PATCH /applications/:id/stage`
Controlled pipeline state machine transition with mandatory audit log note and simulated notification trigger.
- **Access**: `HR`, `ADMIN`
- **Request Body**:
```json
{
  "toStage": "SELECTED",
  "notes": "Passed final technical panel review with unanimous recommendation."
}
```
- **Response `200 OK`**: Returns updated application with full updated `timeline`.

---

## 6. Interviews Scheduling (`/interviews`)

### `POST /interviews`
Schedules an interview. Automatically promotes application to `INTERVIEW` stage if currently in `APPLIED` or `SCREENING`.
- **Access**: `HR`, `ADMIN`
- **Request Body**:
```json
{
  "applicationId": 2,
  "scheduledAt": "2026-02-15T15:00:00Z",
  "durationMinutes": 60,
  "meetingLink": "https://meet.novatech.io/interview-priya-202"
}
```
- **Response `201 Created`**: Returns created interview record with candidate and interviewer details.

### `GET /interviews`
List interviews. Candidates see only their own interviews; HR and Admin see all scheduled interviews.
- **Access**: `CANDIDATE` (own), `HR`, `ADMIN`
- **Query Params**: `?status=SCHEDULED&applicationId=2`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "application_id": 2,
      "interviewer_id": 2,
      "scheduled_at": "2026-02-10 14:00:00",
      "duration_minutes": 45,
      "meeting_link": "https://meet.novatech.io/interview-priya-202",
      "status": "SCHEDULED",
      "feedback_notes": null,
      "rating": null,
      "candidate_name": "Priya Sharma",
      "candidate_email": "priya.sharma@example.com",
      "interviewer_name": "David Miller",
      "job_title": "Senior Full-Stack Engineer"
    }
  ]
}
```

### `PATCH /interviews/:id`
Reschedule, cancel, or complete interview with feedback and rating.
- **Access**: `HR`, `ADMIN`
- **Request Body**:
```json
{
  "status": "COMPLETED",
  "rating": 5,
  "feedbackNotes": "Candidate demonstrated exceptional proficiency in system architecture."
}
```
- **Response `200 OK`**: Returns updated interview record.

---

## 7. Offers & Onboarding (`/offers`)

### `POST /offers`
Generates formal offer for an application in `SELECTED` stage, automatically provisions onboarding checklist tasks, and advances application stage to `OFFERED`.
- **Access**: `HR`, `ADMIN`
- **Request Body**:
```json
{
  "applicationId": 3,
  "salaryOffered": 175000.00,
  "joiningDate": "2026-03-15",
  "offerLetterContent": "# Formal Offer of Employment\n\nDear Elena Rostova...",
  "status": "ISSUED"
}
```
- **Response `201 Created`**: Returns generated offer record.

### `PATCH /offers/:id/respond`
Candidate accepts or declines employment offer.
- **Access**: `CANDIDATE` (Owner of application)
- **Request Body**:
```json
{
  "decision": "ACCEPTED"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Offer successfully accepted.",
  "data": {
    "id": 1,
    "status": "ACCEPTED",
    "responded_at": "2026-02-01 10:00:00"
  }
}
```

### `GET /offers/:id/onboarding`
Retrieves pre-hire onboarding checklist tasks.
- **Access**: `CANDIDATE` (own offer), `HR`, `ADMIN`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "offer": { "id": 1, "status": "ISSUED", "joining_date": "2026-03-01" },
    "tasks": [
      {
        "id": 1,
        "offer_id": 1,
        "task_title": "Review & Digitally Sign Employment Agreement",
        "is_completed": false,
        "due_date": "2026-02-15",
        "completed_at": null
      },
      {
        "id": 4,
        "offer_id": 1,
        "task_title": "Complete Background Check Authorization Form",
        "is_completed": true,
        "due_date": "2026-02-10",
        "completed_at": "2026-01-29 10:15:00"
      }
    ]
  }
}
```

### `PATCH /offers/onboarding/:taskId`
Toggle task completion status.
- **Access**: `CANDIDATE`, `HR`, `ADMIN`
- **Request Body**: `{ "isCompleted": true }`
- **Response `200 OK`**: Returns updated task object.

---

## 8. Hiring Analytics (`/analytics`)

### `GET /analytics/summary`
Calculates executive hiring KPIs, funnel conversion rates, time-to-hire, and acceptance rates with safe zero-division handling.
- **Access**: `HR`, `ADMIN`
- **Query Params**: `?jobId=1&startDate=2026-01-01&endDate=2026-02-28`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "filters": {
      "jobId": 1,
      "startDate": "2026-01-01",
      "endDate": "2026-02-28"
    },
    "kpis": {
      "totalOpenJobs": 3,
      "applicationVolume": 6,
      "averageTimeToHireDays": 14.5,
      "offerAcceptanceRate": 100.0,
      "notificationDeliveryRate": 100.0
    },
    "funnel": {
      "counts": {
        "applied": 6,
        "screening": 5,
        "interview": 3,
        "selected": 2,
        "offered": 1
      },
      "conversionRates": {
        "appliedToScreening": 83.3,
        "screeningToInterview": 60.0,
        "interviewToSelected": 66.7,
        "selectedToOffered": 50.0,
        "overallFunnelEfficiency": 16.7
      }
    },
    "stageBreakdown": {
      "applied": 1,
      "screening": 1,
      "interview": 1,
      "selected": 1,
      "offered": 1,
      "rejected": 1
    },
    "offers": {
      "total": 1,
      "issued": 1,
      "accepted": 1,
      "declined": 0,
      "acceptanceRate": 100.0
    },
    "notifications": {
      "total": 4,
      "successful": 4,
      "failed": 0,
      "deliveryRate": 100.0
    }
  }
}
```

