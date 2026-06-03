# Personal Portfolio Website & CMS

## About This Project

This is my personal portfolio website: a centralized hub designed to showcase my professional profile, skills, projects, and career journey to potential employers and clients.

Beyond serving as a portfolio, the platform functions as a custom Content Management System (CMS) that allows administrators to manage profile information, resume content, project showcases, and uploaded assets through a secure dashboard interface. The project integrates Cloudflare R2 cloud storage for scalable and persistent asset management, ensuring uploaded content remains accessible across deployments and infrastructure changes.

## Purpose

The primary goal of this project is to present myself as a **professional** in a polished, recruiter-ready format. It serves as my digital identity, a single destination where visitors can learn who I am, what I can do, and the value I bring. Rather than limiting itself to a single role, this portfolio showcases versatility across web development, software engineering, deployment, cloud infrastructure, and system administration.

## Live Demo

🌐 **https://christiandior-feraer-portfolio.up.railway.app**

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

### 🔐 User Authentication & Administration

* **Secure Login System** — Authentication system protecting administrative functionality.
* **Admin Dashboard** — Centralized management interface for portfolio content.
* **Role-Based Access Control** — Separate permissions and views for administrators and standard users.
* **Session-Based Authentication** — Protected routes require valid authenticated sessions.

### ☁️ Cloud Storage

* **Cloudflare R2 Integration** — Stores project images, profile images, resume files, and uploaded assets in cloud object storage.
* **AWS SDK Integration** — Uses the AWS SDK for PHP to communicate with Cloudflare R2 through its S3-compatible API.
* **Persistent File Storage** — Uploaded files remain available across deployments and container rebuilds.
* **Scalable Asset Management** — Decouples file storage from application hosting infrastructure.
* **Cloud Asset Delivery** — Dynamically serves uploaded assets from cloud storage.

### 🎨 Design & User Experience

* **Responsive Design** — Optimized for desktop, tablet, and mobile devices.
* **Modern UI** — Clean and professional visual design.
* **Interactive Components** — Image sliders, modals, animations, and dynamic content loading.

### 🔒 Security

* **XSS Protection** — Rich text content is sanitized using DOMPurify before storage and rendering.
* **Password Hashing** — Passwords are securely hashed using PHP's `password_hash()` with bcrypt.
* **Session Authentication** — Protected routes require valid authenticated sessions.
* **CSRF Protection** — Mutating requests require valid CSRF tokens.
* **Environment Variable Security** — Sensitive credentials are stored outside the source code.

---

## Technology Stack

| Category         | Technologies            |
| ---------------- | ----------------------- |
| Frontend         | HTML5, CSS3, JavaScript |
| Backend          | PHP 8.3                 |
| Database         | MySQL 8.0               |
| Rich Text Editor | Quill.js                |
| Security         | DOMPurify               |
| Cloud Storage    | Cloudflare R2           |
| Cloud SDK        | AWS SDK for PHP         |
| Web Server       | Apache (Ubuntu 22.04)   |
| Containerization | Docker                  |
| Deployment       | Railway                 |

---

## Project Structure

```text
login-dashboard-project/
├── admin/               # Admin panel and CMS management pages
├── api/                 # Backend APIs and database logic
├── assets/              # CSS, JavaScript, images, uploads
├── pages/               # Frontend pages
├── Dockerfile           # Docker build configuration
├── docker-compose.yml   # Local development environment
├── init.sql             # Database schema
├── php.ini              # PHP configuration
└── README.md            # Project documentation
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

## Deploying to Railway

This project is configured for deployment on Railway.

### Deployment Steps

1. Push the repository to GitHub.
2. Create a new Railway project.
3. Deploy from GitHub.
4. Add a MySQL service.
5. Configure environment variables.
6. Run `init.sql` to create the database schema.
7. Push updates to GitHub to trigger automatic deployments.

---

## What I Learned Building This

### 🐳 DevOps & Deployment

* Writing Dockerfiles and understanding containerized application workflows.
* Using Docker Compose to orchestrate multi-container environments.
* Deploying containerized applications to Railway.
* Connecting cloud-hosted applications to managed databases.
* Managing production environment variables securely.
* Implementing CI/CD workflows through GitHub and Railway.
* Migrating development environments from XAMPP to Laragon and Docker.
* Understanding how containerization solves environment consistency problems.
* Upgrading the application from PHP 8.1 to PHP 8.3.
* Troubleshooting production deployment issues across Linux environments.

### ☁️ Cloud Infrastructure & Storage

* Integrating Cloudflare R2 object storage into a production application.
* Using the AWS SDK for PHP with S3-compatible cloud storage services.
* Managing uploaded assets through cloud-based object storage.
* Designing systems that separate persistent storage from application containers.
* Implementing cloud-hosted image and document management.
* Debugging asset delivery and URL generation issues across environments.
* Managing cloud credentials securely using environment variables.

### 🔒 Security & Vulnerabilities

* Protecting against XSS attacks using DOMPurify.
* Implementing secure password hashing with bcrypt.
* Managing authenticated sessions securely.
* Preventing CSRF attacks through token validation.
* Protecting uploaded files from unauthorized directory access.
* Keeping sensitive credentials out of source control through environment variables.
* Learning how security vulnerabilities can arise from improper handling of user-generated content.

### 🛠️ Software Development

* Building a custom CMS from scratch using PHP and MySQL.
* Implementing rich-text editing functionality using Quill.js.
* Creating responsive user interfaces with HTML, CSS, and JavaScript.
* Managing image uploads and cloud-hosted media assets.
* Debugging production issues using logs and error reporting.
* Working with third-party SDKs and cloud service integrations.
* Designing scalable application architecture that supports future growth.

---

> ⚠️ **This project is actively being developed and improved.**
>
> New features, security enhancements, infrastructure improvements, and code refactoring are continuously being added as part of my learning journey and professional growth as a developer.

---

*This portfolio is a living project that evolves alongside my skills as a software developer.*
