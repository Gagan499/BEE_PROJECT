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

