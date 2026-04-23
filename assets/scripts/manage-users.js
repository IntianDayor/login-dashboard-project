const userTableBody = document.getElementById('users-table-body');

async function fetchUsers() {
    const response = await fetch("../api/users-table.php");
    const result = await response.json();
    displayUsers(result);
}

function displayUsers(users) {
    userTableBody.innerHTML = ''; // Clear existing rows
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.created_at}</td>
        `;
        userTableBody.appendChild(row);
    });
}

// Call fetchUsers when the page loads
document.addEventListener('DOMContentLoaded', fetchUsers);