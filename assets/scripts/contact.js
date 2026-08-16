document.addEventListener('DOMContentLoaded', () => {
    const loadedAtField = document.getElementById('loaded-at');
    if (loadedAtField) loadedAtField.value = Date.now();
});

document.getElementById('contact-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const status = document.getElementById('contact-status');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    status.textContent = '';
    setButtonLoading(submitButton, true, 'Sending...');

    const payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim(),
        website: form.website.value,
        loaded_at: form.loaded_at.value
    };

    try {
        const response = await fetch('/api/contact.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        const message = result.message || 'Something went wrong. Please try again.';

        if (response.ok && result.success) {
            const confirmation = 'Message sent — thanks for reaching out!';
            showToast(confirmation, 'success');
            status.textContent = confirmation;
            form.reset();
        } else {
            showToast(message);
            status.textContent = message;
        }
    } catch (error) {
        const message = 'Network error. Please try again.';
        showToast(message);
        status.textContent = message;
        console.error(error);
    } finally {
        setButtonLoading(submitButton, false);
    }
});
