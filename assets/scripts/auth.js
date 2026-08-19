// =============== PAGE VIEW LOGGING ================ //

(function logPageView() {
    fetch('../api/log-view.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: window.location.pathname })
    }).catch(() => {}); // fire-and-forget, never blocks the page
})();

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

// =============== LOADING STATUS ================ //
function setFormLoading(form, isLoading, loadingText) {
    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) return;

    if (isLoading) {
        submitButton.dataset.defaultText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
        submitButton.innerHTML = `<span class="button-spinner" aria-hidden="true"></span>${loadingText}`;
        form.querySelectorAll('input, button').forEach((element) => {
            if (element !== submitButton && !element.disabled) {
                element.disabled = true;
                element.dataset.loadingDisabled = 'true';
            }
        });
        form.querySelectorAll('p').forEach((element) => element.classList.add('is-disabled'));
    } else {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        submitButton.textContent = submitButton.dataset.defaultText;
        form.querySelectorAll('[data-loading-disabled]').forEach((element) => {
            element.disabled = false;
            delete element.dataset.loadingDisabled;
        });
        form.querySelectorAll('.is-disabled').forEach((element) => element.classList.remove('is-disabled'));
    }
}

// =============== AUTH SCRIPT ============== //

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector("form");

    const darkModePreference = localStorage.getItem('darkMode');
    const isDarkMode = darkModePreference === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }

    const authThemeToggle = document.createElement('button');
    authThemeToggle.className = 'theme-toggle';
    authThemeToggle.type = 'button';
    const updateThemeIcon = () => {
        const isDarkMode = document.body.classList.contains('dark-mode');
        authThemeToggle.innerHTML = `<img src="/assets/uploads/images/icons/${isDarkMode ? 'icons8-light-mode-50.png' : 'icons8-do-not-disturb-ios-50-2.png'}" alt="" aria-hidden="true">`;
        authThemeToggle.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
    };
    updateThemeIcon();
    authThemeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const enabled = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', enabled ? 'true' : 'false');
        updateThemeIcon();
    });
    form?.parentNode?.insertBefore(authThemeToggle, form);

    function navigateWithAuthTransition(destination) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            window.location.href = destination;
            return;
        }

        document.body.classList.add('auth-leaving');
        window.setTimeout(() => {
            window.location.href = destination;
        }, 280);
    }

    // ================= LOGIN PAGE ================= //
    if (document.body.classList.contains("auth") && window.location.pathname.includes("login")) {

        form?.addEventListener("submit", async (event) => {
            event.preventDefault();

            const username = form.querySelector('input[type="text"]').value;
            const password = form.querySelector('input[type="password"]').value;

            if (!username || !password) {
                showToast("Please enter both username and password")
                return;
            }

            setFormLoading(form, true, 'Logging in...');
            try {
                const response = await fetch("/api/login.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();

                if (!result.success) {
                    showToast(result.message || "Login failed")
                    return;
                }

                localStorage.setItem("username", result.user.username);
                localStorage.setItem("isAdmin", result.isAdmin);
                localStorage.setItem("csrf_token", result.csrf_token);

                window.location.href = result.isAdmin
                    ? "/pages/admin/admin-panel.html"
                    : "/pages/user/dashboard.html";
            } catch (err) {
                showToast("Network error. Please try again.")
                console.error(err);
            } finally {
                setFormLoading(form, false);
            }
        });

        // Go to signup page
        document.getElementById("sign-up-button")?.addEventListener("click", () => {
            navigateWithAuthTransition("/pages/user/signup.html");
        });
    }

    // ================= SIGNUP PAGE ================= //
    if (document.body.classList.contains("auth") && window.location.pathname.includes("signup")) {

        form?.addEventListener("submit", async (event) => {
            event.preventDefault();

            const username = document.getElementById('username-reg').value;
            const password = document.getElementById('create').value;
            const confirmPassword = document.getElementById('confirmpass').value;
            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;

            if (!username || !password || !fullname || !email) {
                showToast("Please fill in all fields")
                return;
            }

            if (password.length < 6) {
                showToast("Password must be at least 6 characters long")
                return;
            }

            if (password !== confirmPassword) {
                showToast("Passwords do not match")
                return;
            }

            setFormLoading(form, true, 'Creating account...');
            try {
                const response = await fetch("/api/signup.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password, fullname, email })
                });

                const result = await response.json();

                // Handle specific error messages from the server
                if (!result.success) {
                    const MSG = {
                        "Username already taken": "Username already exists. Please choose another.",
                        "Email already registered": "Email already registered. Please use another email.",
                    };
                    showToast(MSG[result.message] ?? "Signup failed")
                    return;
                }

                showToast("Account created!", 'success')
                window.location.href = "/pages/user/login.html";
            } catch (err) {
                showToast("Network error. Please try again")
                console.error(err);
            } finally {
                setFormLoading(form, false);
            }

        });

        // Go back to login page
        document.getElementById("back-to-login")?.addEventListener("click", () => {
            navigateWithAuthTransition("/pages/user/login.html");
        });
    }
});
