// ====== MANAGE PROJECT SCRIPTS ====== //

function esc(str) {
    const d = document.createElement("div");
    d.textContent = str ?? "";
    return d.innerHTML;
}

// Script for managing project view and user preview navigation //

const showUserViewButton = document.getElementById('user-view');
const backToManageProjectsButton = document.getElementById('back-to-manage-projects');

if (showUserViewButton) {
    showUserViewButton.addEventListener('click', () => {
        window.location.href = 'proj-user-preview.html';
    });
}

if (backToManageProjectsButton) {
    backToManageProjectsButton.addEventListener('click', () => {
        window.location.href = 'projects.html';
    });
}

// Upload/Delete Projects Script //

const addProjectbtn = document.getElementById('add-project');
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
        const response = await fetch('../api/upload-projects.php', {
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
        const response = await fetch('../api/delete-project.php', {
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

// View Projects Script //

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(".project-cards");
    if (!container) return;
    showContentLoading(container, 'Loading projects...');
    try {
        const res = await fetch("../api/get-projects.php");
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
                           ${project.images.map(img =>
                `<img src="${img.startsWith('http') ? img : '../' + img}" onclick="event.stopPropagation(); openImageModal(this.src)">`
            ).join("")}
                        </div>
                    </div>

                    <button class="slide-btn right" onclick="event.stopPropagation(); imageSlider(this, 1)">&#10095;</button>

                </div>
            `;

            return `
                <div class="project-card"
                data-link="${esc(project.project_link)}">
                    <h3>${esc(project.title)}</h3>
                    ${isAdmin ? `
                    <button class="delete-project-btn"
                        onclick="event.stopPropagation(); deleteProject(${project.id}, this.closest('.project-card'))">
                        🗑 Delete
                    </button>` : ''}
                    <div class="project-description">
                    ${DOMPurify.sanitize(project.description, 
                        { ALLOWED_TAGS: 
                            ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a'],
                         ADD_ATTR: ['href', 'target', 'rel'] })}
                    </div>

                    <div class="project-images">
                        ${imagesHTML}
                    </div>
                </div>
            `;
        }).join("");

        // Build and append image modal to the DOM
        const modal = document.createElement("div");
        modal.className = "image-modal";
        modal.id = "imageModal";
        modal.onclick = closeImageModal;
        modal.innerHTML = `<span class="close-modal">&times;</span><img id="modalImage" src="" alt="Zoomed image">`;
        container.appendChild(modal);

        // Initialize sliders AFTER modal is in the DOM
        initSliders();

        // Add click handler to each card
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // If click came from a link inside description, let it open naturally
                if (e.target.closest('a')) return;
                // Otherwise open the project link
                openProjectLink(card);
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
function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    if (modal && modalImg) {
        modalImg.src = src;
        modal.classList.add('active');
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImageModal();
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
