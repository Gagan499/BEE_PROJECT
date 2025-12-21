// Mobile form toggle functions
function showLoginForm() {
  document.getElementById('mobileLoginForm').classList.remove('hidden');
  document.getElementById('mobileSignupForm').classList.add('hidden');
  document.getElementById('mobileBackBtn').classList.remove('show');
}

function showSignupForm() {
  document.getElementById('mobileLoginForm').classList.add('hidden');
  document.getElementById('mobileSignupForm').classList.remove('hidden');
  document.getElementById('mobileBackBtn').classList.add('show');
}

// Initialize - show login form by default
if (window.innerWidth <= 480) {
  showLoginForm();
}

// Desktop sliding panel functionality
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

if (signUpButton && signInButton && container) {
  signUpButton.addEventListener('click', () => {
    container.classList.add('right-panel-active');
  });
  
  signInButton.addEventListener('click', () => {
    container.classList.remove('right-panel-active');
  });
}

const api = window.location.origin;

// Mobile form handlers
const loginformMobile = document.getElementById('loginform-mobile');
const registerformMobile = document.getElementById('registerform-mobile');

// Desktop form handlers
const loginform = document.getElementById('loginform');
const registerform = document.getElementById('registerform');

// Mobile Login Handler
if (loginformMobile) {
  loginformMobile.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email-signin-mobile').value;
    const password = document.getElementById('password-signin-mobile').value;
    const submitButton = e.submitter;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;

    try {
      const response = await fetch(`${api}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok) {
        showAlert("Login successful! Redirecting...", "success", 2000);
        // Check for return URL and package ID in query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl');
        const packageId = urlParams.get('packageId');
        
        let redirectUrl = "/";
        if (returnUrl) {
          redirectUrl = returnUrl;
          if (packageId) {
            redirectUrl += `?packageId=${encodeURIComponent(packageId)}`;
          }
        }
        
        setTimeout(() => window.location.href = redirectUrl, 1500);
      } else if (response.status === 429) {
        const message = result.message || 'Login limit reached. Please try again later.';
        const minutes = Math.ceil((result.remainingSeconds || 0) / 60);
        showAlert(`${message} (Try again in ${minutes} minute(s))`, "warning", 6000);
      } else {
        showAlert(result.message || 'Login failed. Please check credentials.', "error");
      }
    } catch (err) {
      console.error('Login error:', err);
      showAlert('An error occurred. Please try again.', "error");
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
}

// Mobile Register Handler
if (registerformMobile) {
  registerformMobile.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email-signup-mobile').value;
    const password = document.getElementById('password-signup-mobile').value;
    const confirmPassword = document.getElementById('confirm-password-mobile').value;
    
    if (password !== confirmPassword) {
      showAlert("Passwords do not match!", "error");
      return;
    }

    const submitButton = e.submitter;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Registering...';
    submitButton.disabled = true;

    try {
      const response = await fetch(`${api}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: email.split('@')[0], email, password })
      });

      const result = await response.json();

      if (response.ok) {
        showAlert("Registration successful! Redirecting...", "success", 2000);
        setTimeout(() => window.location.href = "/api/login", 1500);
      } else {
        showAlert(result.message || "Registration failed. Please try again.", "error");
      }
    } catch (err) {
      console.error('Register error:', err);
      showAlert("An error occurred during registration.", "error");
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
}

// Desktop Login
if (loginform) {
  loginform.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email-signin').value;
    const password = document.getElementById('password-signin').value;
    const submitButton = e.submitter;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;

    try {
      const response = await fetch(`${api}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok) {
        showAlert("Login successful! Redirecting...", "success", 2000);
        // Check for return URL and package ID in query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl');
        const packageId = urlParams.get('packageId');
        
        let redirectUrl = "/";
        if (returnUrl) {
          redirectUrl = returnUrl;
          if (packageId) {
            redirectUrl += `?packageId=${encodeURIComponent(packageId)}`;
          }
        }
        
        setTimeout(() => window.location.href = redirectUrl, 1500);
      } else if (response.status === 429) {
        const message = result.message || 'Login limit reached. Please try again later.';
        const minutes = Math.ceil((result.remainingSeconds 
          || 0) / 60);
        showAlert(`${message} (Try again in ${minutes} minute(s))`, "warning", 6000);
      } else {
        showAlert(result.message ||
          'Login failed. Please check credentials.', "error");
      }
    } catch (err) {
      console.error('Login error:', err);
      showAlert('An error occurred. Please try again.', "error");
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
}

// Desktop Register
if (registerform) {
  registerform.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name-signup').value;
    const email = document.getElementById('email-signup').value;
    const password = document.getElementById('password-signup').value;
    const submitButton = e.submitter;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Registering...';
    submitButton.disabled = true;

    try {
      const response = await fetch(`${api}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, 
          email, password })
      });

      const result = await response.json();

      if (response.ok) {
        showAlert("Registration successful! Redirecting...", "success", 2000);
        setTimeout(() => window.location.href = "/api/login", 1500);
      } else {
        showAlert(result.message || "Registration failed. Please try again.", "error");
      }
    } catch (err) {
      console.error('Register error:', err);
      showAlert("An error occurred during registration.", "error");
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
}

