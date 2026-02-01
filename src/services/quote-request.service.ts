// ============================================================================
// QUOTE REQUEST SERVICE
// ============================================================================
// Handles quote requests: uploads PDF to storage and sends email notification
// Uses Web3Forms (free, unlimited) for email delivery
// ============================================================================

import { supabase } from '../utils/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteRequestData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  pdfFile?: File;
}

export interface QuoteRequestResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// WEB3FORMS CONFIGURATION
// ============================================================================

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

// Signed URL expiry (30 days in seconds)
const SIGNED_URL_EXPIRY = 30 * 24 * 60 * 60;

// ============================================================================
// UPLOAD PDF TO STORAGE
// ============================================================================

const uploadQuotePDF = async (
  file: File,
  requestId: string
): Promise<string | null> => {
  try {
    // Create file path: quotes/{requestId}/{original_filename}
    const filePath = `${requestId}/${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('quotes')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading quote PDF:', uploadError);
      return null;
    }

    // Get signed URL (valid for 30 days)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('quotes')
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', signedUrlError);
      return null;
    }

    console.log(`Quote PDF uploaded successfully: ${filePath}`);
    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('Error in uploadQuotePDF:', error);
    return null;
  }
};

// ============================================================================
// SUBMIT QUOTE REQUEST (Using Web3Forms)
// ============================================================================

export const submitQuoteRequest = async (
  data: QuoteRequestData
): Promise<QuoteRequestResult> => {
  try {
    // Generate a unique request ID
    const requestId = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Upload PDF if provided
    let pdfUrl: string | null = null;
    if (data.pdfFile) {
      pdfUrl = await uploadQuotePDF(data.pdfFile, requestId);
    }

    // Check if Web3Forms is configured
    if (!WEB3FORMS_ACCESS_KEY) {
      console.error('Web3Forms access key not configured');
      return { success: false, error: 'Email service not configured. Please try again later.' };
    }

    // Prepare form data for Web3Forms
    const formData = new FormData();
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `New Quote Request from ${data.name} - ThreadCart`);
    formData.append('from_name', 'ThreadCart Quote Request');

    // Build email body
    const emailBody = `
NEW QUOTE REQUEST
==================

Request ID: ${requestId}

CUSTOMER DETAILS:
- Name: ${data.name}
- Email: ${data.email}
- Phone: ${data.phone || 'Not provided'}

MESSAGE/REQUIREMENTS:
${data.message}

ATTACHMENT:
${pdfUrl ? `PDF Document: ${pdfUrl}` : 'No file attached'}

---
This quote request was submitted via ThreadCart website.
    `.trim();

    formData.append('message', emailBody);
    formData.append('Customer Name', data.name);
    formData.append('Customer Email', data.email);
    formData.append('Customer Phone', data.phone || 'Not provided');
    formData.append('Request ID', requestId);

    if (pdfUrl) {
      formData.append('PDF Attachment URL', pdfUrl);
    }

    // Reply-to customer email
    formData.append('replyto', data.email);

    // Send to Web3Forms
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      console.log(`Quote request submitted successfully: ${requestId}`);
      return { success: true };
    } else {
      console.error('Web3Forms error:', result);
      return { success: false, error: result.message || 'Failed to submit request.' };
    }
  } catch (error) {
    console.error('Error submitting quote request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit request. Please try again.',
    };
  }
};

// ============================================================================
// CHECK IF QUOTE SERVICE IS CONFIGURED
// ============================================================================

export const isQuoteServiceConfigured = (): boolean => {
  return Boolean(WEB3FORMS_ACCESS_KEY);
};
