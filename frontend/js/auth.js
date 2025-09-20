// Auth-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'login.html') {
        setupLoginPage();
    } else if (currentPage === 'register.html') {
        setupRegisterPage();
    }
});

function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
}

function setupRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
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
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            window.location.href = 'home.html';
        } else {
            showAlert(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('An error occurred during login', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
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
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            window.location.href = 'home.html';
        } else {
            showAlert(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('An error occurred during registration', 'error');
    }
}

function handleGoogleLogin() {
    window.location.href = `${API_BASE_URL}/auth/google`;
}

// Handle Google OAuth callback
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (token) {
        localStorage.setItem('token', token);
        window.location.href = 'home.html';
    } else if (error) {
        showAlert('Google login failed: ' + error, 'error');
    }
}

// Check if this is an OAuth callback page
if (window.location.search.includes('token') || window.location.search.includes('error')) {
    handleOAuthCallback();
}