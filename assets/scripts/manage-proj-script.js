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