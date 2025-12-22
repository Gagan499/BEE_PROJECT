// Check authentication status
async function checkAuthStatus() {
	try {
		const response = await fetch(`${window.location.origin}/auth/login/status`, {
			method: "GET",
			credentials: "include",
		});
		if (response.ok) {
			const data = await response.json();
			return data.LoggedIn === true;
		}
	} catch (err) {
		console.error("Error checking auth status:", err);
	}
	return false;
}

// Handle book package button click
async function handleBookPackage(packageId, packageName) {
	const isLoggedIn = await checkAuthStatus();
	
	if (isLoggedIn) {
		// User is logged in - redirect to booking page with package ID
		window.location.href = `/api/booking?packageId=${encodeURIComponent(packageId)}`;
	} else {
		// User is not logged in - redirect to login page with return URL
		window.location.href = `/api/login?returnUrl=/api/booking&packageId=${encodeURIComponent(packageId)}`;
	}
}

// Navbar scroll effect - change from transparent to solid after hero section
document.addEventListener("DOMContentLoaded", () => {
	const header = document.querySelector(".main-header");
	const heroSection = document.querySelector("section.bg-gradient-to-br");
	
	if (header && heroSection) {
		// Ensure navbar starts transparent (remove scrolled class if present)
		header.classList.remove("scrolled");
		
		function handleScroll() {
			const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
			const scrollPosition = window.pageYOffset || window.scrollY;
			
			// Change navbar when scrolling past the hero section
			if (scrollPosition >= heroBottom - 50) {
				header.classList.add("scrolled");
			} else {
				header.classList.remove("scrolled");
			}
		}
		
		// Check on initial load (after a small delay to ensure DOM is ready)
		setTimeout(() => {
			handleScroll();
		}, 100);
		
		// Check on scroll with throttling for better performance
		let ticking = false;
		window.addEventListener("scroll", () => {
			if (!ticking) {
				window.requestAnimationFrame(() => {
					handleScroll();
					ticking = false;
				});
				ticking = true;
			}
		});
	}
});
