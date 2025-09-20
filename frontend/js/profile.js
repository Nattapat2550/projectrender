// Profile and settings functionality
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'settings.html') {
        setupSettingsPage();
    }
});

function setupSettingsPage() {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load user data
    loadUserData();
    
    // Set up event listeners
    const updateNameForm = document.getElementById('updateNameForm');
    const profilePicInput = document.getElementById('profilePicInput');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    if (updateNameForm) {
        updateNameForm.addEventListener('submit', handleNameUpdate);
    }
    
    if (profilePicInput) {
        profilePicInput.addEventListener('change', handleProfilePicUpload);
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }
}

async function loadUserData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUserUI();
        } else {
            showAlert('Failed to load user data', 'error');
        }
    } catch (error) {
        console.error('Load user data error:', error);
        showAlert('An error occurred while loading user data', 'error');
    }
}

async function handleNameUpdate(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/name`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name })
        });
        
        if (response.ok) {
            currentUser.name = name;
            updateUserUI();
            showAlert('Name updated successfully', 'success');
        } else {
            const data = await response.json();
            showAlert(data.error || 'Failed to update name', 'error');
        }
    } catch (error) {
        console.error('Update name error:', error);
        showAlert('An error occurred while updating your name', 'error');
    }
}

async function handleProfilePicUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profilePic', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser.profile_pic = data.profile_pic;
            updateUserUI();
            showAlert('Profile picture updated successfully', 'success');
        } else {
            showAlert(data.error || 'Failed to upload profile picture', 'error');
        }
    } catch (error) {
        console.error('Profile picture upload error:', error);
        showAlert('An error occurred while uploading your profile picture', 'error');
    }
}

async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            localStorage.removeItem('token');
            currentUser = null;
            showAlert('Account deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            const data = await response.json();
            showAlert(data.error || 'Failed to delete account', 'error');
        }
    } catch (error) {
        console.error('Delete account error:', error);
        showAlert('An error occurred while deleting your account', 'error');
    }
}