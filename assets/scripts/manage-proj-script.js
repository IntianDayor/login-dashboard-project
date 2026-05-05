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

// Upload Projects Script //

const addProjectbtn = document.getElementById('add-project');
addProjectbtn?.addEventListener('click', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('project-title').value);
    formData.append('description', document.getElementById('project-description').value);
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
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            alert('Project uploaded successfully!');
        } else {
            alert('Failed to upload project: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while uploading the project.');
    }
});

// View Projects Script //

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(".project-cards");

    try {
        const res = await fetch("../api/get-projects.php");
        const data = await res.json();

        if (!data.length) {
            container.innerHTML = "<p>No projects found.</p>";
            return;
        }

        container.innerHTML = data.map(project => {

            const imagesHTML = `
                <div class="project-slider" 
                    data-images='${JSON.stringify(project.images)}'
                    data-index="0">

                    <button class="slide-btn left" onclick="event.stopPropagation(); imageSlider(this, -1)">&#10094;</button>

                    <div class="slider-viewport">
                        <div class="slider-track">
                            ${project.images.map(img => 
                                `<img src="../${img}" onclick="event.stopPropagation(); openImageModal(this.src)">`
                            ).join("")}
                        </div>
                    </div>

                    <button class="slide-btn right" onclick="event.stopPropagation(); imageSlider(this, 1)">&#10095;</button>

                </div>
            `;

            return `
                <div class="project-card"
                data-link="${esc(project.project_link)}"
                onclick="openProjectLink(this)">
                    <h3>${esc(project.title)}</h3>
                    <p>${esc(project.description)}</p>

                    <div class="project-images">
                        ${imagesHTML}
                    </div>
                </div>
            `;
        }).join("");

        // Build and append image modal to the DOM (only once)
        const modal = document.createElement("div");
        modal.className = "image-modal";
        modal.id = "imageModal";
        modal.onclick = closeImageModal;
        modal.innerHTML = `<span class="close-modal">&times;</span><img id="modalImage" src="" alt="Zoomed image">`;
        container.appendChild(modal);

        // Init sliders AFTER modal is in the DOM
        initSliders();

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error loading projects.</p>";
    }
});

// Open project link in new tab or show alert if no link provided
function openProjectLink(card) {
    const link = card.dataset.link;

    if (link && link.trim() !== "") {
        window.open(link, "_blank");
    } else {
        alert("This project has no link yet.");
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