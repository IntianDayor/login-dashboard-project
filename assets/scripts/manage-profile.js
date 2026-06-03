// ====== MANAGE PROFILE SCRIPT ====== //

// EDIT PROFILE PAGE (admin) //
const editForm = document.querySelector(".edit-profile-form");

if (editForm) {

    // Edit Description
    fetch("../api/get-profile.php")
        .then(res => res.json())
        .then(data => {
            if (data && data.description && window.profileQuill) {
                window.profileQuill.root.innerHTML = data.description;
            }
        })
        .catch(err => console.error("Failed to load profile:", err));

    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const confirmed = await confirmAction('Are you sure you want to save these changes?');
        if (!confirmed) return;

        const formData = new FormData(editForm);

        // Get Quill content, sanitize it with DOMPurify, append to formData
        if (window.profileQuill) {
            const cleanHTML = DOMPurify.sanitize(window.profileQuill.root.innerHTML);
            formData.append('description', cleanHTML);
        }

        try {
            const response = await fetch("../api/upload-profile.php", {
                method: "POST",
                headers: { "X-CSRF-Token": getCsrfToken() },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showToast(result.message);
            } else {
                showToast("Error: " + result.message);
            }
        } catch (error) {
            showToast("Something went wrong: " + error.message);
        }
    });
}

// VIEW PROFILE PAGE (user) //
const profilePictureDiv = document.getElementById("profile-picture");
const profileDescription = document.getElementById("profile-description");

if (profilePictureDiv || profileDescription) {
    fetch("../api/get-profile.php")
        .then(res => res.json())
        .then(data => {
            if (!data) return;
            if (profilePictureDiv && data.profile_picture) {
                profilePictureDiv.innerHTML = `<img src="${data.profile_picture.startsWith('http') ? data.profile_picture : '../' + data.profile_picture}" alt="Profile Picture">`;
            }
            if (profileDescription && data.description) {
                profileDescription.innerHTML = DOMPurify.sanitize(data.description);
            }
        })
        .catch(err => console.error("Failed to load profile:", err));
}