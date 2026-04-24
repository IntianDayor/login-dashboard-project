# Personal Portfolio Website

## About This Project

This is my personal portfolio website — a centralized hub designed to showcase my professional profile, skills, projects, and career journey to potential employers and clients.

## Purpose

The primary goal of this project is to present myself as a **professional** in a polished, recruiter-ready format. It serves as my digital identity — a single destination where visitors can learn who I am, what I can do, and the value I bring. Rather than limiting to a single role, this portfolio showcases versatility across multiple areas of expertise.

## Features

### 🧑 Professional Profile
- **About Me** — A professional summary introducing my background, career goals, and passion for web development.
- **Resume** — A detailed curriculum vitae (CV) highlighting my education, work experience, and professional journey.
- **Skills** — A comprehensive breakdown of my technical skills, tools, and technologies I work with.

### 💼 Portfolio Showcase
- **Project Gallery** — A curated display of my completed projects, case studies, and practical work samples.
- **Project Details** — Each project includes descriptions, technologies used, and live links where applicable.

### 🔐 User Authentication
- **Login System** — Secure user authentication allowing access to protected dashboard areas.
- **Admin Panel** — A backend management interface for managing users and content.
- **Dashboard** — A personalized area for viewing stats and managing portfolio content.

### 🎨 Design & UX
- **Responsive Design** — Fully optimized for desktop, tablet, and mobile devices.
- **Modern UI** — Clean, professional aesthetic with intuitive navigation.
- **Interactive Elements** — Smooth animations and engaging user interactions.

## Technology Stack

| Category | Technologies |
|----------|--------------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | PHP |
| Database | MySQL, phpMyAdmin |
| Server | Laragon (Apache + MySQL) |

## Project Structure

```
login-dashboard-project/
├── admin/               # Admin panel & management pages
├── api/                 # Backend API & database scripts
├── assets/              # CSS, JavaScript, images
├── pages/               # Main site pages (login, dashboard, etc.)
└── README.md            # Project documentation
```

## Getting Started

1. **Install Laragon** — Download and install Laragon from [laragon.org](https://laragon.org)
2. **Start Services** — Launch Laragon and click Start to activate Apache & MySQL
3. **Setup Database** — Open phpMyAdmin (click Database button in Laragon), create a database, and import the provided SQL file
4. **Configure Connection** — Update `api/db.php` with your database credentials
5. **Run the Project** — Place the project folder in `www` and access via `localhost`

---

*This portfolio is a living project — continuously updated to reflect my growth as a developer.*