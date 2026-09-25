# Portfolio Website and CMS

## About This Project

This project is a personal portfolio website and content management system. Visitors can view profile and project information, while administrators manage portfolio content and uploaded assets through a dashboard. The application uses PHP and MySQL, with Cloudflare R2 for file storage.

## Purpose

The purpose of the project is to provide a single place to present professional experience and work, while demonstrating a complete web application workflow: content management, authentication, persistent storage, and deployment.

**Live demo:** [Sign-in page](https://christiandiorferaer-portfoliohub.onrender.com/pages/user/login.html) · [Create an account](https://christiandiorferaer-portfoliohub.onrender.com/pages/user/signup.html) · [Download portfolio PDF](https://christiandiorferaer-portfoliohub.onrender.com/api/generate-portfolio-pdf.php)

There are no shared demo credentials. Signup creates a standard user account for viewing the portfolio pages; the admin CMS requires an administrator account.

## Documentation

- [Setup and deployment](docs/SETUP.md) — local Docker setup, production configuration, and backups.
- [Features](docs/FEATURES.md) — user and admin capabilities and their workflows.
- [System architecture](docs/SYSTEM_ARCHITECTURE.md) — application layers, diagrams, data flows, and security.
- [API endpoints](docs/API_ENDPOINTS.md) — routes, methods, access rules, and inputs.
- [What I learned](docs/LEARNINGS.md) — key implementation takeaways.

## Repository layout

- `api/` — PHP endpoints and shared backend code.
- `assets/` — JavaScript, stylesheets, and uploaded assets.
- `pages/` — user and admin HTML pages.
- `docs/` — project and API documentation.
- `.github/workflows/` — scheduled database backup and analytics cleanup automation.
- `init.sql` — database schema and seed data.
- `Dockerfile`, `docker-compose.yml` — container build and local services.

---

> ⚠️ **This project is actively being developed and improved.**
>
> New features, security enhancements, infrastructure improvements, and refactoring continue as part of my learning and development as a software developer.

This portfolio is a living project that evolves alongside my skills as a software developer.
