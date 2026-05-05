// =============== DASHBOARD SCRIPT ============== //

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


// Global function to handle logout from any page
function logout(redirectPath) {
    fetch("../api/logout.php", { method: "POST" }).finally(() => {
        localStorage.removeItem("username");
        localStorage.removeItem("isAdmin");
        window.location.href = redirectPath;
    });
}

document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.querySelector(".sidebar");
    const openBtn = document.querySelector(".sidebar-button");
    const closeBtn = document.querySelector(".sidebar-button-2");
    const usernameDisplay = document.getElementById("username");
    const logoutBtn = document.getElementById("log-out");
    const homeBtn = document.getElementById("home");
    const sidebarHomeBtn = document.querySelector(".sidebar #home");

    // Sidebar toggle //
    openBtn?.addEventListener("click", () => sidebar?.classList.add("active"));
    closeBtn?.addEventListener("click", () => sidebar?.classList.remove("active"));

    // Display username //
    if (usernameDisplay) {
        usernameDisplay.textContent = username || "Guest";
    }

    // Logout //
    logoutBtn?.addEventListener("click", () => {
        const path = window.location.pathname.includes("/admin/")
            ? "../pages/login.html"
            : "login.html";
        logout(path);
    });

    // Home Button //
    const homeClickHandler = () => {
        if (window.location.pathname.includes("/admin/")) {
            window.location.href = "admin-panel.html";
        } else {
            window.location.href = "dashboard.html";
        }
    };

    [homeBtn, sidebarHomeBtn].forEach(btn =>
        btn?.addEventListener("click", homeClickHandler));

    
    // Navigation Buttons (both Admin and User) //
    const navMap = {
        "resume":   "view-resume.html",
        "profile":  "profile.html",
        "projects": "projects-user.html",
        "manage-users":    "manage-users.html",
        "upload-projects": "projects.html",
        "upload-resume":   "upload-resume.html",
        "edit-profile":    "edit-profile.html",
    };

    Object.entries(navMap).forEach(([id, href]) => {
        document.getElementById(id)?.addEventListener("click", () =>
        window.location.href = href);
    });

});