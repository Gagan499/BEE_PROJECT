import { VerifaliaRestClient, AuthenticationError } from "verifalia";
import dotenv from "dotenv";

dotenv.config();

// Initialize Verifalia client (lazy initialization)
let verifaliaClient = null;
let authenticationErrorLogged = false;

function getVerifaliaClient() {
  if (!verifaliaClient) {
    // Check if Verifalia credentials are configured
    if (!process.env.VERIFALIA_USERNAME || !process.env.VERIFALIA_PASSWORD) {
      return null;
    }

    verifaliaClient = new VerifaliaRestClient({
      username: process.env.VERIFALIA_USERNAME,
      password: process.env.VERIFALIA_PASSWORD,
    });
  }
  return verifaliaClient;
}

/**
 * Validates an email address using Verifalia API
 * @param {string} email - The email address to validate
 * @returns {Promise<{isValid: boolean, result: object|null, error: string|null}>}
 */
export async function validateEmail(email) {
  try {
    if (!email || typeof email !== "string") {
      return {
        isValid: false,
        result: null,
        error: "Email is required and must be a string",
      };
    }

    const client = getVerifaliaClient();
    
    // If Verifalia is not configured, skip validation
    if (!client) {
      console.warn("Verifalia credentials not configured. Skipping email validation.");
      return {
        isValid: true, // Allow email if Verifalia is not configured
        result: null,
        error: null,
      };
    }

    // Submit email for validation (the library automatically waits for completion)
    const result = await client.emailValidations.submit(email);

    // Get the first entry (since we're validating a single email)
    const entry = result.entries[0];

    // Check validation result
    // Deliverable = email is valid and deliverable
    // Risky = email might be deliverable but has some risk factors
    // Undeliverable = email is not deliverable
    // Invalid = email format is invalid
    const isValid =
      entry.classification === "Deliverable" ||
      entry.classification === "Risky";

    return {
      isValid,
      result: {
        classification: entry.classification,
        status: entry.status,
        isDisposableEmailAddress: entry.isDisposableEmailAddress || false,
        isRoleAccount: entry.isRoleAccount || false,
        isFreeEmailAddress: entry.isFreeEmailAddress || false,
        emailAddress: entry.emailAddress,
      },
      error: null,
    };
  } catch (error) {
    // Handle authentication errors specifically
    if (error instanceof AuthenticationError) {
      // Log authentication error only once to avoid spam
      if (!authenticationErrorLogged) {
        console.error("===========================================");
        console.error("VERIFALIA AUTHENTICATION ERROR");
        console.error("===========================================");
        console.error("Invalid Verifalia credentials detected.");
        console.error("Please check your .env file and ensure:");
        console.error("  1. VERIFALIA_USERNAME is set correctly");
        console.error("  2. VERIFALIA_PASSWORD is set correctly");
        console.error("  3. Your Verifalia account is active");
        console.error("  4. Your IP address is not blocked");
        console.error("===========================================");
        authenticationErrorLogged = true;
      }
      
      // Skip validation if authentication fails (don't block users)
      // But log that validation is being skipped
      console.warn(`Skipping email validation for "${email}" due to authentication error.`);
      return {
        isValid: true,
        result: null,
        error: "Email validation service authentication failed - validation skipped",
      };
    }
    
    // Handle other errors (network issues, service unavailable, etc.)
    console.error("Error validating email with Verifalia:", error.message || error);
    // Return valid by default if there's an API error to avoid blocking users
    // In production, you might want to handle this differently
    return {
      isValid: true,
      result: null,
      error: error.message || "Email validation service unavailable",
    };
  }
}

/**
 * Validates multiple email addresses
 * @param {string[]} emails - Array of email addresses to validate
 * @returns {Promise<Array>} Array of validation results
 */
export async function validateEmails(emails) {
  if (!Array.isArray(emails)) {
    throw new Error("Emails must be an array");
  }

  const results = await Promise.all(
    emails.map((email) => validateEmail(email))
  );

  return results;
}

/**
 * Test Verifalia credentials by attempting to validate a test email
 * Useful for debugging authentication issues
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function testVerifaliaCredentials() {
  try {
    const client = getVerifaliaClient();
    
    if (!client) {
      return {
        success: false,
        message: "Verifalia credentials not configured. Please set VERIFALIA_USERNAME and VERIFALIA_PASSWORD in your .env file.",
      };
    }

    // Try to validate a test email (this will fail authentication if credentials are wrong)
    await client.emailValidations.submit("test@example.com");
    
    return {
      success: true,
      message: "Verifalia credentials are valid and working correctly!",
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return {
        success: false,
        message: `Authentication failed: ${error.message}. Please check your VERIFALIA_USERNAME and VERIFALIA_PASSWORD in your .env file.`,
      };
    }
    
    return {
      success: false,
      message: `Error testing credentials: ${error.message}`,
    };
  }
}

