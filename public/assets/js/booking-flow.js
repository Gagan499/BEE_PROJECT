// Booking Flow JavaScript
document.addEventListener('DOMContentLoaded', () => {
	const roomCards = document.querySelectorAll('.room-card');
	const checkInInput = document.getElementById('checkIn');
	const checkOutInput = document.getElementById('checkOut');
	const guestsSelect = document.getElementById('guests');
	const summaryRoomImage = document.querySelector('.summary-room-image');

	const stayOnlyCards = document.querySelectorAll('.stay-only-card');
	let selectedRoom = null;
	let selectedStayOnly = null;
	let pricePerNight = 280;
	let bookingType = 'package'; // Default to package
	let selectedPackageName = null;
	let selectedHotelName = null;

	// Set minimum date to today
	const today = new Date().toISOString().split('T')[0];
	if (checkInInput) {
		checkInInput.setAttribute('min', today);
	}

	// Booking Type Toggle
	const bookingTypeRadios = document.querySelectorAll('.booking-type-radio');
	const packageSelection = document.getElementById('packageSelection');
	const stayOnlySelection = document.getElementById('stayOnlySelection');

	bookingTypeRadios.forEach(radio => {
		radio.addEventListener('change', () => {
			bookingType = radio.value;
			if (bookingType === 'package') {
				if (packageSelection) packageSelection.classList.remove('hidden');
				if (stayOnlySelection) stayOnlySelection.classList.add('hidden');
				selectedHotelName = null;
				selectedStayOnly = null;
				// Reset room selection
				selectedRoom = null;
				roomCards.forEach(c => c.classList.remove('selected'));
				stayOnlyCards.forEach(c => c.classList.remove('selected'));
			} else {
				if (packageSelection) packageSelection.classList.add('hidden');
				if (stayOnlySelection) stayOnlySelection.classList.remove('hidden');
				selectedPackageName = null;
				// Reset room selection
				selectedRoom = null;
				roomCards.forEach(c => c.classList.remove('selected'));
				stayOnlyCards.forEach(c => c.classList.remove('selected'));
				// Reset price
				pricePerNight = 0;
				calculateTotal();
			}
		});
	});

	// Stay-only accommodation selection
	stayOnlyCards.forEach(card => {
		card.addEventListener('click', () => {
			if (bookingType === 'stayOnly') {
				stayOnlyCards.forEach(c => c.classList.remove('selected'));
				card.classList.add('selected');
				selectedStayOnly = card.dataset.stayId;
				selectedHotelName = card.dataset.stayName;
				pricePerNight = parseFloat(card.dataset.price) || 0;
				
				// Update summary
				const stayName = card.querySelector('.stay-only-name');
				
				if (stayName) {
					const summaryRoomNameEl = document.getElementById('summaryRoomName');
					if (summaryRoomNameEl) summaryRoomNameEl.textContent = stayName.textContent;
				}
				// Keep the summary image fixed - don't change it when selecting stay-only accommodations
				
				calculateTotal();
			}
		});
	});

	// Room selection (only for package type)
	roomCards.forEach(card => {
		card.addEventListener('click', () => {
			if (bookingType === 'package') {
				roomCards.forEach(c => c.classList.remove('selected'));
				card.classList.add('selected');
				selectedRoom = card.dataset.room;
				selectedPackageName = card.dataset.packageName;
				pricePerNight = parseInt(card.dataset.price) || 0;
				
				// Update summary
				const roomName = card.querySelector('.room-name');
				
				if (roomName) {
					const summaryRoomNameEl = document.getElementById('summaryRoomName');
					if (summaryRoomNameEl) summaryRoomNameEl.textContent = roomName.textContent;
				}
				// Keep the summary image fixed - don't change it when selecting packages
				
				calculateTotal();
			}
		});
	});

	// Date change handlers
	if (checkInInput) {
		checkInInput.addEventListener('change', function() {
			const checkInDate = new Date(this.value);
			const minCheckOut = new Date(checkInDate);
			minCheckOut.setDate(minCheckOut.getDate() + 1);
			if (checkOutInput) {
				checkOutInput.setAttribute('min', minCheckOut.toISOString().split('T')[0]);
				
				if (checkOutInput.value && new Date(checkOutInput.value) <= checkInDate) {
					checkOutInput.value = '';
				}
			}
			
			updateSummary();
			calculateTotal();
		});
	}
	
	if (checkOutInput) {
		checkOutInput.addEventListener('change', () => {
			updateSummary();
			calculateTotal();
		});
	}

	const childrenSelect = document.getElementById('children');
	if (guestsSelect) {
		guestsSelect.addEventListener('change', updateSummary);
	}
	if (childrenSelect) {
		childrenSelect.addEventListener('change', updateSummary);
	}

	function updateSummary() {
		if (!checkInInput || !checkOutInput || !guestsSelect) return;
		
		const checkIn = checkInInput.value;
		const checkOut = checkOutInput.value;
		const guests = guestsSelect.value;
		const children = childrenSelect ? childrenSelect.value : 0;
		
		const summaryCheckIn = document.getElementById('summaryCheckIn');
		const summaryCheckOut = document.getElementById('summaryCheckOut');
		const summaryGuests = document.getElementById('summaryGuests');
		
		if (summaryCheckIn) summaryCheckIn.textContent = checkIn || 'Not selected';
		if (summaryCheckOut) summaryCheckOut.textContent = checkOut || 'Not selected';
		if (summaryGuests) {
			const guestText = guests + (guests == 1 ? ' Adult' : ' Adults');
			const childrenText = children > 0 ? ', ' + children + (children == 1 ? ' Child' : ' Children') : '';
			summaryGuests.textContent = guestText + childrenText;
		}
	}

	function calculateTotal() {
		if (!checkInInput || !checkOutInput) return;
		
		const checkIn = checkInInput.value;
		const checkOut = checkOutInput.value;

		const roomRate = document.getElementById('roomRate');
		const subtotal = document.getElementById('subtotal');
		const tax = document.getElementById('tax');
		const totalAmount = document.getElementById('totalAmount');

		if (checkIn && checkOut && pricePerNight) {
			const diffTime = new Date(checkOut) - new Date(checkIn);
			const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			
			if (nights <= 0) {
				// Reset summary to default if dates are invalid
				if (roomRate) roomRate.textContent = `Not selected`;
				if (subtotal) subtotal.textContent = `N/A`;
				if (tax) tax.textContent = `N/A`;
				if (totalAmount) totalAmount.textContent = `N/A`;
				// Update QR amount
				updateQRAmount();
				return;
			}

			const subtotalValue = pricePerNight * nights;
			const taxValue = subtotalValue * 0.15;
			const total = subtotalValue + taxValue;
			
			if (roomRate) roomRate.textContent = `$${pricePerNight}/night`;
			if (subtotal) subtotal.textContent = `$${subtotalValue.toFixed(0)}`;
			if (tax) tax.textContent = `$${taxValue.toFixed(0)}`;
			if (totalAmount) totalAmount.textContent = `$${total.toFixed(0)}`;
		} else {
			if (roomRate) roomRate.textContent = `Not selected`;
			if (subtotal) subtotal.textContent = `N/A`;
			if (tax) tax.textContent = `N/A`;
			if (totalAmount) totalAmount.textContent = `N/A`;
		}
		
		// Update QR amount
		updateQRAmount();
	}
	
	// Detect currency based on user's location
	function detectCurrency() {
		try {
			// Get user's timezone
			const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			
			// Check if timezone is in India
			if (timezone.includes('Calcutta') || timezone.includes('Kolkata') || 
			    timezone.includes('Mumbai') || timezone.includes('Delhi') ||
			    timezone.includes('Asia/Kolkata') || timezone.includes('IST')) {
				return { symbol: '₹', code: 'INR', name: 'Indian Rupee' };
			}
			
			// Get locale for additional check
			const locale = navigator.language || navigator.userLanguage;
			if (locale.includes('en-IN') || locale.includes('hi-IN')) {
				return { symbol: '₹', code: 'INR', name: 'Indian Rupee' };
			}
			
			// Default to USD
			return { symbol: '$', code: 'USD', name: 'US Dollar' };
		} catch (e) {
			// Fallback to USD if detection fails
			return { symbol: '$', code: 'USD', name: 'US Dollar' };
		}
	}
	
	// Get currency once on page load
	const userCurrency = detectCurrency();
	
	// USD to INR conversion rate (update as needed)
	const USD_TO_INR_RATE = 83.5;
	
	// Function to update QR amount with currency conversion
	function updateQRAmount() {
		const qrAmount = document.getElementById('qrAmount');
		if (qrAmount) {
			const totalUSD = calculateTotalAmount();
			
			// Convert USD to INR for QR code payment
			const totalINR = totalUSD * USD_TO_INR_RATE;
			
			// Format INR with Indian number formatting
			const formattedAmount = new Intl.NumberFormat('en-IN', {
				maximumFractionDigits: 0
			}).format(totalINR);
			
			qrAmount.textContent = `₹${formattedAmount}`;
		}
	}

	// Helper function to calculate total amount for submission
	function calculateTotalAmount() {
		if (!checkInInput || !checkOutInput) return 0;
		
		const checkIn = checkInInput.value;
		const checkOut = checkOutInput.value;

		if (checkIn && checkOut && pricePerNight) {
			const diffTime = new Date(checkOut) - new Date(checkIn);
			const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			if (nights > 0) {
				const subtotal = pricePerNight * nights;
				const tax = subtotal * 0.15;
				return subtotal + tax;
			}
		}
		return 0;
	}

	// Check for package ID in URL query parameters
	const urlParams = new URLSearchParams(window.location.search);
	const packageIdFromUrl = urlParams.get('packageId');
	
	// Select package based on URL parameter or default to first
	if (bookingType === 'package' && roomCards.length > 0) {
		if (packageIdFromUrl) {
			// Find and select the package matching the ID from URL
			const targetCard = Array.from(roomCards).find(card => card.dataset.room === packageIdFromUrl);
			if (targetCard) {
				targetCard.click();
			} else {
				// If package not found, select first one
				roomCards[0].click();
			}
		} else {
			// No package ID in URL, select first room by default
			roomCards[0].click();
		}
	} else if (bookingType === 'stayOnly' && stayOnlyCards.length > 0) {
		// Select first stay-only accommodation by default
		stayOnlyCards[0].click();
	} else {
		// Initialize summary with default price if no options are present
		calculateTotal(); 
	}

	// Step Navigation
	const step1 = document.getElementById('step1');
	const step2 = document.getElementById('step2');
	const step3 = document.getElementById('step3');
	const continueToStep2Btn = document.getElementById('continueToStep2');
	const continueToStep3Btn = document.getElementById('continueToStep3');
	const confirmBookingBtn = document.getElementById('confirmBooking');
	const backToStep1Btn = document.getElementById('backToStep1');
	const backToStep2Btn = document.getElementById('backToStep2');
	
	// Progress step elements
	const progressSteps = document.querySelectorAll('.step');

	function updateProgressSteps(activeStep) {
		progressSteps.forEach((step, index) => {
			// Toggle active class on the main step container
			if (index <= activeStep) {
				step.classList.add('active');
			} else {
				step.classList.remove('active');
			}
			
			// Update styling for the circle based on index
			const circle = step.querySelector('.w-11');
			const text = step.querySelector('.text-base');
			
			if (index === activeStep) {
				if (circle) {
					circle.classList.add('teal-gradient-bg', 'text-white');
					circle.classList.remove('bg-gray-100', 'text-gray-400');
				}
				if (text) {
					text.classList.add('text-primary-teal');
					text.classList.remove('text-gray-500');
				}
			} else if (index < activeStep) {
				// Completed steps
				if (circle) {
					circle.classList.add('teal-gradient-bg', 'text-white');
					circle.classList.remove('bg-gray-100', 'text-gray-400');
				}
				if (text) {
					text.classList.add('text-gray-500');
					text.classList.remove('text-primary-teal');
				}
			} else {
				// Future steps
				if (circle) {
					circle.classList.add('bg-gray-100', 'text-gray-400');
					circle.classList.remove('teal-gradient-bg', 'text-white');
				}
				if (text) {
					text.classList.add('text-gray-500');
					text.classList.remove('text-primary-teal');
				}
			}
		});
	}

	// Step 1 to Step 2
	if (continueToStep2Btn) {
		continueToStep2Btn.addEventListener('click', () => {
			// Validate step 1
			if (bookingType === 'package') {
				if (!selectedRoom || !selectedPackageName) {
					alert('Please select a package first.');
					return;
				}
			} else {
				if (!selectedStayOnly || !selectedHotelName) {
					alert('Please select an accommodation first.');
					return;
				}
			}
			
			if (!checkInInput || !checkOutInput || !checkInInput.value || !checkOutInput.value) {
				alert('Please select check-in and check-out dates');
				return;
			}
			
			const arrival = new Date(checkInInput.value);
			const departure = new Date(checkOutInput.value);
			
			if (departure <= arrival) {
				alert('Check-out date must be after check-in date.');
				return;
			}

			if (step1) step1.style.display = 'none';
			if (step2) step2.style.display = 'block';
			if (step3) step3.style.display = 'none';
			updateProgressSteps(1);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}
	
	// Step 2 to Step 3
	if (continueToStep3Btn) {
		continueToStep3Btn.addEventListener('click', () => {
			// Validate step 2
			const fullName = document.getElementById('fullName');
			const email = document.getElementById('email');
			const phone = document.getElementById('phone');

			if (!fullName || !email || !phone || !fullName.value.trim() || !email.value.trim() || !phone.value.trim()) {
				alert('Please fill in all required fields (Full Name, Email, Phone Number)');
				return;
			}

			if (step1) step1.style.display = 'none';
			if (step2) step2.style.display = 'none';
			if (step3) step3.style.display = 'block';
			updateProgressSteps(2);
			window.scrollTo({ top: 0, behavior: 'smooth' });
			
			// Select first payment method by default if none selected
			const paymentMethodRadios = document.querySelectorAll('.payment-method-radio');
			const hasSelected = Array.from(paymentMethodRadios).some(radio => radio.checked);
			if (!hasSelected && paymentMethodRadios.length > 0) {
				paymentMethodRadios[0].checked = true;
				paymentMethodRadios[0].dispatchEvent(new Event('change'));
			} else {
				// Show form for already selected payment method
				const selectedRadio = Array.from(paymentMethodRadios).find(radio => radio.checked);
				if (selectedRadio) {
					showPaymentForm(selectedRadio.value);
				}
			}
		});
	}
	
	// Back to Step 1
	if (backToStep1Btn) {
		backToStep1Btn.addEventListener('click', () => {
			if (step1) step1.style.display = 'block';
			if (step2) step2.style.display = 'none';
			if (step3) step3.style.display = 'none';
			updateProgressSteps(0);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}
	
	// Back to Step 2
	if (backToStep2Btn) {
		backToStep2Btn.addEventListener('click', () => {
			if (step1) step1.style.display = 'none';
			if (step2) step2.style.display = 'block';
			if (step3) step3.style.display = 'none';
			updateProgressSteps(1);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}
	
	// Confirm Booking
	if (confirmBookingBtn) {
		confirmBookingBtn.addEventListener('click', async () => {
			const fullName = document.getElementById('fullName');
			const email = document.getElementById('email');
			const phone = document.getElementById('phone');
			const specialRequests = document.getElementById('specialRequests');
			const paymentMethodRadio = document.querySelector('input[name="paymentMethod"]:checked');
			
			if (!fullName || !email || !phone || !checkInInput || !checkOutInput || !guestsSelect) {
				alert('Please fill in all required fields');
				return;
			}

			const fullNameValue = fullName.value.trim();
			const emailValue = email.value.trim();
			const phoneValue = phone.value.trim();
			const specialRequestsValue = specialRequests ? specialRequests.value.trim() : '';
			const checkIn = checkInInput.value;
			const checkOut = checkOutInput.value;
			const adults = parseInt(guestsSelect.value);
			const children = childrenSelect ? parseInt(childrenSelect.value) || 0 : 0;
			const paymentMethod = paymentMethodRadio ? paymentMethodRadio.value : null;

			// Validate all fields
			if (!fullNameValue || !emailValue || !phoneValue || !checkIn || !checkOut || !adults) {
				alert('Please fill in all required fields');
				return;
			}

			if (!paymentMethod) {
				alert('Please select a payment method');
				return;
			}

			// Validate payment details based on method
			let paymentDetails = {};
			if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
				const cardNumber = document.getElementById('cardNumber')?.value.trim();
				const cardHolderName = document.getElementById('cardHolderName')?.value.trim();
				const expiryDate = document.getElementById('expiryDate')?.value.trim();
				const cvv = document.getElementById('cvv')?.value.trim();
				
				if (!cardNumber || !cardHolderName || !expiryDate || !cvv) {
					alert('Please fill in all card details');
					return;
				}
				paymentDetails = {
					cardNumber: cardNumber.replace(/\s/g, ''),
					cardHolderName: cardHolderName,
					expiryDate: expiryDate,
					cvv: cvv
				};
			} else if (paymentMethod === 'bank_transfer') {
				const accountNumber = document.getElementById('accountNumber')?.value.trim();
				const accountHolderName = document.getElementById('accountHolderName')?.value.trim();
				const bankName = document.getElementById('bankName')?.value.trim();
				const ifscCode = document.getElementById('ifscCode')?.value.trim();
				
				if (!accountNumber || !accountHolderName || !bankName || !ifscCode) {
					alert('Please fill in all bank transfer details');
					return;
				}
				paymentDetails = {
					accountNumber: accountNumber,
					accountHolderName: accountHolderName,
					bankName: bankName,
					ifscCode: ifscCode
				};
			} else if (paymentMethod === 'paypal') {
				const paypalEmail = document.getElementById('paypalEmail')?.value.trim();
				
				if (!paypalEmail) {
					alert('Please enter your PayPal email');
					return;
				}
				paymentDetails = {
					paypalEmail: paypalEmail
				};
			} else if (paymentMethod === 'paytm') {
				const paytmNumber = document.getElementById('paytmNumber')?.value.trim();
				
				if (!paytmNumber) {
					alert('Please enter your Paytm number');
					return;
				}
				paymentDetails = {
					paytmNumber: paytmNumber,
					upiId: document.getElementById('upiId')?.value.trim() || undefined
				};
			} else if (paymentMethod === 'scanning') {
				const transactionId = document.getElementById('transactionId')?.value.trim();
				
				if (!transactionId) {
					alert('Please enter the transaction ID after scanning the QR code');
					return;
				}
				paymentDetails = {
					transactionId: transactionId,
					qrCodeScanned: true
				};
			}

			if (bookingType === 'package' && !selectedPackageName) {
				alert('Please select a package');
				return;
			}

			if (bookingType === 'stayOnly' && (!selectedStayOnly || !selectedHotelName)) {
				alert('Please select an accommodation');
				return;
			}

			// Prepare booking data
			const bookingData = {
				customerName: fullNameValue,
				phoneNumber: phoneValue,
				emailId: emailValue,
				bookingType: bookingType,
				packageName: bookingType === 'package' ? selectedPackageName : undefined,
				hotelName: bookingType === 'stayOnly' ? selectedHotelName : undefined,
				arrivalDate: checkIn,
				departureDate: checkOut,
				adults: parseInt(adults),
				children: parseInt(children),
				specialRequests: specialRequestsValue || undefined,
				paymentMethod: paymentMethod,
				paymentDetails: paymentDetails,
				totalAmount: calculateTotalAmount()
			};

			// Disable button and show loading
			confirmBookingBtn.disabled = true;
			const originalText = confirmBookingBtn.innerHTML;
			confirmBookingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

			try {
				const response = await fetch('/api/bookings', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify(bookingData)
				});

				const result = await response.json();

				if (result.success) {
					alert('Booking submitted successfully! You will receive a confirmation email shortly.');
					window.location.href = '/api/user';
				} else {
					alert('Failed to submit booking: ' + (result.message || 'Unknown error'));
					confirmBookingBtn.disabled = false;
					confirmBookingBtn.innerHTML = originalText;
				}
			} catch (error) {
				console.error('Error submitting booking:', error);
				alert('An error occurred while submitting your booking. Please try again.');
				confirmBookingBtn.disabled = false;
				confirmBookingBtn.innerHTML = originalText;
			}
		});
	}
	
	// Payment Method Selection
	const paymentMethodCards = document.querySelectorAll('.payment-method-card');
	const paymentMethodRadios = document.querySelectorAll('.payment-method-radio');
	
	// Payment detail forms
	const cardPaymentForm = document.getElementById('cardPaymentForm');
	const bankTransferForm = document.getElementById('bankTransferForm');
	const paypalForm = document.getElementById('paypalForm');
	const paytmForm = document.getElementById('paytmForm');
	const scanningForm = document.getElementById('scanningForm');
	
	// Function to hide all payment forms
	function hideAllPaymentForms() {
		if (cardPaymentForm) cardPaymentForm.classList.add('hidden');
		if (bankTransferForm) bankTransferForm.classList.add('hidden');
		if (paypalForm) paypalForm.classList.add('hidden');
		if (paytmForm) paytmForm.classList.add('hidden');
		if (scanningForm) scanningForm.classList.add('hidden');
	}
	
	// Function to show payment form based on method
	function showPaymentForm(method) {
		hideAllPaymentForms();
		
		switch(method) {
			case 'credit_card':
			case 'debit_card':
				if (cardPaymentForm) cardPaymentForm.classList.remove('hidden');
				break;
			case 'bank_transfer':
				if (bankTransferForm) bankTransferForm.classList.remove('hidden');
				break;
			case 'paypal':
				if (paypalForm) paypalForm.classList.remove('hidden');
				break;
			case 'paytm':
				if (paytmForm) paytmForm.classList.remove('hidden');
				break;
			case 'scanning':
				if (scanningForm) scanningForm.classList.remove('hidden');
				// Update QR amount with currency detection
				updateQRAmount();
				break;
			case 'cash':
				// No form needed for cash
				break;
		}
	}
	
	paymentMethodRadios.forEach(radio => {
		radio.addEventListener('change', () => {
			// Remove selected class from all cards
			paymentMethodCards.forEach(card => {
				card.classList.remove('border-primary-teal', 'bg-light-mint');
				card.classList.add('border-gray-200');
			});
			
			// Add selected class to the selected card
			const selectedCard = radio.closest('label').querySelector('.payment-method-card');
			if (selectedCard) {
				selectedCard.classList.add('border-primary-teal', 'bg-light-mint');
				selectedCard.classList.remove('border-gray-200');
			}
			
			// Show appropriate payment form
			showPaymentForm(radio.value);
		});
	});
	
	// Initialize payment method cards styling
	paymentMethodCards.forEach(card => {
		card.addEventListener('click', () => {
			// Remove selected class from all cards
			paymentMethodCards.forEach(c => {
				c.classList.remove('border-primary-teal', 'bg-light-mint');
				c.classList.add('border-gray-200');
			});
			// Add selected class to clicked card
			card.classList.add('border-primary-teal', 'bg-light-mint');
			card.classList.remove('border-gray-200');
		});
	});
	
	// Format card number input (add spaces every 4 digits)
	const cardNumberInput = document.getElementById('cardNumber');
	if (cardNumberInput) {
		cardNumberInput.addEventListener('input', function(e) {
			let value = e.target.value.replace(/\s/g, '');
			let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
			if (formattedValue.length <= 19) {
				e.target.value = formattedValue;
			}
		});
	}
	
	// Format expiry date input (MM/YY)
	const expiryDateInput = document.getElementById('expiryDate');
	if (expiryDateInput) {
		expiryDateInput.addEventListener('input', function(e) {
			let value = e.target.value.replace(/\D/g, '');
			if (value.length >= 2) {
				value = value.substring(0, 2) + '/' + value.substring(2, 4);
			}
			e.target.value = value;
		});
	}
	

	// Initialize progress steps on load
	updateProgressSteps(0);
});