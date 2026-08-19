// ====== SITE ANALYTICS (ADMIN) ====== //

function escAnalytics(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

let analyticsChart = null;

function renderAnalyticsChart(viewsByDay) {
    const canvas = document.getElementById('analytics-chart');
    if (!canvas || !window.Chart) return;

    const styles = getComputedStyle(document.body);
    const primary = styles.getPropertyValue('--primary').trim() || '#2563eb';
    const accent = styles.getPropertyValue('--accent').trim() || '#8b5cf6';
    const text = styles.getPropertyValue('--text').trim() || '#0f172a';
    const border = styles.getPropertyValue('--border').trim() || '#e2e8f0';

    const labels = viewsByDay.map(r => r.day);
    const data = viewsByDay.map(r => r.views);

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    analyticsChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Views',
                data,
                borderColor: primary,
                backgroundColor: accent + '33',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: primary,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: text }, grid: { color: border } },
                y: {
                    beginAtZero: true,
                    ticks: { color: text, precision: 0 },
                    grid: { color: border }
                }
            }
        }
    });
}

async function loadAnalytics() {
    const total = document.getElementById('analytics-total');
    const today = document.getElementById('analytics-today');
    const topPages = document.getElementById('analytics-top-pages');
    if (!total) return;

    try {
        const response = await fetch('../api/get-analytics.php?days=30', {
            headers: { 'X-CSRF-Token': getCsrfToken() }
        });
        const data = await response.json();
        if (!data.success) throw new Error('Failed to load analytics');

        total.textContent = data.total.toLocaleString();
        today.textContent = data.today.toLocaleString();

        topPages.innerHTML = data.byPage.length
            ? data.byPage.map(r => `<tr><td>${escAnalytics(r.page_path)}</td><td>${escAnalytics(r.views)}</td></tr>`).join('')
            : '<tr><td colspan="2">No views recorded yet.</td></tr>';

        renderAnalyticsChart(data.viewsByDay);
    } catch (err) {
        console.error(err);
        topPages.innerHTML = '<tr><td colspan="2">Failed to load.</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', loadAnalytics);