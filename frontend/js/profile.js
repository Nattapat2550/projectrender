// js/profile.js

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('settings.html')) {
    setupSettingsPage();
  }
});

function setupSettingsPage() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  loadUserData();

  const updateNameForm = document.getElementById('updateNameForm');
  const profilePicInput = document.getElementById('profilePicInput');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');

  if (updateNameForm) updateNameForm.addEventListener('submit', handleNameUpdate);
  if (profilePicInput) profilePicInput.addEventListener('change', handleProfilePicUpload);
  if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', handleDeleteAccount);
}

async function loadUserData() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('https://projectrender-k2t3.onrender.com/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      currentUser  = data.user;
      updateUserUI();
    } else {
      showAlert('Failed to load user data', 'error');
    }
  } catch (err) {
    showAlert('Error loading user data', 'error');
  }
}

async function handleNameUpdate(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const name = formData.get('name');
  const token = localStorage.getItem('token');

  try {
    const res = await fetch('https://projectrender-k2t3.onrender.com/api/user/name', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      currentUser .name = name;
      updateUserUI();
      showAlert('Name updated', 'success');
    } else {
      const data = await res.json();
      showAlert(data.error || 'Failed to update name', 'error');
    }
  } catch (err) {
    showAlert('Error updating name', 'error');
  }
}

async function handleProfilePicUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('profilePic', file);

  try {
    const res = await fetch('https://projectrender-k2t3.onrender.com/api/user/profile-picture', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (res.ok) {
      currentUser .profile_pic = data.profile_pic;
      updateUserUI();
      showAlert('Profile picture updated', 'success');
    } else {
      showAlert(data.error || 'Failed to upload picture', 'error');
    }
  } catch (err) {
    showAlert('Error uploading picture', 'error');
  }
}

async function handleDeleteAccount() {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch('https://projectrender-k2t3.onrender.com/api/user/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      localStorage.removeItem('token');
      showAlert('Account deleted', 'success');
      setTimeout(() => window.location.href = 'login.html', 2000);
    } else {
      const data = await res.json();
      showAlert(data.error || 'Failed to delete account', 'error');
    }
  } catch (err) {
    showAlert('Error deleting account', 'error');
  }
}