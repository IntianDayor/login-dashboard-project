const defaultDashboardContent = `
    <p>This project is my full-stack personal portfolio and custom Content Management System (CMS). It provides a central place to present my profile, resume, and projects while giving authorized users a secure dashboard for managing that content.</p>
    <p>The application uses session-based authentication, protected routes, and role-based access control to separate administrator and standard-user experiences. Administrative tools support profile, resume, project, and user-role management through API-driven requests and full CRUD workflows.</p>
    <p>Rich-text profile and project content is created with Quill.js and sanitized with DOMPurify before it is stored or displayed. Mutating requests use CSRF tokens, passwords are hashed with PHP's password hashing tools, and environment variables keep deployment credentials out of the codebase.</p>
    <p>Project images, profile images, and resumes are stored in Cloudflare R2 through its S3-compatible API. The MySQL database is hosted independently on Aiven with an encrypted SSL/TLS connection, allowing application containers to be rebuilt or migrated without losing content or uploaded files.</p>
    <p>The current release also improves the interface during asynchronous work: login, signup, uploads, saves, deletions, navigation, and content retrieval now show loading feedback, disable in-progress controls, and provide clearer failure states. This makes dashboard interactions more responsive and prevents duplicate submissions.</p>
    <p>The application is developed locally with Laragon and Docker, deployed as a Docker web service on Render, and backed up through GitHub Actions. A weekly workflow stores both dated MySQL snapshots and a latest backup in Cloudflare R2 to support reliable recovery across hosting platforms.</p>
    <h3>Technologies and Concepts Practiced</h3>
    <ul>
        <li>Session authentication, role-based access control, and CSRF protection</li>
        <li>Full CRUD content management with PHP APIs and MySQL</li>
        <li>Rich-text editing and XSS protection with Quill.js and DOMPurify</li>
        <li>Cloudflare R2 storage through the AWS SDK for PHP</li>
        <li>Encrypted Aiven MySQL connections and environment-based configuration</li>
        <li>Responsive, accessible loading states and asynchronous UI feedback</li>
        <li>Dockerized development and deployment on Render</li>
        <li>Automated GitHub Actions database backups to Cloudflare R2</li>
    </ul>
    <h3>What I Learned</h3>
    <p>Through this project, I have gained practical experience designing a production-style application across frontend, backend, cloud, security, and DevOps concerns. It continues to strengthen my understanding of secure content management, persistent cloud infrastructure, accessible user feedback, deployment workflows, and maintainable full-stack architecture.</p>`;

const dashboardContentTargets = document.querySelectorAll('[data-dashboard-about-content]');
const dashboardContentForm = document.getElementById('dashboard-content-form');
const editDashboardContentButton = document.getElementById('edit-dashboard-content');
const cancelDashboardContentButton = document.getElementById('cancel-dashboard-content');

function safeDashboardContent(content) {
    return DOMPurify.sanitize(content || defaultDashboardContent);
}

async function fetchDashboardContent() {
    const response = await fetch('/api/dashboard-content.php');
    if (!response.ok) throw new Error('Unable to load dashboard content.');
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Unable to load dashboard content.');
    return data.content || defaultDashboardContent;
}

function displayDashboardContent(content) {
    dashboardContentTargets.forEach(target => {
        target.innerHTML = safeDashboardContent(content);
    });
}

if (dashboardContentTargets.length) {
    fetchDashboardContent()
        .then(content => {
            displayDashboardContent(content);
        })
        .catch(error => console.error(error));
}

if (dashboardContentForm) {
    let savedContent = defaultDashboardContent;
    const quill = new Quill('#dashboard-content-editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
                ['clean']
            ]
        }
    });

    const showEditor = () => {
        quill.root.innerHTML = safeDashboardContent(savedContent);
        dashboardContentForm.hidden = false;
        editDashboardContentButton.hidden = true;
        quill.focus();
    };

    const hideEditor = () => {
        dashboardContentForm.hidden = true;
        editDashboardContentButton.hidden = false;
    };

    quill.root.innerHTML = '<p class="content-loading"><span class="content-spinner" aria-hidden="true"></span>Loading content...</p>';
    fetchDashboardContent()
        .then(content => {
            savedContent = safeDashboardContent(content);
            displayDashboardContent(savedContent);
        })
        .catch(error => {
            displayDashboardContent(savedContent);
            showToast('Unable to load saved content. Showing the default content instead.');
            console.error(error);
        });

    editDashboardContentButton?.addEventListener('click', showEditor);
    cancelDashboardContentButton?.addEventListener('click', hideEditor);

    dashboardContentForm.addEventListener('submit', async event => {
        event.preventDefault();
        const content = safeDashboardContent(quill.root.innerHTML);
        const plainText = quill.getText().trim();
        if (!plainText) {
            showToast('About content cannot be empty.');
            return;
        }

        const confirmed = await confirmAction('Save these changes to the dashboard About section?');
        if (!confirmed) return;

        const submitButton = dashboardContentForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true, 'Saving...');
        const formData = new FormData();
        formData.append('content', content);

        try {
            const response = await fetch('/api/dashboard-content.php', {
                method: 'POST',
                headers: { 'X-CSRF-Token': getCsrfToken() },
                body: formData
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Unable to save the About section.');
            savedContent = content;
            displayDashboardContent(savedContent);
            hideEditor();
            showToast(result.message, 'success');
        } catch (error) {
            showToast(error.message || 'Unable to save the About section.');
            console.error(error);
        } finally {
            setButtonLoading(submitButton, false);
        }
    });
}
