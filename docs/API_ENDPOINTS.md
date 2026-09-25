# API endpoints

All routes are PHP files under `api/`. JSON endpoints use JSON request bodies unless noted; uploads use `multipart/form-data`. Protected calls send the PHP session cookie. Mutations marked **CSRF** also send `X-CSRF-Token` (available from login/session check).

| Endpoint | Method | Access | Purpose / input |
| --- | --- | --- | --- |
| `signup.php` | POST | Public | JSON: `username`, `password`, `fullname`, `email`; creates a standard user. |
| `login.php` | POST | Public | JSON: `username`, `password`; starts a session and returns role and CSRF token. Failed attempts are throttled. |
| `logout.php` | POST | Signed in + CSRF | Destroys the current session. |
| `check-session.php` | GET | Session-aware | Returns login state, username, role, and current CSRF token. |
| `get-profile.php` | GET | Signed in | Returns profile, social links, and related data. |
| `upload-profile.php` | POST | Admin + CSRF | Multipart profile description and optional image; saves text and uploads image. |
| `get-projects.php` | GET | Signed in | Returns projects and preview image paths. |
| `upload-projects.php` | POST | Admin + CSRF | Multipart project title, description, optional link and preview images. |
| `update-project.php` | POST | Admin + CSRF | Multipart project ID and updated fields/images. |
| `delete-project.php` | POST | Admin + CSRF | JSON project `id`; removes project and associated previews. |
| `get-image.php` | GET | Signed in | Query `key`; streams an allowlisted profile/project image from R2. |
| `get-resumes.php` | GET | Signed in | Lists resume metadata, newest first. |
| `get-current-resume-pdf.php` | GET | Signed in | Streams the latest resume PDF from R2. |
| `upload-resume.php` | POST | Admin + CSRF | Multipart PDF field `resume`; uploads the resume. |
| `dashboard-content.php` | GET / POST | GET: signed in; POST: admin + CSRF | Reads or updates About content. POST multipart field: `content`. |
| `users-table.php` | GET | Admin + CSRF | Lists user account fields. |
| `set-role.php` | POST | Admin + CSRF | JSON: user `id` and `role` (`user` or `admin`). |
| `log-view.php` | POST | Public | JSON: `page`, optional `visitor_id`; records a valid page view. |
| `get-analytics.php` | GET | Admin + CSRF | Query filters: `filter` (`days`, `single_date`, or range), `days` (1–180), `date`, `start_date`, `end_date`. Returns totals and chart/page aggregates. |
| `contact.php` | POST | Public | JSON: `name`, `email`, `message`; optional `website` honeypot and `loaded_at` timestamp. Sends validated messages using SendGrid. |
| `generate-portfolio-pdf.php` | GET | Public | Generates and downloads the current portfolio PDF; rate-limited per IP. |

## Common behavior

- Successful JSON responses generally include `success`; read endpoints may return arrays or endpoint-specific fields.
- Authentication/authorization failures return JSON failure messages. File proxy routes return file bytes and HTTP error status codes.
- Rich-text writes are sanitized server-side. Upload routes validate file type/size and use R2; credentials stay server-side.
- Exact response fields and validation messages are defined by each endpoint in `api/`.
