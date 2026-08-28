// ====== SITE ANALYTICS (ADMIN) ====== //

function escAnalytics(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

let viewsChartInstance = null;
let uniqueChartInstance = null;

let currentFilter = {
    mode: 'days', // 'days', 'single', 'custom'
    days: 30,
    singleDate: '',
    startDate: '',
    endDate: ''
};

function getCommonChartOptions(timeUnit, metricLabel, color, border, text) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: function(context) {
                        return `${metricLabel}: ${context.parsed.y.toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: timeUnit === 'hour' ? 'Hour of Day (24h)' : 'Date',
                    color: text,
                    font: { size: 11, weight: 'bold' }
                },
                ticks: {
                    color: text,
                    maxRotation: 45,
                    autoSkip: true,
                    maxTicksLimit: 14
                },
                grid: { color: border }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: metricLabel,
                    color: text,
                    font: { size: 11, weight: 'bold' }
                },
                ticks: {
                    color: text,
                    precision: 0
                },
                grid: { color: border }
            }
        }
    };
}

function renderAnalyticsCharts(chartData, timeUnit = 'day') {
    const viewsCanvas = document.getElementById('analytics-views-chart');
    const uniqueCanvas = document.getElementById('analytics-unique-chart');
    if (!window.Chart) return;

    const styles = getComputedStyle(document.body);
    const primary = styles.getPropertyValue('--primary').trim() || '#2563eb';
    const accent = styles.getPropertyValue('--accent').trim() || '#8b5cf6';
    const text = styles.getPropertyValue('--text').trim() || '#0f172a';
    const border = styles.getPropertyValue('--border').trim() || '#e2e8f0';

    const labels = chartData.map(r => r.label || r.day);
    const viewsData = chartData.map(r => Number(r.views || 0));
    const uniqueData = chartData.map(r => Number(r.unique_visitors || 0));
    const pointRadius = labels.length > 31 ? 1 : 3.5;

    // --- Chart 1: Page Views ---
    if (viewsCanvas) {
        if (viewsChartInstance) {
            viewsChartInstance.destroy();
        }
        viewsChartInstance = new Chart(viewsCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Page Views',
                    data: viewsData,
                    borderColor: primary,
                    backgroundColor: primary + '26',
                    borderWidth: 2.5,
                    pointRadius: pointRadius,
                    pointHoverRadius: 6,
                    pointBackgroundColor: primary,
                    tension: 0.35,
                    fill: true
                }]
            },
            options: getCommonChartOptions(timeUnit, 'Page Views', primary, border, text)
        });
    }

    // --- Chart 2: Unique Visitors ---
    if (uniqueCanvas) {
        if (uniqueChartInstance) {
            uniqueChartInstance.destroy();
        }
        uniqueChartInstance = new Chart(uniqueCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Unique Visitors',
                    data: uniqueData,
                    borderColor: accent,
                    backgroundColor: accent + '26',
                    borderWidth: 2.5,
                    pointRadius: pointRadius,
                    pointHoverRadius: 6,
                    pointBackgroundColor: accent,
                    tension: 0.35,
                    fill: true
                }]
            },
            options: getCommonChartOptions(timeUnit, 'Unique Visitors', accent, border, text)
        });
    }
}

function updateChartTitles() {
    const viewsTitleEl = document.getElementById('analytics-views-chart-title');
    const uniqueTitleEl = document.getElementById('analytics-unique-chart-title');
    const viewsLabelEl = document.getElementById('analytics-views-label');
    const uniqueLabelEl = document.getElementById('analytics-unique-label');

    if (currentFilter.mode === 'days') {
        if (viewsTitleEl) viewsTitleEl.textContent = `Page Views (Last ${currentFilter.days} Days)`;
        if (uniqueTitleEl) uniqueTitleEl.textContent = `Unique Visitors (Last ${currentFilter.days} Days)`;
        if (viewsLabelEl) viewsLabelEl.textContent = `Views (${currentFilter.days} Days)`;
        if (uniqueLabelEl) uniqueLabelEl.textContent = `Unique (${currentFilter.days} Days)`;
    } else if (currentFilter.mode === 'single') {
        if (viewsTitleEl) viewsTitleEl.textContent = `Hourly Page Views (${currentFilter.singleDate})`;
        if (uniqueTitleEl) uniqueTitleEl.textContent = `Hourly Unique Visitors (${currentFilter.singleDate})`;
        if (viewsLabelEl) viewsLabelEl.textContent = `Views (${currentFilter.singleDate})`;
        if (uniqueLabelEl) uniqueLabelEl.textContent = `Unique (${currentFilter.singleDate})`;
    } else if (currentFilter.mode === 'custom') {
        if (viewsTitleEl) viewsTitleEl.textContent = `Page Views (${currentFilter.startDate} to ${currentFilter.endDate})`;
        if (uniqueTitleEl) uniqueTitleEl.textContent = `Unique Visitors (${currentFilter.startDate} to ${currentFilter.endDate})`;
        if (viewsLabelEl) viewsLabelEl.textContent = `Views (Range)`;
        if (uniqueLabelEl) uniqueLabelEl.textContent = `Unique (Range)`;
    }
}

async function loadAnalytics() {
    const periodViewsEl = document.getElementById('analytics-period-views');
    const periodUniqueEl = document.getElementById('analytics-period-unique');
    const todayViewsEl = document.getElementById('analytics-today');
    const todayUniqueEl = document.getElementById('analytics-today-unique');
    const topPages = document.getElementById('analytics-top-pages');
    if (!periodViewsEl) return;

    let query = '';
    if (currentFilter.mode === 'single' && currentFilter.singleDate) {
        query = `filter=single_date&date=${encodeURIComponent(currentFilter.singleDate)}`;
    } else if (currentFilter.mode === 'custom' && currentFilter.startDate && currentFilter.endDate) {
        query = `filter=custom&start_date=${encodeURIComponent(currentFilter.startDate)}&end_date=${encodeURIComponent(currentFilter.endDate)}`;
    } else {
        query = `filter=days&days=${currentFilter.days}`;
    }

    try {
        const response = await fetch(`../api/get-analytics.php?${query}`, {
            headers: { 'X-CSRF-Token': typeof getCsrfToken === 'function' ? getCsrfToken() : '' }
        });
        const data = await response.json();
        if (!data.success) throw new Error('Failed to load analytics');

        if (periodViewsEl) periodViewsEl.textContent = (data.periodViews ?? data.totalViews ?? 0).toLocaleString();
        if (periodUniqueEl) periodUniqueEl.textContent = (data.periodUnique ?? data.totalUnique ?? 0).toLocaleString();
        if (todayViewsEl) todayViewsEl.textContent = (data.todayViews ?? data.today ?? 0).toLocaleString();
        if (todayUniqueEl) todayUniqueEl.textContent = (data.todayUnique ?? 0).toLocaleString();

        if (topPages) {
            topPages.innerHTML = (data.byPage && data.byPage.length)
                ? data.byPage.map(r => `
                    <tr>
                        <td>${escAnalytics(r.page_path)}</td>
                        <td>${escAnalytics(r.views)}</td>
                        <td>${escAnalytics(r.unique_visitors ?? r.views)}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="3">No views recorded for this selection.</td></tr>';
        }

        updateChartTitles();
        renderAnalyticsCharts(data.chartData || data.viewsByDay || [], data.timeUnit || 'day');
    } catch (err) {
        console.error(err);
        if (topPages) topPages.innerHTML = '<tr><td colspan="3">Failed to load data.</td></tr>';
    }
}

function initAnalyticsFilterListeners() {
    const presetBtns = document.querySelectorAll('.analytics-preset-btn');
    const singlePicker = document.getElementById('analytics-single-picker');
    const customPicker = document.getElementById('analytics-custom-picker');
    const singleDateInput = document.getElementById('analytics-single-date');
    const startDateInput = document.getElementById('analytics-start-date');
    const endDateInput = document.getElementById('analytics-end-date');
    const customApplyBtn = document.getElementById('analytics-custom-apply');

    // Default dates
    const todayIso = new Date().toISOString().split('T')[0];
    if (singleDateInput && !singleDateInput.value) {
        singleDateInput.value = todayIso;
    }
    if (endDateInput && !endDateInput.value) {
        endDateInput.value = todayIso;
    }
    if (startDateInput && !startDateInput.value) {
        const past = new Date();
        past.setDate(past.getDate() - 14);
        startDateInput.value = past.toISOString().split('T')[0];
    }

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const days = btn.dataset.days;
            const mode = btn.dataset.mode;

            if (days) {
                currentFilter.mode = 'days';
                currentFilter.days = parseInt(days, 10);
                if (singlePicker) singlePicker.hidden = true;
                if (customPicker) customPicker.hidden = true;
                loadAnalytics();
            } else if (mode === 'single') {
                currentFilter.mode = 'single';
                currentFilter.singleDate = singleDateInput.value || todayIso;
                if (singlePicker) singlePicker.hidden = false;
                if (customPicker) customPicker.hidden = true;
                loadAnalytics();
            } else if (mode === 'custom') {
                currentFilter.mode = 'custom';
                currentFilter.startDate = startDateInput.value;
                currentFilter.endDate = endDateInput.value;
                if (singlePicker) singlePicker.hidden = true;
                if (customPicker) customPicker.hidden = false;
                loadAnalytics();
            }
        });
    });

    if (singleDateInput) {
        singleDateInput.addEventListener('change', () => {
            if (singleDateInput.value) {
                currentFilter.singleDate = singleDateInput.value;
                loadAnalytics();
            }
        });
    }

    if (customApplyBtn) {
        customApplyBtn.addEventListener('click', () => {
            if (startDateInput.value && endDateInput.value) {
                if (startDateInput.value > endDateInput.value) {
                    if (typeof showToast === 'function') {
                        showToast('Start date must be before end date.', 'error');
                    } else {
                        alert('Start date must be before end date.');
                    }
                    return;
                }
                currentFilter.startDate = startDateInput.value;
                currentFilter.endDate = endDateInput.value;
                loadAnalytics();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initAnalyticsFilterListeners();
    loadAnalytics();
});