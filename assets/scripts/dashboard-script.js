// =============== ALERT MSG ================ //

function showToast(message, type = 'error', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

function setButtonLoading(button, isLoading, loadingText = 'Loading...') {
    if (!button) return;

    if (isLoading) {
        button.dataset.defaultText = button.textContent;
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.innerHTML = `<span class="button-spinner" aria-hidden="true"></span>${loadingText}`;
    } else {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = button.dataset.defaultText;
    }
}

function showContentLoading(container, message = 'Loading...') {
    if (!container) return;
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = `<div class="content-loading"><span class="content-spinner" aria-hidden="true"></span>${message}</div>`;
}

function clearContentLoading(container) {
    container?.removeAttribute('aria-busy');
}

function setPageLoading(isLoading) {
    let overlay = document.getElementById('page-loading-overlay');
    if (isLoading && !overlay) {
        overlay = document.createElement('div');
        overlay.id = 'page-loading-overlay';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.innerHTML = `
            <div class="page-loading-card">
                <div class="page-loading-mark" aria-hidden="true">
                    <span></span><span></span><span></span>
                </div>
                <div class="page-loading-copy">
                    <span class="page-loading-eyebrow">Please wait</span>
                    <span class="page-loading-title">Loading your page</span>
                </div>
                <span class="page-loading-bar" aria-hidden="true"><span></span></span>
            </div>`;
        document.body.appendChild(overlay);
    }
    if (!isLoading) overlay?.remove();
}

// ============= CONDIRMATION MODAL =============//

function confirmAction(message) {
    return new Promise(resolve => {

        let overlay = document.getElementById('confirm-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'confirm-overlay';
            overlay.innerHTML = `
                <div id="confirm-box" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                    <div class="confirm-icon" aria-hidden="true">!</div>
                    <p class="confirm-title" id="confirm-title">Confirm action</p>
                    <p id="confirm-message"></p>
                    <div class="confirm-actions">
                        <button id="confirm-cancel-btn" type="button">Cancel</button>
                        <button id="confirm-ok-btn" type="button">Confirm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        document.getElementById('confirm-message').textContent = message;
        overlay.classList.add('active');

        document.getElementById('confirm-ok-btn').onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => resolve(true), 200); // Wait for animation
        };

        document.getElementById('confirm-cancel-btn').onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => resolve(false), 200); // Wait for animation
        };

        document.getElementById('confirm-cancel-btn').focus();

    });
}

function toImageSrc(path) {
    if (!path) return '';
    if (path.startsWith('http')) {
        const key = path.substring(path.indexOf('images/'));
        return `../api/get-image.php?key=${encodeURIComponent(key)}`;
    }
    return `../api/get-image.php?key=${encodeURIComponent(path)}`;
}

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

        return data;

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
        localStorage.removeItem("csrf_token");
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
    if (onAdminPage || onUserPage) {
        setPageLoading(true);
        try {
            await verifySession(onAdminPage);
        } finally {
            setPageLoading(false);
        }
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

    // Load theme preference
    const darkModePreference = localStorage.getItem('darkMode');
    const isDarkMode = darkModePreference === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }

    // Handles Sidebars Both Admin and User
    const sidebarPath = onAdminPage ? '../admin/admin-sidebar.html' : '../pages/user-sidebar.html';
    showContentLoading(document.getElementById('sidebar-container'), 'Loading navigation...');

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

            const topbar = container.querySelector('.topbar');
            if (topbar) {
                const themeToggleBtn = document.createElement('button');
                themeToggleBtn.className = 'theme-toggle';
                themeToggleBtn.type = 'button';
                themeToggleBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
                topbar.insertBefore(themeToggleBtn, topbar.querySelector('.home-button'));
            }

            // Attach sidebar events
            const sidebar  = document.querySelector('.sidebar');
            const openBtn  = document.querySelector('.sidebar-button');
            const closeBtn = document.querySelector('.sidebar-button-2');
            const logoutBtn = document.getElementById('log-out');
            const homeBtn   = document.getElementById('home');
            const themeToggle = document.querySelector('.theme-toggle');

            openBtn?.addEventListener('click', () => sidebar?.classList.add('active'));
            closeBtn?.addEventListener('click', () => sidebar?.classList.remove('active'));

            themeToggle?.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                const enabled = document.body.classList.contains('dark-mode');
                localStorage.setItem('darkMode', enabled ? 'true' : 'false');
                themeToggle.textContent = enabled ? '☀️' : '🌙';
            });

            logoutBtn?.addEventListener('click', () => {
                const path = onAdminPage ? '../pages/login.html' : 'login.html';
                setButtonLoading(logoutBtn, true, 'Logging out...');
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
        })
        .catch(() => {
            document.getElementById('sidebar-container')?.replaceChildren();
            showToast('Navigation failed to load. Please refresh the page.');
        });
});
