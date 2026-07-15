// ====== MANAGE RESUME SCRIPTS ====== //

// Upload Resume Script //
const uploadForm = document.querySelector(".upload-resume-wrapper form");

if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const confirmed = await confirmAction('This will replace your current resume. Continue?');
        if (!confirmed) return;

        const submitButton = uploadForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true, 'Uploading...');
        
        const formData = new FormData(uploadForm);

        try {
            const response = await fetch("../api/upload-resume.php", {
                method: "POST",
                headers: { "X-CSRF-Token": getCsrfToken() },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showToast(result.message, 'success');
                uploadForm.reset();
            } else {
                showToast("Error: " + result.message);
            }
        } catch (error) {
            showToast("Upload failed: " + error.message);
        } finally {
            setButtonLoading(submitButton, false);
        }
    });
}

// View Resume Script //
const resumeContainer = document.querySelector(".resume-content");

if (resumeContainer) {
    showContentLoading(resumeContainer, 'Loading resume...');
    fetch("../api/get-resumes.php")
    .then(res => res.json())
    .then(data => {
        clearContentLoading(resumeContainer);
        if (data.length === 0) {
            resumeContainer.innerHTML = "<p>No resume uploaded yet.</p>";
            return;
        }

        const resume = data[0];
        
        resumeContainer.innerHTML = `
            <h3 class="resume-viewer-title">Christian Dior Feraer's Latest Resume</h3>
            <div class="resume-viewer-frame-wrapper">
                <iframe class="resume-viewer-frame"
                    src="${resume.file_path.startsWith('http') ? resume.file_path : '../' + resume.file_path}">
                </iframe>
            </div>
            <div class="resume-viewer-actions">
                <a class="resume-open-btn"
                    href="${resume.file_path.startsWith('http') ? resume.file_path : '../' + resume.file_path}"
                    target="_blank">
                    Open Fullscreen
                </a>
            </div>
        `;
    })
    .catch(error => {
        clearContentLoading(resumeContainer);
        resumeContainer.innerHTML = "<p>Failed to load resume. Please try again.</p>";
        console.error("Error loading resume:", error);
    });
}
