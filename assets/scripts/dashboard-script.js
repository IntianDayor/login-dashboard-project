// =============== DASHBOARD SCRIPT ============== //

document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.querySelector(".sidebar");
    const openBtn = document.querySelector(".sidebar-button");
    const closeBtn = document.querySelector(".sidebar-button-2");
    const usernameDisplay = document.getElementById("username");
    const logoutBtn = document.getElementById("log-out");

    // Sidebar toggle (shared) //
    openBtn?.addEventListener("click", () => sidebar?.classList.add("active"));
    closeBtn?.addEventListener("click", () => sidebar?.classList.remove("active"));

    // Display username //
    const username = localStorage.getItem("username");
    if (usernameDisplay) {
        usernameDisplay.textContent = username || "Guest";
    }

    // Logout (shared) //
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

});