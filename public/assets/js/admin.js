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
	const socket = io();
	
	socket.on('connect', () => {
		console.log('Admin connected to socket:', socket.id);
	});

	socket.on('booking-status', (payload) => {
		console.log('Booking status update received:', payload);
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
		}
	});

	socket.on('new-booking', (payload) => {
		console.log('New booking received:', payload);
		// Reload to show new booking
		location.reload();
	});
});

