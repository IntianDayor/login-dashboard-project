// ====== MANAGE PROFILE SCRIPT ====== //

// EDIT PROFILE PAGE (admin) //
const editForm = document.querySelector(".edit-profile-form");

if (editForm) {
    if (window.profileQuill) {
        window.profileQuill.root.innerHTML = '<p class="content-loading"><span class="content-spinner" aria-hidden="true"></span>Loading profile...</p>';
    }

    // Edit Description
    fetch("/api/get-profile.php")
        .then(res => res.json())
        .then(data => {
            if (window.profileQuill) {
                window.profileQuill.root.innerHTML = DOMPurify.sanitize(data?.description || '');
            }
        })
        .catch(err => {
            if (window.profileQuill) window.profileQuill.root.textContent = 'Failed to load profile.';
            console.error("Failed to load profile:", err);
        });

    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const confirmed = await confirmAction('Are you sure you want to save these changes?');
        if (!confirmed) return;

        const submitButton = editForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true, 'Saving...');

        const formData = new FormData(editForm);

        // Get Quill content, sanitize it with DOMPurify, append to formData
        if (window.profileQuill) {
            const cleanHTML = DOMPurify.sanitize(window.profileQuill.root.innerHTML);
            formData.append('description', cleanHTML);
        }

        try {
            const response = await fetch("/api/upload-profile.php", {
                method: "POST",
                headers: { "X-CSRF-Token": getCsrfToken() },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showToast(result.message, 'success');
            } else {
                showToast("Error: " + result.message);
            }
        } catch (error) {
            showToast("Something went wrong: " + error.message);
        } finally {
            setButtonLoading(submitButton, false);
        }
    });
}

// VIEW PROFILE PAGE (user) //
const profilePictureDiv = document.getElementById("profile-picture");
const profileDescription = document.getElementById("profile-description");

if (profilePictureDiv || profileDescription) {
    if (profilePictureDiv) showContentLoading(profilePictureDiv, 'Loading profile...');
    if (profileDescription) showContentLoading(profileDescription, 'Loading profile...');
    fetch("/api/get-profile.php")
        .then(res => res.json())
        .then(data => {
            if (profilePictureDiv && data.profile_picture) {
                profilePictureDiv.innerHTML = `<img src="${toImageSrc(data.profile_picture)}" alt="Profile Picture" loading="lazy" decoding="async">`;
            } else if (profilePictureDiv) {
                profilePictureDiv.innerHTML = '';
            }
            if (profileDescription && data?.description) {
                profileDescription.innerHTML = DOMPurify.sanitize(data.description);
            } else if (profileDescription) {
                profileDescription.innerHTML = '';
            }
            clearContentLoading(profilePictureDiv);
            clearContentLoading(profileDescription);
        })
        .catch(err => {
            clearContentLoading(profilePictureDiv);
            clearContentLoading(profileDescription);
            if (profilePictureDiv) profilePictureDiv.innerHTML = '<p>Failed to load profile.</p>';
            if (profileDescription) profileDescription.innerHTML = '<p>Failed to load profile.</p>';
            console.error("Failed to load profile:", err);
        });
}
