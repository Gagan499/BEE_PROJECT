// Admin JavaScript
// Update booking status (Accept/Reject)
async function updateBookingStatus(bookingId, status) {
	const action = status === 'approved' ?
		'accept' : 'reject';
	if (!confirm(`Are you sure you want to ${action} this booking?`)) {
		return;
	}

	// Disable buttons
	const card = document.querySelector(`[data-booking-id="${bookingId}"]`);
	const buttons = card ? card.querySelectorAll('.btn') : [];
	buttons.forEach(btn => btn.disabled = true);

	try {
		const response = await fetch(`/api/bookings/${bookingId}/status`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ status })
		});
		if (response.ok) {
			const result = await response.json();
			alert(`Booking ${action}ed successfully!`);
			
			// Remove the card with animation
			if (card) {
				card.style.transition = 'all 0.3s ease';
				card.style.opacity = '0';
				card.style.transform = 'translateX(-100%)';
				
				setTimeout(() => {
					card.remove();
					
					// Update pending count
					// NOTE: This badge update logic is simplified as the original badge selector was missing. 
					// Reload is used as a fallback for the entire list update.
					location.reload(); 
				}, 300);
			}
		} else {
			const error = await response.json();
			alert('Failed to update booking: ' + (error.message || 'Unknown error'));
			buttons.forEach(btn => btn.disabled = false);
		}
	} catch (error) {
		console.error('Error updating booking:', error);
		alert('An error occurred while updating the booking.');
		buttons.forEach(btn => btn.disabled = false);
	}
}

// Edit Booking
async function editBooking(bookingId) {
	try {
		// Fetch booking details
		const response = await fetch(`/api/bookings/${bookingId}`);
		const result = await response.json();
		
		if (!result.success) {
			alert('Failed to fetch booking details');
			return;
		}

		const booking = result.booking;
		
		// Create edit form (simple prompt-based for now, can be enhanced with modal)
		const newName = prompt('Customer Name:', booking.name || '');
		if (newName === null) return; // User cancelled
		
		const newEmail = prompt('Email:', booking.email || '');
		if (newEmail === null) return;
		
		const newPhone = prompt('Phone:', booking.phoneNumber || booking.phone || '');
		if (newPhone === null) return;

		const updateData = {
			name: newName,
			email: newEmail,
			phoneNumber: newPhone,
			...(booking.arrivalDate && { arrivalDate: booking.arrivalDate }),
			...(booking.departureDate && { departureDate: booking.departureDate }),
			...(booking.adults && { adults: booking.adults }),
			...(booking.children && { children: booking.children }),
			...(booking.specialRequests && { specialRequests: booking.specialRequests })
		};

		const updateResponse = await fetch(`/api/bookings/${bookingId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify(updateData)
		});

		const updateResult = await updateResponse.json();

		if (updateResult.success) {
			alert('Booking updated successfully!');
			location.reload();
		} else {
			alert('Failed to update booking: ' + (updateResult.message || 'Unknown error'));
		}
	} catch (error) {
		console.error('Error editing booking:', error);
		alert('An error occurred while editing the booking.');
	}
}

// Delete Booking
async function deleteBooking(bookingId) {
	if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
		return;
	}

	const card = document.querySelector(`[data-booking-id="${bookingId}"]`);
	const buttons = card ? card.querySelectorAll('.btn') : [];

	buttons.forEach(btn => btn.disabled = true);

	try {
		const response = await fetch(`/api/bookings/${bookingId}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		const result = await response.json();

		if (result.success) {
			alert('Booking deleted successfully!');
			
			// Remove the card with animation
			if (card) {
				card.style.transition = 'all 0.3s ease';
				card.style.opacity = '0';
				card.style.transform = 'translateX(-100%)';
				
				setTimeout(() => {
					card.remove();
					location.reload();
				}, 300);
			} else {
				location.reload();
			}
		} else {
			alert('Failed to delete booking: ' + (result.message || 'Unknown error'));
			buttons.forEach(btn => btn.disabled = false);
		}
	} catch (error) {
		console.error('Error deleting booking:', error);
		alert('An error occurred while deleting the booking.');
		buttons.forEach(btn => btn.disabled = false);
	}
}

// Socket.IO for real-time updates
document.addEventListener('DOMContentLoaded', () => {
	console.log('Initializing WebSocket connection...');
	
	// Get status indicator elements
	const statusIndicator = document.getElementById('websocket-status');
	const statusIcon = document.getElementById('ws-status-icon');
	const statusText = document.getElementById('ws-status-text');
	
	// Function to update WebSocket status display
	function updateWebSocketStatus(status, message) {
		if (!statusIndicator || !statusIcon || !statusText) return;
		
		// Remove all status classes
		statusIndicator.classList.remove('bg-green-100', 'bg-red-100', 'bg-yellow-100', 'bg-gray-100');
		statusIcon.classList.remove('bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-gray-400', 'animate-pulse');
		statusText.classList.remove('text-green-700', 'text-red-700', 'text-yellow-700', 'text-gray-600');
		
		switch(status) {
			case 'connected':
				statusIndicator.classList.add('bg-green-100');
				statusIcon.classList.add('bg-green-500');
				statusIcon.classList.remove('animate-pulse');
				statusText.classList.add('text-green-700');
				statusText.textContent = message || 'Connected';
				break;
			case 'disconnected':
				statusIndicator.classList.add('bg-red-100');
				statusIcon.classList.add('bg-red-500');
				statusIcon.classList.add('animate-pulse');
				statusText.classList.add('text-red-700');
				statusText.textContent = message || 'Disconnected';
				break;
			case 'connecting':
				statusIndicator.classList.add('bg-yellow-100');
				statusIcon.classList.add('bg-yellow-500');
				statusIcon.classList.add('animate-pulse');
				statusText.classList.add('text-yellow-700');
				statusText.textContent = message || 'Connecting...';
				break;
			case 'error':
				statusIndicator.classList.add('bg-red-100');
				statusIcon.classList.add('bg-red-500');
				statusIcon.classList.add('animate-pulse');
				statusText.classList.add('text-red-700');
				statusText.textContent = message || 'Connection Error';
				break;
			default:
				statusIndicator.classList.add('bg-gray-100');
				statusIcon.classList.add('bg-gray-400');
				statusIcon.classList.add('animate-pulse');
				statusText.classList.add('text-gray-600');
				statusText.textContent = message || 'Unknown';
		}
	}
	
	// Initialize with connecting status
	updateWebSocketStatus('connecting', 'Connecting...');
	
	const socket = io();
	
	socket.on('connect', () => {
		console.log('✅ Admin connected to WebSocket:', socket.id);
		console.log('WebSocket connection status: CONNECTED');
		updateWebSocketStatus('connected', 'Live Updates Active');
	});

	socket.on('disconnect', (reason) => {
		console.warn('⚠️ WebSocket disconnected:', reason);
		console.log('WebSocket connection status: DISCONNECTED');
		updateWebSocketStatus('disconnected', 'Disconnected');
	});

	socket.on('connect_error', (error) => {
		console.error('❌ WebSocket connection error:', error);
		console.log('WebSocket connection status: ERROR');
		updateWebSocketStatus('error', 'Connection Failed');
	});

	socket.on('reconnect', (attemptNumber) => {
		console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
		updateWebSocketStatus('connected', 'Reconnected');
	});

	socket.on('reconnect_attempt', (attemptNumber) => {
		console.log('🔄 Attempting to reconnect...', attemptNumber);
		updateWebSocketStatus('connecting', 'Reconnecting...');
	});

	socket.on('connected', (data) => {
		console.log('✅ Received connection confirmation from server:', data);
		updateWebSocketStatus('connected', 'Live Updates Active');
	});

	socket.on('booking-status', (payload) => {
		console.log('📨 Booking status update received:', payload);
		const card = document.querySelector(`[data-booking-id="${payload.bookingId}"]`);
		if (card) {
			card.style.transition = 'all 0.3s ease';
			card.style.opacity = '0';
			setTimeout(() => {
				card.remove();
				const pendingCards = document.querySelectorAll('.booking-card.pending');
				if (pendingCards.length === 0) {
					location.reload();
				}
			}, 300);
		} else {
			console.warn('Booking card not found for ID:', payload.bookingId);
		}
	});

	socket.on('new-booking', (payload) => {
		console.log('📨 New booking received:', payload);
		// Show a brief notification that a new booking was received
		if (statusText) {
			const originalText = statusText.textContent;
			statusText.textContent = 'New Booking Received!';
			setTimeout(() => {
				statusText.textContent = originalText;
			}, 2000);
		}
		// Reload to show new booking
		location.reload();
	});
});

// Edit Package
async function editPackage(packageId) {
	try {
		// Fetch package details
		const response = await fetch(`/api/packages/${packageId}`);
		const result = await response.json();
		
		if (!result.success) {
			if (typeof showAlert === 'function') {
				showAlert('Failed to fetch package details', 'error', 3000);
			} else {
				alert('Failed to fetch package details');
			}
			return;
		}

		const pkg = result.package;
		
		// Redirect to create page with package data (you can enhance this with a modal later)
		// For now, we'll use a simple approach - redirect to create page with query params
		// Or better: create an edit page
		window.location.href = `/api/create-package?edit=${packageId}`;
	} catch (error) {
		console.error('Error editing package:', error);
		if (typeof showAlert === 'function') {
			showAlert('An error occurred while editing the package.', 'error', 3000);
		} else {
			alert('An error occurred while editing the package.');
		}
	}
}

// Delete Package
async function deletePackage(packageId, packageName) {
	if (!confirm(`Are you sure you want to delete "${packageName}"? This action cannot be undone.`)) {
		return;
	}

	try {
		const response = await fetch(`/api/packages/${packageId}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		const result = await response.json();

		if (result.success) {
			if (typeof showAlert === 'function') {
				showAlert('Package deleted successfully!', 'success', 3000);
			} else {
				alert('Package deleted successfully!');
			}
			
			// Reload to update the list
			setTimeout(() => {
				location.reload();
			}, 1000);
		} else {
			if (typeof showAlert === 'function') {
				showAlert('Failed to delete package: ' + (result.message || 'Unknown error'), 'error', 3000);
			} else {
				alert('Failed to delete package: ' + (result.message || 'Unknown error'));
			}
		}
	} catch (error) {
		console.error('Error deleting package:', error);
		if (typeof showAlert === 'function') {
			showAlert('An error occurred while deleting the package.', 'error', 3000);
		} else {
			alert('An error occurred while deleting the package.');
		}
	}
}

// Edit Stay-Only
async function editStayOnly(stayId) {
	try {
		// Fetch stay-only details
		const response = await fetch(`/api/stay-only/${stayId}`);
		const result = await response.json();
		
		if (!result.success) {
			if (typeof showAlert === 'function') {
				showAlert('Failed to fetch accommodation details', 'error', 3000);
			} else {
				alert('Failed to fetch accommodation details');
			}
			return;
		}

		// Redirect to create page with stay data
		window.location.href = `/api/create-stay-only?edit=${stayId}`;
	} catch (error) {
		console.error('Error editing stay-only:', error);
		if (typeof showAlert === 'function') {
			showAlert('An error occurred while editing the accommodation.', 'error', 3000);
		} else {
			alert('An error occurred while editing the accommodation.');
		}
	}
}

// Delete Stay-Only
async function deleteStayOnly(stayId, stayName) {
	if (!confirm(`Are you sure you want to delete "${stayName}"? This action cannot be undone.`)) {
		return;
	}

	try {
		const response = await fetch(`/api/stay-only/${stayId}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		const result = await response.json();

		if (result.success) {
			if (typeof showAlert === 'function') {
				showAlert('Accommodation deleted successfully!', 'success', 3000);
			} else {
				alert('Accommodation deleted successfully!');
			}
			
			// Reload to update the list
			setTimeout(() => {
				location.reload();
			}, 1000);
		} else {
			if (typeof showAlert === 'function') {
				showAlert('Failed to delete accommodation: ' + (result.message || 'Unknown error'), 'error', 3000);
			} else {
				alert('Failed to delete accommodation: ' + (result.message || 'Unknown error'));
			}
		}
	} catch (error) {
		console.error('Error deleting stay-only:', error);
		if (typeof showAlert === 'function') {
			showAlert('An error occurred while deleting the accommodation.', 'error', 3000);
		} else {
			alert('An error occurred while deleting the accommodation.');
		}
	}
}

