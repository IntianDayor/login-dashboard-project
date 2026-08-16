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
            const response = await fetch("/api/upload-resume.php", {
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
    fetch("/api/get-resumes.php")
        .then(res => res.json())
        .then(data => {
            clearContentLoading(resumeContainer);
            if (data.length === 0) {
                resumeContainer.innerHTML = "<p>No resume uploaded yet.</p>";
                return;
            }

            const resume = data[0];
            const resumeUrl = '/api/get-current-resume-pdf.php';

            resumeContainer.innerHTML = `
            <h3 class="resume-viewer-title">Christian Dior Feraer's Latest Resume</h3>
            <div class="resume-viewer-frame-wrapper">
                <div class="resume-viewer-frame" role="region" aria-label="Resume preview">
                    <canvas class="resume-preview-canvas"></canvas>
                </div>
            </div>
            <div class="resume-viewer-actions">
                <button class="resume-page-btn" type="button" data-direction="previous" disabled>Previous</button>
                <span class="resume-page-status" aria-live="polite">Loading preview...</span>
                <button class="resume-page-btn" type="button" data-direction="next" disabled>Next</button>
                <a class="resume-open-btn"
                    href="${resumeUrl}"
                    target="_blank">
                    Open Fullscreen
                </a>
            </div>
        `;

            return renderResumePreview(resumeContainer);
        })
        .catch(error => {
            clearContentLoading(resumeContainer);
            resumeContainer.innerHTML = "<p>Failed to load resume. Please try again.</p>";
            console.error("Error loading resume:", error);
        });
}

async function renderResumePreview(container) {
    if (!window.pdfjsLib) {
        throw new Error('PDF preview library failed to load.');
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const pdf = await pdfjsLib.getDocument('/api/get-current-resume-pdf.php').promise;
    const frame = container.querySelector('.resume-viewer-frame');
    const canvas = container.querySelector('.resume-preview-canvas');
    const status = container.querySelector('.resume-page-status');
    const previous = container.querySelector('[data-direction="previous"]');
    const next = container.querySelector('[data-direction="next"]');
    let currentPage = 1;

    const renderPage = async () => {
        const page = await pdf.getPage(currentPage);
        const unscaledViewport = page.getViewport({ scale: 1 });
        const frameBounds = frame.getBoundingClientRect();
        const scale = Math.min(
            (frameBounds.width - 2) / unscaledViewport.width,
            (frameBounds.height - 2) / unscaledViewport.height
        );
        const viewport = page.getViewport({ scale: Math.max(scale, 0.1) });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const renderTask = page.render({
            canvasContext: canvas.getContext('2d'),
            viewport,
            transform: pixelRatio === 1 ? null : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await renderTask.promise;

        status.textContent = `Page ${currentPage} of ${pdf.numPages}`;
        previous.disabled = currentPage === 1;
        next.disabled = currentPage === pdf.numPages;
    };

    previous.addEventListener('click', async () => {
        if (currentPage > 1) {
            currentPage--;
            await renderPage();
        }
    });

    next.addEventListener('click', async () => {
        if (currentPage < pdf.numPages) {
            currentPage++;
            await renderPage();
        }
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(renderPage, 150);
    });

    await renderPage();
}
