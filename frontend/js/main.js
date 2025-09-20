const API_BASE_URL = 'https://projectrender-k2t3.onrender.com/api';
const BACKEND_URL = 'https://projectrender-k2t3.onrender.com'; // Update this for production

let currentUser = null;
let currentTheme = 'light';

// Google Sign-In initialization
function initGoogleSignIn() {
  // Load Google Sign-In API
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = initializeGoogleSignIn;
  document.head.appendChild(script);
}

function initializeGoogleSignIn() {
  window.google.accounts.id.initialize({
    client_id: '570656256454-ijfo0bi4lo643vmnqf311n8mig267edr.apps.googleusercontent.com', // Replace with your Google Client ID
    callback: handleGoogleSignIn
  });
  
  // Render Google Sign-In button
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  if (googleSignInBtn) {
    window.google.accounts.id.renderButton(
      googleSignInBtn,
      { theme: 'outline', size: 'large', width: googleSignInBtn.offsetWidth }
    );
  }
}

async function handleGoogleSignIn(response) {
  try {
    // Decode the Google credential
    const responsePayload = parseJwt(response.credential);
    
    const googleUser = {
      googleId: responsePayload.sub,
      email: responsePayload.email,
      name: responsePayload.name,
      photo: responsePayload.picture
    };

    // Send to backend for unified login
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        googleToken: response.credential,
        googleUser: googleUser
      })
    });

    const data = await loginResponse.json();
    
    if (loginResponse.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = 'home.html';
    } else {
      showAlert(data.error || 'Google login failed', 'error');
    }
  } catch (error) {
    console.error('Google login error:', error);
    showAlert('Google login failed', 'error');
  }
}

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

// Rest of your existing main.js code remains the same...
// (initializeApp, checkAuthStatus, setupNavigation, etc.)

// Update the updateUserUI function to handle Google profile pictures
function updateUserUI() {
  if (!currentUser) return;
  
  const profilePicElements = document.querySelectorAll('.profile-pic');
  const usernameElements = document.querySelectorAll('.username');
  const profilePicPreview = document.getElementById('profilePicPreview');

  // Determine full URL for profile picture
  let profilePicUrl = currentUser.profile_pic || 'images/user.png';
  
  // Check if it's a Google profile picture (starts with http)
  if (profilePicUrl.startsWith('http')) {
    // It's a Google URL, use as-is
  } else if (profilePicUrl.startsWith('/uploads/')) {
    // It's an uploaded file, prepend backend URL
    profilePicUrl = BACKEND_URL + profilePicUrl;
  }

  profilePicElements.forEach(el => {
    el.src = profilePicUrl;
    el.alt = currentUser.name;
  });

  usernameElements.forEach(el => {
    el.textContent = currentUser.name;
  });

  if (profilePicPreview) {
    profilePicPreview.src = profilePicUrl;
  }
}

// Initialize Google Sign-In when app loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('App initialized');
  initializeApp();
  initGoogleSignIn(); // Initialize Google Sign-In
});