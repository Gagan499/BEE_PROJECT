const form_api = window.location.origin;
const forgot_form = document.getElementById("ForgotForm");
const container = document.getElementById("forget_page");
const otpContainer = document.getElementById("otp-container");
const resetPasswordContainer = document.getElementById("reset-password-container");
const verifyBtn = document.getElementById("verifyOtp");
const resetPasswordForm = document.getElementById("resetPasswordForm");
const backToEmailBtn = document.getElementById("backToEmail");

let userEmail = "";
let resetToken = "";
let loggedInUserEmailFromToken = null;

// Fetch logged-in user's email from JWT token
async function fetchLoggedInUserEmail() {
  try {
    const response = await fetch(`${form_api}/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user && data.user.email) {
        loggedInUserEmailFromToken = data.user.email.toLowerCase();
        return loggedInUserEmailFromToken;
      }
    }
  } catch (err) {
    // User is not logged in or token is invalid
    loggedInUserEmailFromToken = null;
  }
  return null;
}

// Initialize: Fetch logged-in user email on page load (for validation only, not pre-filling)
fetchLoggedInUserEmail().then((email) => {
  // Email is fetched for validation purposes only, not pre-filled
});

// Handle input label animation
document.querySelectorAll('.input-focus').forEach(input => {
  input.addEventListener('focus', function() {
    this.classList.add('input-filled');
    const label = this.nextElementSibling;
    if (label) {
      label.style.transform = 'translateY(-1.5rem) scale(0.875)';
      label.style.color = '#008080';
    }
  });
  
  input.addEventListener('blur', function() {
    if (!this.value) {
      this.classList.remove('input-filled');
      const label = this.nextElementSibling;
      if (label) {
        label.style.transform = '';
        label.style.color = '';
      }
    }
  });
  
  // Check if input has value on load
  if (input.value) {
    input.classList.add('input-filled');
    const label = input.nextElementSibling;
    if (label) {
      label.style.transform = 'translateY(-1.5rem) scale(0.875)';
      label.style.color = '#008080';
    }
  }
});

// Send OTP
if (forgot_form) {
  forgot_form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const enteredEmail = document.getElementById("email").value.trim().toLowerCase();
    
    // Ensure we have the latest logged-in user email (in case fetch hasn't completed yet)
    if (!loggedInUserEmailFromToken) {
      await fetchLoggedInUserEmail();
    }
    
    // Check if user is logged in and validate email matches
    if (loggedInUserEmailFromToken) {
      if (enteredEmail !== loggedInUserEmailFromToken) {
        showAlert("You can only reset the password for your own account. Please enter your logged-in email address.", "error");
        return;
      }
    }
    
    userEmail = enteredEmail;
    const submitBtn = forgot_form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
    
    try {
      const response = await fetch(`${form_api}/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      if (response.ok) {
        container.classList.add("hidden");
        otpContainer.classList.remove("hidden");
        showAlert("OTP sent to your email!", "success");
      } else {
        showAlert(data.error || "Failed to send OTP. Please try again.", "error");
      }
    } catch {
      showAlert("Server error. Please try again later.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// Verify OTP
if (verifyBtn) {
  verifyBtn.addEventListener("click", async () => {
    const otp = document.getElementById("otp").value.trim();
    if (!otp) return showAlert("Please enter the OTP", "warning");
    if (otp.length !== 4) return showAlert("OTP must be 4 digits", "warning");

    const originalText = verifyBtn.innerHTML;
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying...';

    try {
      const response = await fetch(`${form_api}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: userEmail, otp }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        resetToken = data.resetToken;
        otpContainer.classList.add("hidden");
        resetPasswordContainer.classList.remove("hidden");
        showAlert("OTP verified successfully! Please enter your new password.", "success");
      } else {
        showAlert(data.message || "Invalid OTP. Please try again.", "error");
      }
    } catch {
      showAlert("Error verifying OTP. Please try again.", "error");
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = originalText;
    }
  });
}

// Reset Password
if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (newPassword !== confirmPassword)
      return showAlert("Passwords do not match!", "error");
    if (newPassword.length < 6)
      return showAlert("Password must be at least 6 characters long!", "warning");

    const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Resetting...';

    try {
      const response = await fetch(`${form_api}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: userEmail, newPassword, resetToken }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showAlert("Password reset successfully!", "success");
        setTimeout(() => {
          showAlert("Redirecting to login...", "success");
          setTimeout(() => (window.location.href = "/api/login"), 1000);
        }, 1000);
      } else {
        showAlert(data.message || "Failed to reset password. Please try again.", "error");
      }
    } catch {
      showAlert("Server error. Please try again later.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// Back to Email
if (backToEmailBtn) {
  backToEmailBtn.addEventListener("click", (e) => {
    e.preventDefault();
    otpContainer.classList.add("hidden");
    container.classList.remove("hidden");
    const otpInput = document.getElementById("otp");
    if (otpInput) otpInput.value = "";
  });
}

