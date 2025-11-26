// Create Stay-Only JavaScript
document.addEventListener('DOMContentLoaded', () => {
	const stayOnlyForm = document.getElementById('stayOnlyForm');
	if (!stayOnlyForm) return;

	stayOnlyForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		
		const formData = new FormData(e.target);
		const data = {};
		
		// Convert form data to object
		for (let [key, value] of formData.entries()) {
			if (key === 'amenities' || key === 'features') {
				// Split by newline and filter empty lines
				data[key] = value.split('\n').map(item => item.trim()).filter(item => item);
			} else if (key === 'price' || key === 'rating' || key === 'capacity') {
				data[key] = value ? Number(value) : undefined;
			} else if (key === 'isActive') {
				data[key] = e.target.isActive.checked;
			} else {
				data[key] = value || undefined;
			}
		}
		
		// Handle capacity if provided
		if (data.capacityAdults || data.capacityChildren) {
			data.capacity = {
				adults: data.capacityAdults ? Number(data.capacityAdults) : undefined,
				children: data.capacityChildren ? Number(data.capacityChildren) : undefined
			};
			delete data.capacityAdults;
			delete data.capacityChildren;
		}
		
		// Handle isActive checkbox
		if (!e.target.isActive.checked) {
			data.isActive = false;
		}
		
		const submitBtn = e.target.querySelector('button[type="submit"]');
		const originalText = submitBtn.innerHTML;
		submitBtn.disabled = true;
		submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
		
		try {
			const response = await fetch('/api/stay-only/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(data)
			});
			
			const result = await response.json();
			const messageDiv = document.getElementById('message');
			
			if (result.success) {
				messageDiv.className = 'mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg';
				messageDiv.textContent = result.message || 'Accommodation created successfully!';
				messageDiv.classList.remove('hidden');
				
				// Reset form
				e.target.reset();
				
				// Redirect after 2 seconds
				setTimeout(() => {
					window.location.href = '/api/admin';
				}, 2000);
			} else {
				messageDiv.className = 'mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg';
				messageDiv.textContent = result.message || 'Failed to create accommodation. Please try again.';
				messageDiv.classList.remove('hidden');
			}
		} catch (error) {
			console.error('Error:', error);
			const messageDiv = document.getElementById('message');
			messageDiv.className = 'mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg';
			messageDiv.textContent = 'An error occurred. Please try again.';
			messageDiv.classList.remove('hidden');
		} finally {
			submitBtn.disabled = false;
			submitBtn.innerHTML = originalText;
		}
	});
});

