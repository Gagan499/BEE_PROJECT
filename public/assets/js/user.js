// User JavaScript
// View booking details
function viewDetails(bookingId) {
	// For now, scroll to the booking card and highlight it
	const card = document.querySelector(`[data-booking-id="${bookingId}"]`);
	if (card) {
		card.scrollIntoView({ behavior: 'smooth', block: 'center' });
		// Teal shadow highlight
		card.style.boxShadow = '0 8px 24px rgba(0, 128, 128, 0.4)'; 
		setTimeout(() => {
			card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
		}, 2000);
	}
	
	// TODO: Implement modal with full booking details
	alert('Booking details view - coming soon!');
}

// Cancel booking
async function cancelBooking(bookingId) {
	if (!confirm('Are you sure you want to cancel this booking?')) {
		return;
	}

	try {
		const response = await fetch(`/api/bookings/${bookingId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		if (response.ok) {
			alert('Booking cancelled successfully!');
			location.reload();
		} else {
			const error = await response.json();
			alert('Failed to cancel booking: ' + (error.message || 'Unknown error'));
		}
	} catch (error) {
		console.error('Error cancelling booking:', error);
		alert('An error occurred while cancelling the booking.');
	}
}

