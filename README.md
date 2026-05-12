# Personal Portfolio Website

## About This Project

This is my personal portfolio website: a centralized hub designed to showcase my professional profile, skills, projects, and career journey to potential employers and clients.

## Purpose

The primary goal of this project is to present myself as a **professional** in a polished, recruiter-ready format. It serves as my digital identity, a single destination where visitors can learn who I am, what I can do, and the value I bring. Rather than limiting to a single role, this portfolio showcases versatility across multiple areas of expertise.

## Live Demo

🌐 **[christiandior-feraer-portfolio.up.railway.app](https://christiandior-feraer-portfolio.up.railway.app)**

## Features

### 🧑 Professional Profile
- **About Me** — A professional summary introducing my background, career goals, and passion for web development.
- **Resume** — A detailed curriculum vitae (CV) highlighting my education, work experience, and professional journey.
- **Rich Text Descriptions** — Profile and project descriptions support bold, italic, underline, and bullet points via Quill.js.

### 💼 Portfolio Showcase
- **Project Gallery** — A curated display of my completed projects in a 3-column responsive grid.
- **Project Details** — Each project includes rich text descriptions, image sliders, and GitHub links.
- **GitHub Hint Banner** — A clickable banner that links directly to the project repository.

### 🔐 User Authentication
- **Login System** — Secure user authentication allowing access to protected dashboard areas.
- **Admin Panel** — A backend management interface for managing users, projects, resume, and profile.
- **Role-based Access** — Separate views and permissions for `admin` and `user` roles.

### 🎨 Design & UX
- **Responsive Design** — Fully optimized for desktop, tablet, and mobile devices.
- **Modern UI** — Clean, professional aesthetic with intuitive navigation.
- **Interactive Elements** — Smooth animations, image modals, and project card sliders.

### 🔒 Security
- **XSS Protection** — All rich text content is sanitized using DOMPurify before saving and before rendering.
- **Password Hashing** — All passwords are hashed using PHP's `password_hash()` with bcrypt.
- **Session Authentication** — Protected pages require valid PHP sessions.
- **CSRF Protection** — All mutating requests (uploads, edits) require a valid CSRF token sent via the `X-CSRF-Token` header, preventing cross-site request forgery attacks.

## Technology Stack

| Category | Technologies |
|----------|--------------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | PHP 8.1 |
| Database | MySQL 8.0 |
| Rich Text | Quill.js |
| Security | DOMPurify |
| Server | Apache (Ubuntu 22.04) |
| Containerization | Docker |
| Deployment | Railway |

## Project Structure

```
login-dashboard-project/
├── admin/               # Admin panel & management pages
├── api/                 # Backend API & database scripts
├── assets/              # CSS, JavaScript, images, uploads
├── pages/               # Main site pages (login, dashboard, etc.)
├── Dockerfile           # Docker build instructions
├── docker-compose.yml   # Local development with Docker
├── init.sql             # Database schema
├── php.ini              # PHP configuration
└── README.md            # Project documentation
```

## Running Locally with Docker

Make sure Docker Desktop is installed, then:

```bash
# Start the app and database
docker-compose up --build

# Visit
http://localhost:8080/pages/login.html
```

To stop:
```bash
docker-compose down
```

To stop and wipe the database:
```bash
docker-compose down -v
```

## Deploying to Railway

This project is configured for one-click deployment on Railway.

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a MySQL database service
4. Set environment variables in the app service:
   ```
   DB_HOST = ${{ MySQL.MYSQLHOST }}
   DB_USER = ${{ MySQL.MYSQLUSER }}
   DB_PASS = ${{ MySQL.MYSQLPASSWORD }}
   DB_NAME = ${{ MySQL.MYSQLDATABASE }}
   ```
5. Run `init.sql` in Railway's MySQL Database tab to create tables
6. Every `git push` to `main` triggers an automatic redeploy

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL username |
| `DB_PASS` | MySQL password |
| `DB_NAME` | MySQL database name |

## What I Learned Building This

### 🐳 DevOps & Deployment
- Writing a **Dockerfile** from scratch and understanding every instruction
- Using **docker-compose** to run multi-container apps locally (PHP + MySQL)
- Debugging deployment issues across different Linux environments
- Connecting a containerized app to a managed cloud database
- Managing **environment variables** securely in production
- Setting up **CI/CD** — every GitHub push auto-deploys to Railway
- Migrating between local development environments (XAMPP → Laragon → Docker)
- The value of containerization — solving the "works on my machine" problem

### 🔒 Security & Vulnerabilities
- **XSS (Cross-Site Scripting)** — learned that rendering user input with `.innerHTML` without sanitization allows attackers to inject malicious scripts. Fixed by integrating **DOMPurify** to strip dangerous tags before saving to the database and before rendering in the browser.
- **Session management** — learned that calling `session_start()` unconditionally can cause conflicts when a session is already active. Fixed by checking `session_status() === PHP_SESSION_NONE` before starting a session in `auth-check.php`.
- **Directory listing** — learned that without protection, Apache can expose the contents of upload folders to anyone who visits the URL. Fixed using `.htaccess` with `Options -Indexes` to block directory browsing on upload folders.
- **Password security** — all passwords are hashed using PHP's `password_hash()` with bcrypt, meaning raw passwords are never stored in the database.
- **Environment variable security** — database credentials are never hardcoded or committed to GitHub. They are injected at runtime via Railway's environment variable system.
- **CSRF (Cross-Site Request Forgery) protection** — learned that file upload endpoints need a CSRF token to prevent malicious sites from triggering actions on behalf of logged-in users. Implemented a token-based system where the server generates a token on login, stores it in the session, and every mutating request must send it via the `X-CSRF-Token` header. Also learned that deploying to a multi-instance environment (Railway) requires database-backed sessions so all containers share the same token, and that PHP's `getallheaders()` is case-sensitive so header keys must be normalized with `array_change_key_case()`.


### 🛠️ General Development
- Implementing **rich text editing** with Quill.js
- Protecting against **XSS attacks** using DOMPurify
- Debugging PHP errors in production using server-side logging
- Reading and understanding real error logs to diagnose issues

---

> ⚠️ **This project is still actively being developed.** Even though it is deployed and live, I am still learning and continuously planning improvements — whether that's better security practices, new features, performance optimizations, or code refactoring. Every commit reflects a step forward in my growth as a developer.

---

*This portfolio is a living project — continuously updated to reflect my growth as a developer.*
