# API Plan

Base URL:

```text
http://localhost:4000
```

Production API URL:

```text
TBD
```

All protected endpoints will require a Clerk session token in the `Authorization` header:

```text
Authorization: Bearer <clerk-session-token>
```

## Role Names

| UI label | API role |
| --- | --- |
| Student | `STUDENT` |
| Trainer | `TRAINER` |
| Institution | `INSTITUTION` |
| Programme Manager | `PROGRAMME_MANAGER` |
| Monitoring Officer | `MONITORING_OFFICER` |

## Support Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Deployment health check. |
| GET | `/` | Public | API metadata. |
| GET | `/me` | Required | Return synced local user profile. |
| POST | `/me/sync` | Required | Create or update local user from Clerk profile and selected role. |

## Required Assignment Endpoints

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/batches` | `TRAINER`, `INSTITUTION` | Create a batch. |
| POST | `/batches/:id/invite` | `TRAINER` | Generate a one-time or reusable invite link. |
| POST | `/batches/:id/join` | `STUDENT` | Join a batch using an invite token. |
| POST | `/sessions` | `TRAINER` | Create a session for an assigned batch. |
| POST | `/attendance/mark` | `STUDENT` | Mark own attendance for an active enrolled session. |
| GET | `/sessions/:id/attendance` | `TRAINER` | View attendance for a trainer-owned session. |
| GET | `/batches/:id/summary` | `INSTITUTION` | View attendance summary for a batch in the institution. |
| GET | `/institutions/:id/summary` | `PROGRAMME_MANAGER` | View all batch summaries for an institution. |
| GET | `/programme/summary` | `PROGRAMME_MANAGER`, `MONITORING_OFFICER` | View programme-wide attendance summary. |

## Authorization Rules

- Missing or invalid token returns `401`.
- Authenticated user with the wrong role returns `403`.
- Trainers can only act on batches they are assigned to.
- Students can only join batches through valid invite tokens.
- Students can only mark attendance for sessions in their enrolled batches.
- Institution users can only view data under their own institution.
- Monitoring Officers are read-only across the programme.

## Planned Response Style

Success responses will return JSON objects with named fields:

```json
{
  "data": {},
  "message": "Operation completed"
}
```

Validation errors will return:

```json
{
  "error": "ValidationError",
  "message": "Readable error message",
  "details": []
}
```
