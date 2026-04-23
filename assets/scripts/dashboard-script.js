// =============== DASHBOARD SCRIPT ============== //

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
        localStorage.removeItem("username");
        localStorage.removeItem("isAdmin");

        // Redirect to login page
        if (window.location.pathname.includes("/admin/")) {
            window.location.href = "../pages/login.html";
        } else {
            window.location.href = "login.html";
        }
    });

    // Home Button //
    const homeClickHandler = () => {
        if (window.location.pathname.includes("/admin/")) {
            window.location.href = "admin-panel.html";
        } else {
            window.location.href = "dashboard.html";
        }
    };
    homeBtn?.addEventListener("click", homeClickHandler);
    sidebarHomeBtn?.addEventListener("click", homeClickHandler);


    // =============== Admin Panel Specific ============== //
    
    // Manage User Button (Admin only) //
    const manageUsersBtn = document.getElementById("manage-users");

    manageUsersBtn?.addEventListener("click", () => {
        window.location.href = "manage-users.html";
    });

});