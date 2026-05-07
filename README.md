# Personal Portfolio Website

## About This Project

This is my personal portfolio website — a centralized hub designed to showcase my professional profile, skills, projects, and career journey to potential employers and clients.

## Purpose

The primary goal of this project is to present myself as a **professional** in a polished, recruiter-ready format. It serves as my digital identity — a single destination where visitors can learn who I am, what I can do, and the value I bring. Rather than limiting to a single role, this portfolio showcases versatility across multiple areas of expertise.

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

## Project Journey

This project started in **March 2026** and went through several major phases:

**Phase 1 — XAMPP & phpMyAdmin**
Started the project locally using XAMPP as the development environment with phpMyAdmin for database management. Ran into environment-specific errors that were difficult to debug and resolve on XAMPP.

**Phase 2 — Migration to Laragon**
Migrated the entire project to Laragon for a more stable local development experience. Laragon's cleaner Apache + MySQL setup resolved the issues encountered in XAMPP and allowed development to continue smoothly.

**Phase 3 — Learning Docker**
With the project working locally on Laragon, began learning Docker from scratch. Wrote a `Dockerfile` line by line to understand every instruction, then set up `docker-compose` to run PHP and MySQL together in containers — replicating the production environment locally.

**Phase 4 — Deployment to Railway**
Deployed the containerized app to Railway with a managed MySQL database. Encountered and resolved several real-world deployment issues along the way:

- **Missing build dependencies** — Railway's clean Linux environment didn't have `git` or `zip` installed, causing Composer to fail when installing packages. Fixed by explicitly installing them in the Dockerfile with `apt-get`.

- **Apache MPM conflict** (`AH00534: More than one MPM loaded`) — The `php:8.2-apache` base image had conflicting Apache process managers on Railway's Linux platform. Resolved by switching to a clean `ubuntu:22.04` base image for full control over the Apache configuration.

- **PHP environment variables not readable** — On Ubuntu + Apache, Railway's injected environment variables weren't accessible via `$_ENV`. Fixed by switching to `getenv()` which reads system environment variables directly, regardless of how they were injected.

- **phpdotenv crashing without `.env` file** — The app used `$dotenv->load()` which throws an exception if no `.env` file exists. Since Docker and Railway inject credentials as environment variables instead of a file, switched to `$dotenv->safeLoad()` which silently skips the missing file.

- **Database tables not existing on Railway** — The `init.sql` file auto-runs in docker-compose on first startup, but Railway's managed MySQL doesn't have this mechanism. Tables had to be manually created by running `init.sql` in Railway's Database query editor.

- **PHP errors breaking JSON responses** — PHP was outputting error notices before the JSON response, causing `Unexpected end of JSON input` on the frontend. Fixed by adding a `php.ini` config file with `display_errors = Off` so errors are logged server-side instead of printed to the browser.

- **Railway query editor mangling bcrypt hashes** — Railway's MySQL query editor treated `$` signs in bcrypt password hashes as variable references, corrupting the stored hash. Worked around by using MySQL's `CONCAT()` function to split the hash string and avoid the `$` parsing issue.

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

### 🛠️ General Development
- Implementing **rich text editing** with Quill.js
- Protecting against **XSS attacks** using DOMPurify
- Debugging PHP errors in production using server-side logging
- Reading and understanding real error logs to diagnose issues

---

> ⚠️ **This project is still actively being developed.** Even though it is deployed and live, I am still learning and continuously planning improvements — whether that's better security practices, new features, performance optimizations, or code refactoring. Every commit reflects a step forward in my growth as a developer.

---

*This portfolio is a living project — continuously updated to reflect my growth as a developer.*