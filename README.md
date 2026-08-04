# Personal Portfolio Website & CMS

## About This Project

This is my personal portfolio website: a centralized hub designed to showcase my professional profile, skills, projects, and career journey to potential employers and clients.

Beyond serving as a portfolio, the platform functions as a custom Content Management System (CMS) that allows administrators to manage profile information, resume content, project showcases, and uploaded assets through a secure dashboard interface. The project integrates Cloudflare R2 cloud storage for scalable and persistent asset management, ensuring uploaded content remains accessible across deployments and infrastructure changes.

## Purpose

The primary goal of this project is to present myself as a **professional** in a polished, recruiter-ready format. It serves as my digital identity, a single destination where visitors can learn who I am, what I can do, and the value I bring. Rather than limiting itself to a single role, this portfolio showcases versatility across web development, software engineering, deployment, cloud infrastructure, and system administration.

## Live Demo

🌐 **https://christiandiorferaer-portfoliohub.onrender.com/pages/login.html**

---

## Features

### 🧑 Professional Profile

* **About Me** — A professional summary introducing my background, career goals, and passion for software and web development.
* **Resume Management** — Upload and manage resume files directly through the admin dashboard.
* **Rich Text Descriptions** — Profile and project descriptions support formatting such as bold, italic, underline, and bullet points using Quill.js.

### 💼 Portfolio Showcase

* **Project Gallery** — A curated display of projects in a responsive grid layout.
* **Project Details** — Rich-text descriptions, image galleries, GitHub links, and project information.
* **GitHub Repository Integration** — Direct links to project source code repositories.
* **Image Management** — Upload, update, and organize project images through the CMS.

### ✉️ Contact

* **Contact Form** — Signed-in visitors can send a message from the portfolio through the Contact Me page.
* **Email Delivery** — Messages are delivered with SendGrid and use the visitor's submitted address as the reply-to address.
* **Spam Mitigation** — A hidden honeypot field and a minimum form-completion time silently filter simple automated submissions. Database-backed, per-IP rate limiting permits up to three submissions before temporarily blocking further messages for one hour.

### 🔐 User Authentication & Administration

* **Secure Login System** — Authentication system protecting administrative functionality.
* **Admin Dashboard** — Centralized management interface for portfolio content.
* **Role-Based Access Control** — Separate permissions and views for administrators and standard users.
* **Session-Based Authentication** — Protected routes require valid authenticated sessions.

### ☁️ Cloud Storage & Database

* **Cloudflare R2 Integration** — Stores project images, profile images, resume files, and uploaded assets in cloud object storage.
* **AWS SDK Integration** — Uses the AWS SDK for PHP to communicate with Cloudflare R2 through its S3-compatible API.
* **Managed Cloud Database** — MySQL is hosted on Aiven, connected over an encrypted (SSL/TLS) connection independent of the application host.
* **Persistent File Storage** — Uploaded files remain available across deployments, container rebuilds, and even full hosting-platform migrations.
* **Scalable Asset Management** — Decouples file storage and database from application hosting infrastructure, so the app container itself is fully disposable/replaceable.
* **Cloud Asset Delivery** — Dynamically serves uploaded assets from cloud storage.

### 🔄 Automated Backups

* **Scheduled Database Backups** — A GitHub Actions workflow runs weekly, dumping the live MySQL database and uploading it to Cloudflare R2.
* **Dual Retention** — Keeps both a dated snapshot (for history) and a `latest.sql` (for quick restores).
* **Manual Trigger Support** — Backups can also be run on-demand from the GitHub Actions tab.
* **Platform-Independent Recovery** — Because backups live in R2 rather than on any single hosting platform, the database can be fully restored even after switching hosts entirely.

### 🎨 Design & User Experience

* **Responsive Design** — Optimized for desktop, tablet, and mobile devices.
* **Modern UI** — Clean and professional visual design.
* **Interactive Components** — Image sliders, modals, animations, and dynamic content loading.

### 🔒 Security

* **XSS Protection** — Rich text is sanitized with DOMPurify in the browser and filtered again on the server to allow only safe tags, attributes, and `http(s)` links.
* **Password Hashing** — Passwords are securely hashed using PHP's `password_hash()` with bcrypt.
* **Session Authentication** — Protected routes require valid authenticated sessions.
* **CSRF Protection** — Mutating requests require valid CSRF tokens.
* **Contact-Form Throttling** — Contact submissions are tracked per IP address and temporarily locked after repeated attempts.
* **Encrypted Database Connections** — Production database connections use SSL/TLS via a CA-verified connection.
* **Environment Variable Security** — Sensitive credentials are stored outside the source code, injected via the hosting platform's environment variable manager and GitHub Actions encrypted secrets.

--- 

## Technology Stack

| Category           | Technologies                     |
| ------------------ | --------------------------------- |
| Frontend            | HTML5, CSS3, JavaScript          |
| Backend             | PHP 8.3                          |
| Database            | MySQL 8.0 (hosted on Aiven)      |
| Rich Text Editor    | Quill.js                         |
| Security            | DOMPurify                        |
| Cloud Storage       | Cloudflare R2                    |
| Cloud SDK           | AWS SDK for PHP                  |
| Email Delivery      | SendGrid Mail Send API           |
| Web Server          | Apache (Ubuntu 22.04)            |
| Containerization    | Docker                           |
| Deployment          | Render                           |
| CI/CD & Automation  | GitHub Actions (automated DB backups) |

---

## Project Structure

```text
login-dashboard-project/
├── admin/               # Admin panel and CMS management pages
├── api/                 # Backend APIs and database logic
├── assets/              # CSS, JavaScript, images, uploads
├── pages/                # Frontend pages
├── .github/workflows/   # GitHub Actions (automated database backups)
├── Dockerfile            # Docker build configuration
├── docker-compose.yml    # Local development environment
├── init.sql               # Database schema
├── ca.pem                 # CA certificate for encrypted database connections
├── php.ini                 # PHP configuration
└── README.md               # Project documentation
```

---

## Running Locally with Docker

Make sure Docker Desktop is installed.

```bash
docker-compose up --build
```

Visit:

```text
http://localhost:8080/pages/login.html
```

Stop containers:

```bash
docker-compose down
```

Remove containers and database volumes:

```bash
docker-compose down -v
```

---

## Deploying to Render

This project is deployed as a Docker web service on Render, connected to a managed MySQL database on Aiven and object storage on Cloudflare R2.

### Deployment Steps

1. Push the repository to GitHub.
2. Provision a free MySQL database on Aiven and run `init.sql` against it to create the schema.
3. Download the Aiven CA certificate and commit it to the repo root as `ca.pem`.
4. Create a new Web Service on Render, connected to this GitHub repository, using the Docker environment.
5. Configure environment variables on Render (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_SSL_CA`, the `R2_*` credentials, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, and `CONTACT_EMAIL`). `SENDGRID_FROM_EMAIL` must be a verified Sender Identity in SendGrid, and `CONTACT_EMAIL` is the inbox that receives contact-form messages.
6. Deploy — Render builds the Docker image and starts the container automatically.
7. Push updates to GitHub to trigger automatic redeployment.

### Automated Database Backups

A scheduled GitHub Actions workflow (`.github/workflows/db-backup.yml`) backs up the production database to Cloudflare R2 every week, and can also be triggered manually from the Actions tab — ensuring the database can be fully restored even if the hosting platform itself is ever changed or reset.

---

## What I Learned Building This

### 🐳 DevOps & Deployment

* Writing Dockerfiles and understanding containerized application workflows.
* Using Docker Compose to orchestrate multi-container environments.
* Deploying containerized applications across multiple hosting platforms (Railway, Back4app, Render) and evaluating trade-offs between them.
* Connecting cloud-hosted applications to managed, SSL-secured databases independent of the application host.
* Managing production environment variables securely across different platforms.
* Implementing CI/CD workflows through GitHub Actions, including scheduled automation.
* Migrating development environments from XAMPP to Laragon and Docker.
* Understanding how containerization solves environment consistency problems.
* Upgrading the application from PHP 8.1 to PHP 8.3.
* Troubleshooting production deployment issues across Linux environments and cloud providers.
* Provisioning and configuring cloud compute instances (Oracle Cloud), including networking, firewalls, and SSH access.

### ☁️ Cloud Infrastructure & Storage

* Integrating Cloudflare R2 object storage into a production application.
* Using the AWS SDK for PHP with S3-compatible cloud storage services.
* Managing uploaded assets through cloud-based object storage.
* Designing systems that fully decouple persistent storage and the database from application containers, enabling seamless migration between hosting platforms with zero data loss.
* Implementing cloud-hosted image and document management.
* Debugging asset delivery and URL generation issues across environments.
* Managing cloud credentials securely using environment variables and encrypted CI/CD secrets.
* Configuring encrypted (SSL/TLS) connections to a managed cloud database.
* Building automated, scheduled backup pipelines using GitHub Actions.

### 🔒 Security & Vulnerabilities

* Protecting against XSS attacks using DOMPurify.
* Implementing secure password hashing with bcrypt.
* Managing authenticated sessions securely.
* Preventing CSRF attacks through token validation.
* Protecting uploaded files from unauthorized directory access.
* Keeping sensitive credentials out of source control through environment variables and GitHub encrypted secrets.
* Learning how security vulnerabilities can arise from improper handling of user-generated content.
* Understanding certificate-based (CA) verification for encrypted database connections.

### 🛠️ Software Development

* Building a custom CMS from scratch using PHP and MySQL.
* Implementing rich-text editing functionality using Quill.js.
* Creating responsive user interfaces with HTML, CSS, and JavaScript.
* Managing image uploads and cloud-hosted media assets.
* Debugging production issues using logs and error reporting across multiple platforms.
* Working with third-party SDKs and cloud service integrations.
* Designing scalable application architecture that supports future growth and platform portability.

---

> ⚠️ **This project is actively being developed and improved.**
>
> New features, security enhancements, infrastructure improvements, and code refactoring are continuously being added as part of my learning journey and professional growth as a developer.

---

*This portfolio is a living project that evolves alongside my skills as a software developer.*
