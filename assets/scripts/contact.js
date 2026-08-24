document.addEventListener('DOMContentLoaded', () => {
    const loadedAtField = document.getElementById('loaded-at');
    if (loadedAtField) loadedAtField.value = Date.now();

    const socialContainer = document.getElementById('contact-socials');
    if (socialContainer) {
        fetch('/api/get-profile.php')
            .then(response => response.json())
            .then(profile => {
                const urls = profile?.social_urls?.length
                    ? profile.social_urls
                    : ['github_url', 'linkedin_url', 'instagram_url', 'facebook_url']
                        .map(field => profile?.[field]).filter(Boolean);
                const socials = urls.map(url => {
                    let host = '';
                    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return [url, 'Social link']; }
                    const name = host.split('.')[0] || 'Social link';
                    return [url, name.charAt(0).toUpperCase() + name.slice(1)];
                });

                if (!socials.length) return;
                socials.forEach(([url, label]) => {
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.textContent = label;
                    const arrow = document.createElement('span');
                    arrow.setAttribute('aria-hidden', 'true');
                    arrow.textContent = '↗';
                    link.append(arrow);
                    socialContainer.append(link);
                });
                socialContainer.hidden = false;
            })
            .catch(() => {
                socialContainer.hidden = true;
            });
    }
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
