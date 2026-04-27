// Upload Resume Script //

const form = document.querySelector(".upload-resume-wrapper form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    try {
        const response = await fetch("../api/upload-resume.php", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            form.reset();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        alert("Upload failed: " + error.message);
    }
});