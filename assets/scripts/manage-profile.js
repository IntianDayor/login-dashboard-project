// ====== MANAGE PROFILE SCRIPT ====== //

// EDIT PROFILE PAGE (admin) //
const editForm = document.querySelector(".edit-profile-form");

if (editForm) {
    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(editForm);

        // Get Quill content, sanitize it with DOMPurify, append to formData
        if (window.profileQuill) {
            const cleanHTML = DOMPurify.sanitize(window.profileQuill.root.innerHTML);
            formData.append('description', cleanHTML);
        }

        try {
            const response = await fetch("../api/upload-profile.php", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            alert("Something went wrong: " + error.message);
        }
    });
}

// VIEW PROFILE PAGE (user) //
const profilePictureDiv  = document.getElementById("profile-picture");
const profileDescription = document.getElementById("profile-description");

if (profilePictureDiv || profileDescription) {
    fetch("../api/get-profile.php")
        .then(res => res.json())
        .then(data => {
            if (!data.length) return;

            const profile = data[0];

            if (profilePictureDiv && profile.profile_picture) {
                profilePictureDiv.innerHTML = `<img src="../${profile.profile_picture}" alt="Profile Picture">`;
            }

            if (profileDescription && profile.description) {
                profileDescription.innerHTML = DOMPurify.sanitize(profile.description);
            }
        })
        .catch(err => console.error("Failed to load profile:", err));
}