// ====== MANAGE PROJECT SCRIPTS ====== //

function esc(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Upload/Delete Projects Script //

const addProjectbtn = document.getElementById('add-project');
const editProjectsToggle = document.getElementById('edit-projects-toggle');
const projectManagementList = document.getElementById('project-management-list');
const projectUploadPanel = document.getElementById('project-upload-panel');

editProjectsToggle?.addEventListener('click', () => {
    if (!projectManagementList) return;
    const isVisible = projectManagementList.style.display !== 'none';
    projectManagementList.style.display = isVisible ? 'none' : 'grid';
    projectUploadPanel?.classList.toggle('is-hidden', !isVisible);
    editProjectsToggle.textContent = isVisible ? 'Edit Projects' : 'Hide Projects';
});

addProjectbtn?.addEventListener('click', async (e) => {
    e.preventDefault();

    const confirmed = await confirmAction('Are you sure you want to upload this project?');
    if (!confirmed) return;

    setButtonLoading(addProjectbtn, true, 'Uploading...');

    const formData = new FormData();
    formData.append('title', document.getElementById('project-title').value);

    // Get Quill content and sanitize with DOMPurify
    const cleanHTML = DOMPurify.sanitize(window.projectQuill.root.innerHTML);
    formData.append('description', cleanHTML);

    formData.append('link', document.getElementById('project-link').value);

    const imageInput = document.getElementById('project-image');

    if (imageInput.files.length > 0) {
        for (let i = 0; i < imageInput.files.length; i++) {
            formData.append('images[]', imageInput.files[i]);
        }
    }

    try {
        const response = await fetch('/api/upload-projects.php', {
            method: 'POST',
            headers: { "X-CSRF-Token": getCsrfToken() },
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            showToast('Project uploaded successfully!', 'success');
        } else {
            showToast('Failed to upload project: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred while uploading the project.');
    } finally {
        setButtonLoading(addProjectbtn, false);
    }
});

async function deleteProject(id, cardElement) {
    const confirmed = await confirmAction('Delete this project? This cannot be undone.');
    if (!confirmed) return;
    const deleteButton = cardElement.querySelector('.delete-project-btn');
    setButtonLoading(deleteButton, true, 'Deleting...');
    try {
        const response = await fetch('/api/delete-project.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCsrfToken()
            },
            body: JSON.stringify({ id })
        });
        const result = await response.json();
        if (result.success) {
            cardElement.remove();
            showToast('Project deleted.', 'success');
        } else {
            showToast('Error: ' + result.message);
        }
    } catch (err) {
        console.error(err);
        showToast('An error occurred while deleting.');
    } finally {
        if (cardElement.isConnected) setButtonLoading(deleteButton, false);
    }
}

function createProjectEditForm(project) {
    const descriptionValue = project.description || '';
    return `
        <form class="project-edit-form" data-project-id="${project.id}">
            <div>
                <label>Project Title</label>
                <input type="text" name="title" value="${esc(project.title)}" required>
            </div>
            <div>
                <label>Project Description</label>
                <div class="project-edit-description-editor"></div>
                <textarea name="description" hidden>${esc(descriptionValue)}</textarea>
            </div>
            <div>
                <label>Project Link</label>
                <input type="text" name="link" value="${esc(project.project_link || '')}" placeholder="https://example.com">
            </div>
            <div class="checkbox-wrapper">
                <input type="checkbox" id="replace_${project.id}" name="replace_existing" value="1">
                <label for="replace_${project.id}">Replace existing preview images</label>
            </div>
            <div>
                <label>Preview Images</label>
                <input type="file" name="images[]" multiple accept="image/*">
            </div>
            <div class="edit-actions">
                <button type="submit" class="save-project-btn">Save</button>
                <button type="button" class="cancel-project-btn">Cancel</button>
            </div>
        </form>
    `;
}

function initProjectEditEditors() {
    document.querySelectorAll('.project-edit-description-editor').forEach((editorElement) => {
        if (editorElement.dataset.initialized === 'true') return;

        const formElement = editorElement.closest('form');
        const descriptionField = formElement?.querySelector('textarea[name="description"]');

        if (!formElement || !descriptionField) return;

        const quill = new Quill(editorElement, {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            }
        });

        if (descriptionField.value) {
            quill.root.innerHTML = DOMPurify.sanitize(descriptionField.value);
        }

        const syncDescription = () => {
            descriptionField.value = DOMPurify.sanitize(quill.root.innerHTML);
        };

        quill.on('text-change', syncDescription);
        syncDescription();
        editorElement.dataset.initialized = 'true';
    });
}

async function saveProject(projectId, formElement) {
    const saveButton = formElement.querySelector('.save-project-btn');
    const titleInput = formElement.querySelector('input[name="title"]');
    const descriptionInput = formElement.querySelector('textarea[name="description"]');
    const linkInput = formElement.querySelector('input[name="link"]');
    const replaceExistingInput = formElement.querySelector('input[name="replace_existing"]');
    const imageInput = formElement.querySelector('input[type="file"]');

    if (!titleInput.value.trim()) {
        showToast('Project title is required.');
        return;
    }

    setButtonLoading(saveButton, true, 'Saving...');

    const formData = new FormData();
    formData.append('id', projectId);
    formData.append('title', titleInput.value.trim());
    formData.append('description', DOMPurify.sanitize(descriptionInput.value));
    formData.append('link', linkInput.value.trim());
    if (replaceExistingInput?.checked) {
        formData.append('replace_existing', '1');
    }

    if (imageInput?.files?.length) {
        Array.from(imageInput.files).forEach(file => formData.append('images[]', file));
    }

    try {
        const response = await fetch('/api/update-project.php', {
            method: 'POST',
            headers: { 'X-CSRF-Token': getCsrfToken() },
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            showToast('Project updated successfully.', 'success');
            window.location.reload();
        } else {
            showToast(result.message || 'Unable to update project.');
        }
    } catch (err) {
        console.error(err);
        showToast('An error occurred while updating the project.');
    } finally {
        setButtonLoading(saveButton, false);
    }
}

function toggleProjectEditMode(card, showForm) {
    const content = card.querySelector('.project-content');
    const formWrapper = card.querySelector('.project-edit-wrapper');
    if (!content || !formWrapper) return;

    if (showForm) {
        content.style.display = 'none';
        formWrapper.style.display = 'block';
    } else {
        content.style.display = 'block';
        formWrapper.style.display = 'none';
    }
}

// View Projects Script //

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(".project-cards");
    if (!container) return;
    showContentLoading(container, 'Loading projects...');
    try {
        const res = await fetch("/api/get-projects.php");
        const data = await res.json();
        clearContentLoading(container);

        if (!data.length) {
            container.innerHTML = "<p>No projects found.</p>";
            return;
        }

        const session = await verifySession(false);
        const isAdmin = session?.isAdmin ?? false;

        container.innerHTML = data.map(project => {

            const imagesHTML = `
                <div class="project-slider" 
                    data-images='${JSON.stringify(project.images)}'
                    data-index="0">

                    <button class="slide-btn left" onclick="event.stopPropagation(); imageSlider(this, -1)">&#10094;</button>

                    <div class="slider-viewport">
                        <div class="slider-track">
                           ${project.images.map((img, index) =>
                `<div class="slider-slide-wrap"><img src="${toImageSrc(img)}" alt="${esc(project.title)} preview ${index + 1}" loading="lazy" decoding="async" onclick="event.stopPropagation(); openImageModal(this.closest('.project-slider'), ${index})"></div>`
            ).join("")}
                        </div>
                    </div>

                    <button class="slide-btn right" onclick="event.stopPropagation(); imageSlider(this, 1)">&#10095;</button>

                </div>
            `;

            return `
                <div class="project-card"
                data-link="${esc(project.project_link)}">
                    <div class="project-content">
                        <h3>${esc(project.title)}</h3>
                        ${isAdmin ? `
                        <div class="project-actions">
                            <button class="edit-project-btn"
                                onclick="event.stopPropagation(); toggleProjectEditMode(this.closest('.project-card'), true)">
                                ✏ Edit
                            </button>
                            <button class="delete-project-btn"
                                onclick="event.stopPropagation(); deleteProject(${project.id}, this.closest('.project-card'))">
                                🗑 Delete
                            </button>
                        </div>` : ''}
                        <div class="project-description">
                        ${DOMPurify.sanitize(project.description,
                {
                    ALLOWED_TAGS:
                        ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a'],
                    ADD_ATTR: ['href', 'target', 'rel']
                })}
                        </div>

                        <div class="project-images">
                            ${imagesHTML}
                        </div>
                    </div>
                    ${isAdmin ? `
                    <div class="project-edit-wrapper" style="display:none;">
                        ${createProjectEditForm(project)}
                    </div>` : ''}
                </div>
            `;
        }).join("");

        initProjectEditEditors();

        // Build and append image modal to the DOM
        const modal = document.createElement("div");
        modal.className = "image-modal";
        modal.id = "imageModal";
        modal.innerHTML = `
            <div class="image-modal-content" role="dialog" aria-modal="true" aria-label="Project image preview">
                <button class="close-modal" type="button" aria-label="Close image preview">&times;</button>
                <button class="modal-nav modal-prev" type="button" aria-label="Previous image">&#10094;</button>
                <span class="modal-spinner" aria-hidden="true"></span>
                <img id="modalImage" src="" alt="" decoding="async">
                <button class="modal-nav modal-next" type="button" aria-label="Next image">&#10095;</button>
                <span class="modal-image-count" aria-live="polite"></span>
            </div>`;
        container.appendChild(modal);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeImageModal();
        });
        modal.querySelector('.close-modal').addEventListener('click', closeImageModal);
        modal.querySelector('.modal-prev').addEventListener('click', () => changeModalImage(-1));
        modal.querySelector('.modal-next').addEventListener('click', () => changeModalImage(1));

        // Initialize sliders AFTER modal is in the DOM
        initSliders();

        // Add click handler to each card
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('a, .project-edit-form, .project-actions, .project-edit-wrapper')) return;
                // If click came from a link inside description, let it open naturally
                if (e.target.closest('a')) return;
                // Otherwise open the project link
                openProjectLink(card);
            });
        });

        document.querySelectorAll('.project-edit-form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const card = form.closest('.project-card');
                const projectId = form.dataset.projectId;
                await saveProject(projectId, form);
                if (card) toggleProjectEditMode(card, false);
            });
        });

        document.querySelectorAll('.cancel-project-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = button.closest('.project-card');
                if (card) toggleProjectEditMode(card, false);
            });
        });

        // Make description links clickable without triggering card click
        document.querySelectorAll('.project-description a').forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            link.addEventListener('click', (e) => {
                e.stopPropagation(); // Stops the cards openProjectLink from firing
            });
        });

    } catch (err) {
        console.error(err);
        clearContentLoading(container);
        container.innerHTML = "<p>Error loading projects.</p>";
    }
});

// Open project link in new tab or show showToast if no link provided
function openProjectLink(card) {
    const link = card.dataset.link;

    // Validates link before opening
    if (link && /^https?:\/\//i.test(link.trim())) {
        window.open(link, "_blank");
    } else {
        showToast("This project has no link yet.");
    }
}

// Image modal functions
let modalImages = [];
let modalImageIndex = 0;

function openImageModal(slider, index) {
    const modal = document.getElementById('imageModal');
    if (modal && slider) {
        modalImages = Array.from(slider.querySelectorAll('.slider-track img')).map(image => ({
            src: image.src,
            alt: image.alt
        }));
        modalImageIndex = index;
        updateModalImage();
        modal.classList.add('active');
    }
}

function updateModalImage() {
    const modal = document.getElementById('imageModal');
    const modalContent = modal?.querySelector('.image-modal-content');
    const modalImg = document.getElementById('modalImage');
    const counter = modal?.querySelector('.modal-image-count');
    const previous = modal?.querySelector('.modal-prev');
    const next = modal?.querySelector('.modal-next');
    if (!modalImg || !modalImages.length) return;

    const image = modalImages[modalImageIndex];
    if (modalContent) modalContent.classList.add('img-loading');
    modalImg.classList.remove('img-loaded');

    const handleLoaded = () => {
        if (modalContent) modalContent.classList.remove('img-loading');
        modalImg.classList.add('img-loaded');
    };

    modalImg.onload = handleLoaded;
    modalImg.onerror = handleLoaded;

    modalImg.src = image.src;
    modalImg.alt = image.alt;

    if (modalImg.complete && modalImg.naturalWidth !== 0) {
        handleLoaded();
    }

    counter.textContent = `${modalImageIndex + 1} / ${modalImages.length}`;

    const hasMultipleImages = modalImages.length > 1;
    previous.hidden = !hasMultipleImages;
    next.hidden = !hasMultipleImages;
}

function changeModalImage(direction) {
    if (modalImages.length < 2) return;
    modalImageIndex = (modalImageIndex + direction + modalImages.length) % modalImages.length;
    updateModalImage();
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    const isModalOpen = document.getElementById('imageModal')?.classList.contains('active');
    if (!isModalOpen) return;

    if (e.key === 'Escape') {
        closeImageModal();
    } else if (e.key === 'ArrowLeft') {
        changeModalImage(-1);
    } else if (e.key === 'ArrowRight') {
        changeModalImage(1);
    }
});

// Auto Image Slider
function autoSlider(slider, direction) {
    const track = slider.querySelector(".slider-track");

    const images = JSON.parse(slider.dataset.images);
    let index = parseInt(slider.dataset.index);

    index = (index + direction + images.length) % images.length;
    slider.dataset.index = index;

    track.style.transform = `translateX(-${index * 100}%)`;
}

// Image slider Button Handler
function imageSlider(btn, direction) {
    const slider = btn.parentElement;
    autoSlider(slider, direction);
}

// Auto Slider Engine
function initSliders() {
    document.querySelectorAll(".project-slider").forEach(slider => {

        let autoSlide = setInterval(() => {
            autoSlider(slider, 1);
        }, 4000);

        slider.addEventListener("mouseenter", () => {   // Pause auto sliding on hover
            clearInterval(autoSlide);
        });

        slider.addEventListener("mouseleave", () => {   // Resume auto sliding when not hovering
            autoSlide = setInterval(() => {
                autoSlider(slider, 1);
            }, 4000);
        });

    });
}
