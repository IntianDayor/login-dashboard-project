// Display User Data in Manage Users Page //

const userTableBody = document.getElementById('users-table-body');

async function fetchUsers() {
    try {
        const response = await fetch("../api/users-table.php");
        const result = await response.json();
        displayUsers(result);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        userTableBody.innerHTML = '<tr><td colspan="4">Failed to load users.</td></tr>';
    }
}

function displayUsers(users) {
    userTableBody.innerHTML = '';
    users.forEach(user => {
        const row = document.createElement('tr');

        [user.id, user.name, user.email, user.created_at].forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            row.appendChild(td);
        });

        userTableBody.appendChild(row);
    });
}

// Call fetchUsers when the page loads
document.addEventListener('DOMContentLoaded', fetchUsers);