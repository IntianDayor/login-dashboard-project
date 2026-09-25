function initializePortfolioPdfDownload() {
    const downloadLink = document.querySelector('.portfolio-pdf-link');
    const status = document.getElementById('pdf-download-status');
    if (!downloadLink || !status) return;

    const showStatus = (message, isLoading = true, isError = false) => {
        status.hidden = false;
        status.classList.toggle('is-error', isError);
        status.replaceChildren();
        if (isLoading) {
            const spinner = document.createElement('span');
            spinner.className = 'pdf-download-spinner';
            spinner.setAttribute('aria-hidden', 'true');
            status.appendChild(spinner);
        }
        status.append(message);
    };

    downloadLink.addEventListener('click', async (event) => {
        event.preventDefault();
        if (downloadLink.getAttribute('aria-busy') === 'true') return;

        const stages = [
            'Getting the latest portfolio data...',
            'Generating your PDF...',
            'Preparing your download...'
        ];
        let stageIndex = 0;
        downloadLink.setAttribute('aria-busy', 'true');
        showStatus(stages[stageIndex]);
        const stageTimer = window.setInterval(() => {
            stageIndex = Math.min(stageIndex + 1, stages.length - 1);
            showStatus(stages[stageIndex]);
        }, 1400);

        try {
            const response = await fetch(downloadLink.href);
            const file = await response.blob();
            if (!response.ok || !file.type.includes('pdf')) {
                let message = 'Unable to generate the PDF. Please try again.';
                try {
                    const result = JSON.parse(await file.text());
                    if (result.message) message = result.message;
                } catch (_) {}
                throw new Error(message);
            }

            const downloadUrl = URL.createObjectURL(file);
            const download = document.createElement('a');
            download.href = downloadUrl;
            download.download = 'christian-dior-feraer-portfolio.pdf';
            document.body.appendChild(download);
            download.click();
            download.remove();
            window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
            showStatus('Download complete.', false);
        } catch (error) {
            showStatus(error.message || 'Download failed. Please try again.', false, true);
        } finally {
            window.clearInterval(stageTimer);
            downloadLink.removeAttribute('aria-busy');
        }
    });
}

document.addEventListener('DOMContentLoaded', initializePortfolioPdfDownload);
