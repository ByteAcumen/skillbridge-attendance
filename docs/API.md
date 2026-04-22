# SkillBridge API Reference

Base URL:

```text
http://localhost:4000
```

The assignment lists endpoint paths without a namespace, such as `/batches`.
This implementation mounts protected application routes under `/api`, so that endpoint is:

```text
http://localhost:4000/api/batches
```

Protected endpoints require:

```text
Authorization: Bearer <token>
```

For Postman/local testing, use the development seed tokens:

| Role | Token |
| --- | --- |
| Student | `user_seed_student` |
| Trainer | `user_seed_trainer` |
| Institution | `user_seed_institution` |
| Programme Manager | `user_seed_manager` |
| Monitoring Officer | `user_seed_monitor` |

## Public

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | API metadata |
| GET | `/health` | Health check |

## Auth/Profile

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/api/me` | Any synced user | Current local profile |
| POST | `/api/me/sync` | Any Clerk user | Create/update local user after onboarding |

`POST /api/me/sync`

```json
{
  "name": "Student Demo",
  "email": "student+clerk_test@example.com",
  "role": "STUDENT"
}
```

## Batches

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/api/batches` | Student, Trainer, Institution | Role-filtered batch list |
| GET | `/api/batches/:id` | Trainer, Institution | Batch detail with trainers/students |
| POST | `/api/batches` | Trainer, Institution | Create batch |
| POST | `/api/batches/:id/invite` | Trainer | Generate invite token |
| POST | `/api/batches/:id/join` | Student | Join batch using invite token |
| GET | `/api/batches/:id/summary` | Institution | Per-student attendance summary |

Successful create/join responses use `201 Created`.

Create batch:

```json
{ "name": "Frontend Cohort 2" }
```

Create invite:

```json
{ "reusable": true, "maxUses": 30 }
```

Join batch:

```json
{ "token": "invite-token" }
```

## Sessions

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/api/sessions` | Trainer | Trainer sessions |
| GET | `/api/sessions/active` | Student | Active enrolled sessions |
| POST | `/api/sessions` | Trainer | Create session |
| GET | `/api/sessions/:id` | Trainer | Session detail |
| GET | `/api/sessions/:id/attendance` | Trainer | Attendance list |

Create session:

```json
{
  "batchId": "batch_demo_frontend_1",
  "title": "React Fundamentals",
  "date": "2026-04-22",
  "startTime": "09:00",
  "endTime": "10:30"
}
```

## Attendance

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/api/attendance/mark` | Student | Mark own attendance |
| POST | `/api/attendance/override` | Trainer | Override attendance for owned session |

Student mark:

```json
{ "sessionId": "session_demo_active_react", "status": "PRESENT" }
```

Trainer override:

```json
{
  "sessionId": "session_demo_active_react",
  "studentId": "user_demo_student",
  "status": "LATE"
}
```

## Institutions

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/api/institutions` | Programme Manager, Monitoring Officer | List institutions |
| POST | `/api/institutions` | Programme Manager | Create institution |
| GET | `/api/institutions/:id/summary` | Programme Manager, Monitoring Officer | Institution batch summaries |

## Programme

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/api/programme/summary` | Programme Manager, Monitoring Officer | Programme-wide summary |
| GET | `/api/programme/monitoring` | Monitoring Officer | Backward-compatible read-only summary |
| GET | `/api/programme/manager-insights` | Programme Manager | Backward-compatible manager insights |

## Assignment Endpoint Map

| Assignment path | Implemented path | Roles |
| --- | --- | --- |
| `POST /batches` | `POST /api/batches` | Trainer, Institution |
| `POST /batches/:id/invite` | `POST /api/batches/:id/invite` | Trainer |
| `POST /batches/:id/join` | `POST /api/batches/:id/join` | Student |
| `POST /sessions` | `POST /api/sessions` | Trainer |
| `POST /attendance/mark` | `POST /api/attendance/mark` | Student |
| `GET /sessions/:id/attendance` | `GET /api/sessions/:id/attendance` | Trainer |
| `GET /batches/:id/summary` | `GET /api/batches/:id/summary` | Institution |
| `GET /institutions/:id/summary` | `GET /api/institutions/:id/summary` | Programme Manager, Monitoring Officer read-only |
| `GET /programme/summary` | `GET /api/programme/summary` | Programme Manager, Monitoring Officer |

## Status Codes

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 400 | Invalid input or inactive attendance window |
| 401 | Missing/invalid token or user not synced |
| 403 | Authenticated but wrong role/scope |
| 404 | Resource not found |
| 409 | Duplicate attendance mark |
| 413 | Request body too large |
