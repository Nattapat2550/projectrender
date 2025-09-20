const API_BASE_URL = 'https://projectrender-k2t3.onrender.com/api';

let currentUser = null;
let currentTheme = 'light';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized');
    initializeApp();
});

function initializeApp() {
    checkAuthStatus();
    setupNavigation();
    setupEventListeners();
    initTheme();
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (token) {
        verifyToken(token).then(isValid => {
            if (isValid) {
                // User is authenticated
                if (currentPage === 'login.html' || currentPage === 'register.html' || currentPage === 'index.html') {
                    window.location.href = 'home.html';
                }
            } else {
                // Token is invalid
                localStorage.removeItem('token');
                if (currentPage !== 'login.html' && currentPage !== 'register.html' && currentPage !== 'index.html') {
                    window.location.href = 'login.html';
                }
            }
        });
    } else {
        // No token found
        if (currentPage !== 'login.html' && currentPage !== 'register.html' && currentPage !== 'index.html') {
            window.location.href = 'login.html';
        }
    }
}

async function verifyToken(token) {
    try {
        console.log('Verifying token...');
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUserUI();
            console.log('Token verified successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

function setupNavigation() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.style.color = 'var(--primary-color)';
            link.style.fontWeight = 'bold';
        }
    });
}

function setupEventListeners() {
    // Global click handler for dropdown
    document.addEventListener('click', handleGlobalClick);
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Profile dropdown
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer) {
        profileContainer.addEventListener('click', toggleDropdown);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Login form (if on login page)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form (if on register page)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Google login
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
    
    // Settings page specific listeners
    if (window.location.pathname.includes('settings.html')) {
        setupSettingsListeners();
    }
}

function handleGlobalClick(event) {
    // Close dropdown when clicking outside
    const dropdown = document.querySelector('.dropdown');
    const profileContainer = document.querySelector('.profile-container');
    
    if (dropdown && dropdown.classList.contains('show') && 
        !dropdown.contains(event.target) && 
        !profileContainer.contains(event.target)) {
        dropdown.classList.remove('show');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme toggle button if exists
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
    }
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    
    // Save theme preference to server if logged in
    if (currentUser) {
        saveThemePreference(newTheme);
    }
}

async function saveThemePreference(theme) {
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/user/theme`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ theme })
        });
    } catch (error) {
        console.error('Failed to save theme preference:', error);
    }
}

function updateUserUI() {
    if (!currentUser) return;
    
    // Update profile picture and name in navbar
    const profilePicElements = document.querySelectorAll('.profile-pic');
    const usernameElements = document.querySelectorAll('.username');
    const profilePicPreview = document.getElementById('profilePicPreview');
    
    profilePicElements.forEach(el => {
        el.src = currentUser.profile_pic || 'images/user.png';
        el.alt = currentUser.name;
    });
    
    usernameElements.forEach(el => {
        el.textContent = currentUser.name;
    });
    
    if (profilePicPreview) {
        profilePicPreview.src = currentUser.profile_pic || 'images/user.png';
    }
    
    // Update user name in settings form
    const userNameInput = document.getElementById('userName');
    if (userNameInput) {
        userNameInput.value = currentUser.name;
    }
    
    // Update email in settings
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = currentUser.email;
    }
}

function toggleDropdown(event) {
    event.stopPropagation();
    const dropdown = document.querySelector('.dropdown');
    dropdown.classList.toggle('show');
}

async function handleLogin(event) {
    event.preventDefault();
    console.log('Login attempt started');
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('Login successful');
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            window.location.href = 'home.html';
        } else {
            console.log('Login failed:', data.error);
            showAlert(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('An error occurred during login. Please try again.', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    console.log('Registration attempt started');
    
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validation
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('Registration successful');
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            window.location.href = 'home.html';
        } else {
            console.log('Registration failed:', data.error);
            showAlert(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('An error occurred during registration. Please try again.', 'error');
    }
}

function handleGoogleLogin() {
    console.log('Google login initiated');
    window.location.href = `${API_BASE_URL}/auth/google`;
}

function handleLogout() {
    console.log('Logging out...');
    localStorage.removeItem('token');
    currentUser = null;
    window.location.href = 'login.html';
}

function setupSettingsListeners() {
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
    
    // Load user data for settings page
    loadUserData();
}

async function loadUserData() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
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
        showAlert('Error loading user data', 'error');
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

function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Add to page
    const mainContent = document.querySelector('main') || document.body;
    mainContent.prepend(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}