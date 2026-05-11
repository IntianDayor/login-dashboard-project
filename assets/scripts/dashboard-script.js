// =============== DASHBOARD SCRIPT ============== //

// Verify session server-side on every page load
async function verifySession(requireAdmin = false) {
    try {
        const res = await fetch('../api/check-session.php');
        const data = await res.json();

        if (!data.loggedIn) {
            window.location.href = '../pages/login.html';
            return;
        }

        if (requireAdmin && !data.isAdmin) {
            window.location.href = '../pages/dashboard.html';
            return;
        }

        // Always refresh the CSRF token from the server
        if (data.csrf_token) {
            localStorage.setItem("csrf_token", data.csrf_token);
        }

        // Enable all submit/upload buttons after token is ready
        document.querySelectorAll('button[type="submit"], #add-project, #upload-resume-btn').forEach(btn => {
            btn.disabled = false;
        });

    } catch (err) {
        window.location.href = '../pages/login.html';
    }
}

// Get CSRF token from localStorage
function getCsrfToken() {
    return localStorage.getItem("csrf_token") || "";
}

// Global function to handle logout from any page
function logout(redirectPath) {
    fetch("../api/logout.php", { method: "POST", headers: { "X-CSRF-Token": getCsrfToken() } }).finally(() => {
        localStorage.removeItem("username");
        localStorage.removeItem("isAdmin");
        window.location.href = redirectPath;
    });
} 

// Credential Check if the user is logged in
const username = localStorage.getItem("username");
const isAdmin  = localStorage.getItem("isAdmin");
const onAdminPage = window.location.pathname.includes("/admin/");
const onUserPage  = window.location.pathname.includes("/pages/");

if (!username) {
    // Not logged in at all — send to login
    window.location.href = onAdminPage ? "../pages/login.html" : "login.html";
} else if (onAdminPage && isAdmin !== "true") {
    // Logged in but not admin — kick them out of admin pages
    window.location.href = "../pages/dashboard.html";
}

// Server-side session verification for admin pages
(async () => {
    if (onAdminPage) {
        await verifySession(true);
    } else if (onUserPage) {
        await verifySession(false);
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // Disable upload buttons until session is verified and token is ready
    document.querySelectorAll('button[type="submit"], #add-project, #upload-resume-btn').forEach(btn => {
        btn.disabled = true;
    });

    // Display Username in Home Page
    const usernameDisplay = document.getElementById('username');
    if (usernameDisplay) {
        usernameDisplay.textContent = username || 'Guest';
    }

    // Handles Sidebars Both Admin and User
    const sidebarPath = onAdminPage ? '../admin/admin-sidebar.html' : '../pages/user-sidebar.html';

    fetch(sidebarPath)
        .then(res => res.text())
        .then(html => {
            const container = document.getElementById('sidebar-container');
            container.innerHTML = html;

            // Set page title
            const title = container.dataset.title;
            if (title) {
                container.querySelector('.page-title').textContent = title;
            }

            // Attach sidebar events
            const sidebar  = document.querySelector('.sidebar');
            const openBtn  = document.querySelector('.sidebar-button');
            const closeBtn = document.querySelector('.sidebar-button-2');
            const logoutBtn = document.getElementById('log-out');
            const homeBtn   = document.getElementById('home');

            openBtn?.addEventListener('click', () => sidebar?.classList.add('active'));
            closeBtn?.addEventListener('click', () => sidebar?.classList.remove('active'));

            logoutBtn?.addEventListener('click', () => {
                const path = onAdminPage ? '../pages/login.html' : 'login.html';
                logout(path);
            });

            const homeClickHandler = () => {
                window.location.href = onAdminPage ? 'admin-panel.html' : 'dashboard.html';
            };
            homeBtn?.addEventListener('click', homeClickHandler);

            // Nav items
            const navMap = {
                'resume':           'view-resume.html',
                'profile':          'profile.html',
                'projects':         'projects-user.html',
                'manage-users':     'manage-users.html',
                'upload-projects':  'projects.html',
                'upload-resume':    'upload-resume.html',
                'edit-profile':     'edit-profile.html',
                'admin-home-nav':   'admin-panel.html',
                'home-nav':         'dashboard.html'
            };

            Object.entries(navMap).forEach(([id, href]) => {
                document.getElementById(id)?.addEventListener('click', () => {
                    window.location.href = href;
                });
            });
        });
});