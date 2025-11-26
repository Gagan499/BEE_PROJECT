import nodemailer from "nodemailer";
import chalk from "chalk";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.Email_User,
    pass: process.env.Email_Pass_Key,
  },
});


export async function DefaultEmail(email, bookingData = {}) {
  try {
    if (!email) {
      console.error(chalk.red("Email is required for DefaultEmail"));
      return; // Don't send response, just return
    }

    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const bookingType = bookingData.bookingType === 'package' ? 'Package' : 'Stay Only';
    const bookingName = bookingData.packageName || bookingData.hotelName || 'Your Booking';
    const nights = bookingData.arrivalDate && bookingData.departureDate ? 
      Math.ceil((new Date(bookingData.departureDate) - new Date(bookingData.arrivalDate)) / (1000 * 60 * 60 * 24)) : 0;

    const mailOptions = {
      from: process.env.Email_User,
      to: email,
      subject: "Booking Request Received - Palm Ways",
      text: `Dear ${bookingData.name || 'Valued Guest'},

Thank you for your booking request with Palm Ways Luxury Resort & Spa!

BOOKING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Booking Type: ${bookingType}
${bookingData.bookingType === 'package' ? `Package: ${bookingData.packageName || 'N/A'}` : `Hotel: ${bookingData.hotelName || 'N/A'}`}
Check-in Date: ${formatDate(bookingData.arrivalDate)}
Check-out Date: ${formatDate(bookingData.departureDate)}
Duration: ${nights} night(s)
Guests: ${bookingData.adults || 0} adult(s)${bookingData.children > 0 ? `, ${bookingData.children} child(ren)` : ''}
${bookingData.totalAmount ? `Total Amount: $${bookingData.totalAmount.toFixed(2)}` : ''}
${bookingData.specialRequests ? `Special Requests: ${bookingData.specialRequests}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your booking request is currently pending approval. We will review your request and send you a confirmation email within 24 hours.

If you have any questions or need to make changes, please contact us at:
📧 Email: info@palmways.com
📞 Phone: +1 (234) 567-890

We look forward to welcoming you to Palm Ways!

Best regards,
The Palm Ways Team
Luxury Resort & Spa`,
    };

    await transporter.sendMail(mailOptions);

    console.log(chalk.green(`Default Email sent to ${email}`));
    // Don't send response - let the calling route handle it

  } catch (err) {
    console.error(chalk.red("Error sending email:", err));
    // Don't send response - just log the error
    // The booking will still be created even if email fails
  }
}


export async function AcceptRequestEmail(email, bookingData = {}){
    try {
        if (!email) {
      console.error(chalk.red("Email is required for AcceptRequestEmail"));
      return; // Don't send response, just return
    }

    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const bookingType = bookingData.bookingType === 'package' ? 'Package' : 'Stay Only';
    const bookingName = bookingData.packageName || bookingData.hotelName || 'Your Booking';
    const nights = bookingData.arrivalDate && bookingData.departureDate ? 
      Math.ceil((new Date(bookingData.departureDate) - new Date(bookingData.arrivalDate)) / (1000 * 60 * 60 * 24)) : 0;

    const mailOptions = {
        from: process.env.Email_User,
        to: email,
        subject: "🎉 Booking Approved - Palm Ways",
        text: `Dear ${bookingData.name || 'Valued Guest'},

We are delighted to inform you that your booking request has been APPROVED! ✅

CONFIRMED BOOKING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Booking Type: ${bookingType}
${bookingData.bookingType === 'package' ? `Package: ${bookingData.packageName || 'N/A'}` : `Hotel: ${bookingData.hotelName || 'N/A'}`}
Check-in Date: ${formatDate(bookingData.arrivalDate)}
Check-out Date: ${formatDate(bookingData.departureDate)}
Duration: ${nights} night(s)
Guests: ${bookingData.adults || 0} adult(s)${bookingData.children > 0 ? `, ${bookingData.children} child(ren)` : ''}
${bookingData.totalAmount ? `Total Amount: $${bookingData.totalAmount.toFixed(2)}` : ''}
${bookingData.specialRequests ? `Special Requests: ${bookingData.specialRequests}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your booking is now confirmed! We are excited to welcome you to Palm Ways Luxury Resort & Spa.

IMPORTANT INFORMATION:
• Check-in time: 3:00 PM
• Check-out time: 11:00 AM
• Free cancellation up to 24 hours before check-in
• For any changes or questions, please contact us at least 48 hours before your arrival

CONTACT INFORMATION:
📧 Email: info@palmways.com
📞 Phone: +1 (234) 567-890
📍 Address: 123 Paradise Beach Road, Tropical Island, PI 12345

We look forward to providing you with an unforgettable luxury experience!

Best regards,
The Palm Ways Team
Luxury Resort & Spa`,
        };

    await transporter.sendMail(mailOptions);

    console.log(chalk.green(`Acceptance Email sent to ${email}`));
    // Don't send response - let the calling route handle it
    } catch (err) {
        console.error(chalk.red("Error sending accepting email: ",err));
        // Don't send response - just log the error
    }
}

export async function RejectRequestEmail(email, bookingData = {}){
    try {
        if (!email) {
      console.error(chalk.red("Email is required for RejectRequestEmail"));
      return; // Don't send response, just return
    }

    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const bookingType = bookingData.bookingType === 'package' ? 'Package' : 'Stay Only';
    const bookingName = bookingData.packageName || bookingData.hotelName || 'Your Booking';

 const mailOptions = {
      from: process.env.Email_User,
      to: email,
      subject: "Booking Request Update - Palm Ways",
      text: `Dear ${bookingData.name || 'Valued Guest'},

We regret to inform you that we are unable to accommodate your booking request at this time.

BOOKING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Booking Type: ${bookingType}
${bookingData.bookingType === 'package' ? `Package: ${bookingData.packageName || 'N/A'}` : `Hotel: ${bookingData.hotelName || 'N/A'}`}
Requested Check-in: ${formatDate(bookingData.arrivalDate)}
Requested Check-out: ${formatDate(bookingData.departureDate)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We apologize for any inconvenience this may cause. This could be due to:
• Unavailability for the requested dates
• Capacity constraints
• Other operational considerations

We encourage you to:
• Try alternative dates
• Contact us for available options
• Explore our other packages and accommodations

Our team is here to help you find the perfect alternative. Please don't hesitate to reach out to us:

CONTACT INFORMATION:
📧 Email: info@palmways.com
📞 Phone: +1 (234) 567-890

We hope to welcome you to Palm Ways in the future!

Best regards,
The Palm Ways Team
Luxury Resort & Spa`
    };

    await transporter.sendMail(mailOptions);

    console.log(chalk.green(`Rejecting Email sent to ${email}`));
    // Don't send response - let the calling route handle it
    } catch (err) {
        console.error(chalk.red("Error sending rejecting email: ",err));
        // Don't send response - just log the error
    }
}
