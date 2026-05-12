// ====== MANAGE RESUME SCRIPTS ====== //

// Upload Resume Script //
const uploadForm = document.querySelector(".upload-resume-wrapper form");

if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(uploadForm);

        try {
            const response = await fetch("../api/upload-resume.php", {
                method: "POST",
                headers: { "X-CSRF-Token": getCsrfToken() },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                uploadForm.reset();
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            alert("Upload failed: " + error.message);
        }
    });
}

// View Resume Script //
const resumeContainer = document.querySelector(".resume-content");

if (resumeContainer) {
    fetch("../api/get-resumes.php")
    .then(res => res.json())
    .then(data => {
        if (data.length === 0) {
            resumeContainer.innerHTML = "<p>No resume uploaded yet.</p>";
            return;
        }

        const resume = data[0];
        
        resumeContainer.innerHTML = `
            <h3 class="resume-viewer-title">Christian Dior Feraer's Latest Resume</h3>
            <div class="resume-viewer-frame-wrapper">
                <iframe class="resume-viewer-frame"
                    src="../assets/uploads/resumes/${resume.file_path}">
                </iframe>
            </div>
            <div class="resume-viewer-actions">
                <a class="resume-open-btn"
                    href="../assets/uploads/resumes/${resume.file_path}"
                    target="_blank">
                    Open Fullscreen
                </a>
            </div>
        `;
    })
    .catch(error => {
        alert("Error loading resume");
    });
}