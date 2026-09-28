function initializePortfolioPdfDownload() {
    const downloadLink = document.querySelector('.portfolio-pdf-link');
    const status = document.getElementById('pdf-download-status');
    if (!downloadLink || !status) return;

    downloadLink.addEventListener('click', () => {
        status.hidden = false;
        status.classList.remove('is-error');
        status.textContent = 'Preparing your download...';
    });
}

document.addEventListener('DOMContentLoaded', initializePortfolioPdfDownload);
