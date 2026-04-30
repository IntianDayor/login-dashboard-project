// =============== DASHBOARD SCRIPT ============== //

// Global function to handle logout from any page
function logout(redirectPath) {
    localStorage.removeItem("username");
    localStorage.removeItem("isAdmin");
    window.location.href = redirectPath;
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
    const username = localStorage.getItem("username");
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