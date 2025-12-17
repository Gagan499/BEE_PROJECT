const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const closeBtn = document.getElementById("closeBtn");
const overlay = document.getElementById("overlay");
let base_api = window.location.origin;

const themeToggleDesktop = document.getElementById("themeToggleDesktop");
const themeToggleMobile = document.getElementById("themeToggleMobile");
const themeToggleMobileMenu = document.getElementById("themeToggleMobileMenu");
const themeIconDesktop = document.getElementById("themeIconDesktop");
const themeIconMobile = document.getElementById("themeIconMobile");
const themeIconMobileMenu = document.getElementById("themeIconMobileMenu");

// --- Theme Toggle Logic ---
const applyTheme = (isDark) => {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (themeIconDesktop) themeIconDesktop.classList.replace('fa-sun', 'fa-moon');
        if (themeIconMobile) themeIconMobile.classList.replace('fa-sun', 'fa-moon');
        if (themeIconMobileMenu) themeIconMobileMenu.classList.replace('fa-sun', 'fa-moon');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (themeIconDesktop) themeIconDesktop.classList.replace('fa-moon', 'fa-sun');
        if (themeIconMobile) themeIconMobile.classList.replace('fa-moon', 'fa-sun');
        if (themeIconMobileMenu) themeIconMobileMenu.classList.replace('fa-moon', 'fa-sun');
    }
};

const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(!isDark);
};

// Initialize theme from localStorage or default to light
const storedTheme = localStorage.getItem('theme');
const initialTheme = storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
applyTheme(initialTheme);

if (themeToggleDesktop) themeToggleDesktop.addEventListener('click', toggleTheme);
if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);
if (themeToggleMobileMenu) themeToggleMobileMenu.addEventListener('click', toggleTheme);

// --- Mobile Menu Logic ---
function openMenu() {
  sideMenu.classList.remove("translate-x-full");
  sideMenu.style.transform = "translateY(0)";
  overlay.classList.remove("hidden");
  menuBtn.classList.add("active");
  document.body.style.overflow = 'hidden';
  document.body.classList.add('menu-open');
}

function closeMenu() {
  sideMenu.classList.add("translate-x-full");
  sideMenu.style.transform = "translateY(-100%)";
  overlay.classList.add("hidden");
  menuBtn.classList.remove("active");
  document.body.style.overflow = '';
  document.body.classList.remove('menu-open');
}

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    if (sideMenu.classList.contains("translate-x-full")) {
      openMenu();
    } else {
      closeMenu();
    }
  });
}

if (closeBtn) {
  closeBtn.addEventListener("click", closeMenu);
}

if (overlay) {
  overlay.addEventListener("click", closeMenu);
}

// --- User Dropdown Logic (Desktop/Tablet) ---
const userDropdownDesktop = document.getElementById("userDropdownDesktop");
const userDropdownMenu = document.getElementById("userDropdownMenu");
const userIconDesktop = document.getElementById("userIconDesktop");
const dropdownLogout = document.getElementById("dropdownLogout");
const dropdownUserInfo = document.getElementById("dropdownUserInfo");

// Toggle dropdown
if (userIconDesktop) {
  userIconDesktop.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    userDropdownMenu.classList.toggle("show");
  });
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (userDropdownDesktop && !userDropdownDesktop.contains(e.target)) {
    userDropdownMenu.classList.remove("show");
  }
});

// Handle logout from dropdown
if (dropdownLogout) {
  dropdownLogout.addEventListener("click", async (e) => {
    e.preventDefault();
    await fetch(`${base_api}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/api/login";
  });
}

// Handle user info click
if (dropdownUserInfo) {
  dropdownUserInfo.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/api/profile";
  });
}

// --- Contact Us scroll functionality ---
const navContact = document.getElementById("nav-contact");
const mobileContact = document.getElementById("mobile-contact");

function handleContactClick(e) {
  e.preventDefault();
  const currentPath = window.location.pathname;
  // If already on contact page, do nothing
  if (currentPath === '/api/contact') {
    return;
  }
  // If on home page, scroll to contact section
  if (currentPath === '/' || currentPath === '/api/' || currentPath === '/api/index') {
    const contactSection = document.getElementById("booking");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMenu();
    }
  } else {
    // Navigate to contact page
    window.location.href = "/api/contact";
  }
}

if (navContact) {
  navContact.addEventListener("click", handleContactClick);
}

if (mobileContact) {
  mobileContact.addEventListener("click", handleContactClick);
}

// --- Auth Status Check & Link Management ---
const authLink = document.getElementById("authLink");
const authLinkMobile = document.getElementById("authLinkMobile");
const who_username = document.getElementById("who_username");
const user_detail = document.getElementById("user_detail");
const change_password = document.getElementById("change-password");
const navMyBookings = document.getElementById("nav-my-bookings");
const navMyBookingsLi = document.getElementById("nav-my-bookings-li");
const navBookingLi = document.getElementById("nav-booking-li");
const mobileMyBookings = document.getElementById("mobile-my-bookings");
const mobileMyBookingsLi = document.getElementById("mobile-my-bookings-li");
const mobileBookingLi = document.getElementById("mobile-booking-li");
const navAuthLi = document.getElementById("nav-auth-li");

async function checkAuthStatus() {
  try {
    const response = await fetch(`${base_api}/auth/login/status`, {
      method: "GET",
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      // User is logged in
      if (navAuthLi) navAuthLi.style.display = 'none';

      if (userDropdownDesktop) userDropdownDesktop.classList.remove("hidden");
      if (user_detail) user_detail.classList.remove("hidden");
      if (who_username) who_username.textContent = data.name;
      const mobileUserEmail = document.getElementById("mobile_user_email");
      if (mobileUserEmail) mobileUserEmail.textContent = data.email || "";
      const mobileUserActions = document.getElementById("mobile-user-actions");
      if (mobileUserActions) mobileUserActions.classList.remove("hidden");
      const guestView = document.getElementById("guest_view");
      if (guestView) guestView.classList.add("hidden");
      
      // Update dropdown user info
      const dropdownUserName = document.getElementById("dropdownUserName");
      if (dropdownUserName) dropdownUserName.textContent = data.name;
      const dropdownUserEmail = document.getElementById("dropdownUserEmail");
      if (dropdownUserEmail) dropdownUserEmail.textContent = data.email || "";
      
      // Update mobile user avatar
      const mobileAvatar = document.getElementById("mobile_user_avatar");
      if (mobileAvatar) {
        mobileAvatar.src = `https://i.pravatar.cc/40?u=${data.email || data.name}`;
      }
      const dropdownAvatar = document.getElementById("dropdownUserAvatar");
      if (dropdownAvatar) {
        dropdownAvatar.src = `https://i.pravatar.cc/40?u=${data.email || data.name}`;
      }
      // Show Booking link
      if (navBookingLi) navBookingLi.style.display = "block";
      if (mobileBookingLi) mobileBookingLi.style.display = "block";
      // Set the link target for My Bookings/All Bookings
      const bookingLinkTarget = (data.name === "Admin") ? "/api/admin" : "/api/booking";
      const bookingLinkText = (data.name === "Admin") ? "All Bookings" : "My Bookings";

      if (navMyBookings) {
        navMyBookings.textContent = bookingLinkText;
        navMyBookings.href = bookingLinkTarget;
      }
      if (navMyBookingsLi) navMyBookingsLi.style.display = "block";
      
      if (mobileMyBookings) {
        mobileMyBookings.textContent = bookingLinkText;
        mobileMyBookings.href = bookingLinkTarget;
      }
      if (mobileMyBookingsLi) mobileMyBookingsLi.style.display = "block";
      // Update Mobile Auth Link for Logout
      if (authLinkMobile) {
        authLinkMobile.textContent = "Logout";
        authLinkMobile.href = "#";
        // Logout handler
        const handleLogout = async (e) => {
          e.preventDefault();
          await fetch(`${base_api}/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
          window.location.href = "/api/login";
        };

        authLinkMobile.addEventListener("click", handleLogout);
      }
      
      // Mobile user info click - close menu when navigating
      const mobileUserInfo = document.getElementById("mobile-user-info");
      if (mobileUserInfo) {
        mobileUserInfo.addEventListener("click", () => {
          setTimeout(() => closeMenu(), 100);
        });
      }
    } else {
      // Not logged in
      if (navAuthLi) navAuthLi.style.display = 'block';
      if (userDropdownDesktop) userDropdownDesktop.classList.add("hidden");
      const guestView = document.getElementById("guest_view");
      if (guestView) guestView.classList.remove("hidden");
      const mobileUserActions = document.getElementById("mobile-user-actions");
      if (mobileUserActions) mobileUserActions.classList.add("hidden");
      // Ensure Sign In links are correct (default)
      if (authLink) {
        authLink.textContent = "Sign In";
        authLink.href = "/api/login";
      }
      if (authLinkMobile) {
        authLinkMobile.textContent = "Login";
        authLinkMobile.href = "/api/login";
      }
      
      // Hide logged-in specific links
      if (navMyBookingsLi) navMyBookingsLi.style.display = "none";
      if (mobileMyBookingsLi) mobileMyBookingsLi.style.display = "none";
      if (navBookingLi) navBookingLi.style.display = "none";
      if (mobileBookingLi) mobileBookingLi.style.display = "none";
    }
  } catch (error) {
    console.error("Error checking auth status:", error);
    // Fallback in case of API error
    if (authLink) {
      authLink.textContent = "Sign In";
      authLink.href = "/api/login";
    }
    if (authLinkMobile) {
      authLinkMobile.textContent = "Login";
      authLinkMobile.href = "/api/login";
    }
  }
}

checkAuthStatus();

// Highlight active page
const currentPath = window.location.pathname;
const navLinks = {
  '/': 'nav-home',
  '/api/': 'nav-home',
  '/api/index': 'nav-home',
  '/api/packages': 'nav-packages',
  '/api/contact': 'nav-contact',
  '/api/about': 'nav-contact', // About can share contact highlight or create separate
  '/api/booking': 'nav-booking',
  '/api/user': 'nav-my-bookings',
  '/api/admin': 'nav-my-bookings',
  '/api/profile': 'nav-my-bookings'
};

// Remove active class from all nav links first (desktop and mobile)
document.querySelectorAll('.nav-menu li a').forEach(link => {
  link.classList.remove('active');
});
// Also remove from mobile menu links
document.querySelectorAll('#sideMenu ul li a').forEach(link => {
  link.classList.remove('active');
});

if (navLinks[currentPath]) {
  const activeLink = document.getElementById(navLinks[currentPath]);
  if (activeLink) {
    activeLink.classList.add('active');
  }
  // Also highlight in mobile menu if it exists
  const mobileActiveLink = document.querySelector(`#sideMenu a[href="${currentPath === '/' ? '/' : currentPath}"]`);
  if (mobileActiveLink) {
    mobileActiveLink.classList.add('active');
  }
}

// Scroll to contact section if coming from URL with hash
if (window.location.hash === '#booking') {
  setTimeout(() => {
    const contactSection = document.getElementById("booking");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 300);
}

// --- Navbar Scroll Effect ---
const mainHeader = document.querySelector('.main-header');
const isIndexPage = currentPath === '/' || currentPath === '/api/' || currentPath === '/api/index';
const isPackagesPage = currentPath === '/api/packages';

// Ensure navbar starts transparent for transparent-navbar pages
if (document.body.classList.contains('transparent-navbar') && mainHeader) {
  mainHeader.classList.remove('scrolled');
  mainHeader.style.background = 'transparent';
  mainHeader.style.boxShadow = 'none';
}

function handleNavbarScroll() {
  if (!mainHeader) return;
  if (isIndexPage || isPackagesPage) {
    // For index and packages pages: check if scrolled past feature section
    let featureSection = null;
    if (isIndexPage) {
      // For index page, find the feature-bar
      featureSection = document.querySelector('.feature-bar');
    } else if (isPackagesPage) {
      // For packages page, find the hero section (the section with the image)
      // This is the section with py-32 and text-white that contains the hero image
      const heroSection = document.querySelector('section.py-32.text-white');
      if (heroSection) {
        featureSection = heroSection;
      }
    }
    
    if (featureSection) {
      const featureBottom = featureSection.offsetTop + featureSection.offsetHeight;
      const scrollY = window.scrollY || window.pageYOffset;
      
      if (scrollY > featureBottom) {
        mainHeader.classList.add('scrolled');
      } else {
        mainHeader.classList.remove('scrolled');
      }
    }
  } else {
    // For all other pages: add background after 50px scroll
    const scrollY = window.scrollY || window.pageYOffset;
    
    if (scrollY > 50) {
      mainHeader.classList.add('scrolled');
    } else {
      mainHeader.classList.remove('scrolled');
    }
  }
}

// Initial check
handleNavbarScroll();
// Add scroll listener
window.addEventListener('scroll', handleNavbarScroll, { passive: true });

