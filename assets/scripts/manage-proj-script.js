// ====== MANAGE PROJECT SCRIPTS ====== //

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

                    <button class="slide-btn left" onclick="event.stopPropagation(); prevImage(this)">&#10094;</button>

                    <img class="slider-image" 
                    src="../${project.images[0]}" 
                    onclick="event.stopPropagation(); openImageModal(this.src)">

                    <button class="slide-btn right" onclick="event.stopPropagation(); nextImage(this)">&#10095;</button>

                </div>
            `;

            return `
                <div class="project-card"
                data-link="${project.project_link ?? ""}"
                onclick="openProjectLink(this)">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>

                    <div class="project-images">
                        ${imagesHTML}
                    </div>
                </div>
            `;
        }).join("");

        // Add modal HTML to container
        container.innerHTML += `
            <div class="image-modal" id="imageModal" onclick="closeImageModal()">
                <span class="close-modal">&times;</span>
                <img id="modalImage" src="" alt="Zoomed image">
            </div>
        `;

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

// Image slider functions

function nextImage(btn) {
    const slider = btn.parentElement;
    const img = slider.querySelector(".slider-image");

    const images = JSON.parse(slider.dataset.images);
    let index = parseInt(slider.dataset.index);

    index = (index + 1) % images.length;

    slider.dataset.index = index;
    img.src = "../" + images[index];
}

function prevImage(btn) {
    const slider = btn.parentElement;
    const img = slider.querySelector(".slider-image");

    const images = JSON.parse(slider.dataset.images);
    let index = parseInt(slider.dataset.index);

    index = (index - 1 + images.length) % images.length;

    slider.dataset.index = index;
    img.src = "../" + images[index];
}