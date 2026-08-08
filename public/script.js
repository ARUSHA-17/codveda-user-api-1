// API Base URL
const API_URL = 'https://your-app.up.railway.app/api/users';

// DOM Elements
const userForm = document.getElementById('userForm');
const usersList = document.getElementById('usersList');
const loading = document.getElementById('loading');

// ============================================
// FETCH ALL USERS (GET)
// ============================================
async function fetchUsers() {
    try {
        loading.style.display = 'block';
        usersList.innerHTML = '';

        const response = await fetch(API_URL);
        const result = await response.json();

        loading.style.display = 'none';

        if (result.success && result.data.length > 0) {
            result.data.forEach(user => {
                displayUser(user);
            });
        } else {
            usersList.innerHTML = '<p class="empty-message">No users found. Add one above!</p>';
        }

    } catch (error) {
        loading.style.display = 'none';
        usersList.innerHTML = `<p class="empty-message" style="color: red;">Error: ${error.message}</p>`;
        console.error('Error fetching users:', error);
    }
}

// ============================================
// DISPLAY A SINGLE USER CARD
// ============================================
function displayUser(user) {
    const userCard = document.createElement('div');
    userCard.className = 'user-card';
    userCard.id = `user-${user.id}`;
    userCard.innerHTML = `
        <h3>${user.name}</h3>
        <p>📧 ${user.email}</p>
        <p>🎂 Age: ${user.age}</p>
        <div class="user-actions">
            <button class="btn-edit" onclick="enableEdit(${user.id}, '${user.name}', '${user.email}', ${user.age})">✏️ Edit</button>
            <button class="btn-delete" onclick="deleteUser(${user.id})">🗑️ Delete</button>
        </div>
    `;
    usersList.appendChild(userCard);
}

// ============================================
// CREATE USER (POST)
// ============================================
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const age = parseInt(document.getElementById('age').value);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, age })
        });

        const result = await response.json();

        if (result.success) {
            // Clear form
            userForm.reset();
            // Refresh users list
            fetchUsers();
            alert('✅ User added successfully!');
        } else {
            alert('❌ Error: ' + result.message);
        }

    } catch (error) {
        console.error('Error creating user:', error);
        alert('❌ Failed to add user');
    }
});

// ============================================
// DELETE USER (DELETE)
// ============================================
async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            fetchUsers();
            alert('✅ User deleted successfully!');
        } else {
            alert('❌ Error: ' + result.message);
        }

    } catch (error) {
        console.error('Error deleting user:', error);
        alert('❌ Failed to delete user');
    }
}

// ============================================
// ENABLE EDIT MODE
// ============================================
function enableEdit(id, name, email, age) {
    const userCard = document.getElementById(`user-${id}`);
    userCard.innerHTML = `
        <div class="edit-form">
            <input type="text" id="edit-name-${id}" value="${name}" placeholder="Name">
            <input type="email" id="edit-email-${id}" value="${email}" placeholder="Email">
            <input type="number" id="edit-age-${id}" value="${age}" placeholder="Age">
            <div class="user-actions">
                <button class="btn-save" onclick="updateUser(${id})">💾 Save</button>
                <button class="btn-cancel" onclick="fetchUsers()">❌ Cancel</button>
            </div>
        </div>
    `;
}

// ============================================
// UPDATE USER (PUT)
// ============================================
async function updateUser(id) {
    const name = document.getElementById(`edit-name-${id}`).value;
    const email = document.getElementById(`edit-email-${id}`).value;
    const age = parseInt(document.getElementById(`edit-age-${id}`).value);

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, age })
        });

        const result = await response.json();

        if (result.success) {
            fetchUsers();
            alert('✅ User updated successfully!');
        } else {
            alert('❌ Error: ' + result.message);
        }

    } catch (error) {
        console.error('Error updating user:', error);
        alert('❌ Failed to update user');
    }
}

// ============================================
// LOAD USERS WHEN PAGE LOADS
// ============================================
document.addEventListener('DOMContentLoaded', fetchUsers);
