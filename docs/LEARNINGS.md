# What I Learned Building This

## 🐳 DevOps and Deployment

- Writing Dockerfiles and using Docker Compose to run the app and database together.
- Moving between local development environments and containerized workflows.
- Deploying a PHP application to Render and connecting it to independently hosted services.
- Managing environment-specific configuration without putting credentials in source control.
- Building GitHub Actions workflows for scheduled and manual database backups and analytics retention cleanup.
- Managing workflow secrets and using TLS when automation connects to production services.
- Understanding the distinction between operational automation and CI/CD: Render deploys from the connected Git branch, while the repository workflows handle backups and maintenance rather than build/test/deploy checks.
- Troubleshooting deployment and configuration issues across local and hosted environments.

## ☁️ Cloud Infrastructure and Storage

- Integrating Cloudflare R2 through its S3-compatible API and the AWS SDK for PHP.
- Keeping uploaded files and database state outside the replaceable application container.
- Managing image and PDF uploads, key naming, metadata, and cleanup across database and object storage.
- Serving protected images and resumes through authenticated backend proxies.
- Connecting to managed MySQL over TLS and maintaining recovery snapshots in object storage.

## 🔒 Security and Reliability

- Hashing passwords and protecting login with attempt throttling and session ID regeneration.
- Using database-backed sessions, role checks, and CSRF tokens for protected operations.
- Sanitizing rich text in both the browser and server to reduce XSS risk.
- Validating uploaded file types and sizes, and restricting asset keys served from storage.
- Applying bot traps and per-IP throttling to contact submissions and portfolio PDF exports.
- Keeping service credentials in environment variables and CI secrets.

## 🛠️ Application Development

- Building a CMS with PHP, MySQL, HTML, CSS, and JavaScript.
- Creating reusable JSON and multipart API workflows for authentication and content management.
- Implementing profile and project editing, image galleries, resume management, and role administration.
- Building analytics from page-view events with visitor IDs and date-based reporting.
- Generating a portfolio PDF from live profile and project data with Dompdf.
- Integrating third-party services such as SendGrid, Cloudflare R2, and browser-side libraries.
- Documenting features, API contracts, architecture, and setup as separate project references.
