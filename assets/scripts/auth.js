// =============== AUTH SCRIPT ============== //

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector("form");

    // ================= LOGIN PAGE ================= //
    if (document.body.classList.contains("auth") && window.location.pathname.includes("login")) {

        form?.addEventListener("submit", async (event) => {
            event.preventDefault();
            
            const username = form.querySelector('input[type="text"]').value;
            const password = form.querySelector('input[type="password"]').value;

            if (!username || !password) {
                alert("Please enter both username and password");
                return;
            }

            const response = await fetch("../api/login.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!result.success) {
                alert(result.message || "Login failed");
                return;
            }

            localStorage.setItem("username", result.user.username);
            localStorage.setItem("isAdmin", result.isAdmin);

            window.location.href = result.isAdmin
                ? "../admin/admin-panel.html"
                : "dashboard.html";
        });

        // Go to signup page
        document.getElementById("sign-up-button")?.addEventListener("click", () => {
            window.location.href = "signup.html";
        });
    }

    // ================= SIGNUP PAGE ================= //
    if (document.body.classList.contains("auth") && window.location.pathname.includes("signup")) {

        form?.addEventListener("submit", async (event) => {
            event.preventDefault();

            const username = form.querySelector('input[type="text"]').value;
            const password = form.querySelector('input[type="password"]').value;
            const confirmPassword = form.querySelectorAll('input[type="password"]')[1].value;
            const fullname = document.getElementById("fullname").value;
            const email = form.querySelector('input[type="email"]').value;

            if (!username || !password || !fullname || !email) {
                alert("Please fill in all fields");
                return;
            }

            if (password.length < 6) {
                alert("Password must be at least 6 characters long");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match");
                return;
            }

            const response = await fetch("../api/signup.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, fullname, email })
            });

            const result = await response.json();

            if (!result.success) {
                if (result.message === "Username already taken")
                    alert("Username already exists. Please choose another.");
                else if (result.message === "Email already registered")
                    alert("Email already registered. Please use another email.");
                else alert("Signup failed");
                return;
            }

            alert("Account created!");
            window.location.href = "login.html";
        });

        document.getElementById("back-to-login")?.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }
});