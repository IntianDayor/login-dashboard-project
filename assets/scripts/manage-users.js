// Display User Data in Manage Users Page //

const userTableBody = document.getElementById('users-table-body');

async function fetchUsers() {
    userTableBody.innerHTML = '<tr><td colspan="6"><div class="content-loading"><span class="content-spinner" aria-hidden="true"></span>Loading users...</div></td></tr>';
    try {
        const response = await fetch("/api/users-table.php", {
            headers: { "X-CSRF-Token": getCsrfToken() }
        });
        const result = await response.json();
        displayUsers(result);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        userTableBody.innerHTML = '<tr><td colspan="6">Failed to load users.</td></tr>';
    }
}

function displayUsers(users) {
    userTableBody.innerHTML = '';
    users.forEach(user => {
        const row = document.createElement('tr');

        [user.id, user.username, user.name, user.email, user.created_at].forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            row.appendChild(td);
        });

        // Role dropdown instead of plain text
        const roleTd = document.createElement('td');
        const select = document.createElement('select');

        ['user', 'admin'].forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            if (option === user.role) opt.selected = true;
            select.appendChild(opt);
        });

        select.dataset.prev = user.role;
        select.addEventListener('change', () => {
            const prev = select.dataset.prev;
            setRole(user.id, select.value, select, prev);
        });
        
        roleTd.appendChild(select);
        row.appendChild(roleTd);
        userTableBody.appendChild(row);

    });
}

async function setRole(userId, newRole, selectEl, prevRole) {
    const confirmed = await confirmAction(`Change this user's role to "${newRole}"?`);
    if (!confirmed) {
        selectEl.value = prevRole;
        return;
    }

    try {
        selectEl.disabled = true;
        const response = await fetch('/api/set-role.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCsrfToken()
            },
            body: JSON.stringify({ id: userId, role: newRole })
        });

        const result = await response.json();
        if (!result.success) {
            showToast('Failed to update role: ' + (result.error || 'Unknown error'));
            selectEl.value = prevRole;
        } else {
            selectEl.dataset.prev = newRole;
        }
    } catch (err) {
        console.error('Set role error:', err);
        selectEl.value = prevRole;
    } finally {
        selectEl.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', fetchUsers);
