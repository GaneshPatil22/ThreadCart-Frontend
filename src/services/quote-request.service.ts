// ============================================================================
// QUOTE REQUEST SERVICE
// ============================================================================
// Handles quote requests: uploads an attachment (PDF or image) to storage and
// sends email notification via Web3Forms. When invoked with productContext,
// the email is tagged as a Bulk Quote Request and carries the product details.
// ============================================================================

import { supabase } from '../utils/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteProductContext {
  productId: number;
  productName: string;
  partNumber?: string | null;
  price?: number;
}

export interface QuoteRequestData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  attachmentFile?: File;
  productContext?: QuoteProductContext;
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
// UPLOAD ATTACHMENT TO STORAGE
// ============================================================================

const uploadQuoteAttachment = async (
  file: File,
  requestId: string
): Promise<string | null> => {
  try {
    // Create file path: quotes/{requestId}/{original_filename}
    const filePath = `${requestId}/${file.name}`;

    // Upload to Supabase Storage. contentType is taken from the File itself so
    // PDFs and images are stored with the right MIME for inline browser preview.
    const { error: uploadError } = await supabase.storage
      .from('quotes')
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading quote attachment:', uploadError);
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

    console.log(`Quote attachment uploaded successfully: ${filePath}`);
    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('Error in uploadQuoteAttachment:', error);
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

    // Upload attachment if provided
    let attachmentUrl: string | null = null;
    let attachmentMime: string | null = null;
    if (data.attachmentFile) {
      attachmentUrl = await uploadQuoteAttachment(data.attachmentFile, requestId);
      attachmentMime = data.attachmentFile.type || null;
    }

    // Check if Web3Forms is configured
    if (!WEB3FORMS_ACCESS_KEY) {
      console.error('Web3Forms access key not configured');
      return { success: false, error: 'Email service not configured. Please try again later.' };
    }

    const isBulkQuote = Boolean(data.productContext);

    // Prepare form data for Web3Forms
    const formData = new FormData();
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append(
      'subject',
      isBulkQuote
        ? `New Bulk Quote Request: ${data.productContext!.productName} - from ${data.name}`
        : `New Quote Request from ${data.name} - ThreadCart`
    );
    formData.append('from_name', isBulkQuote ? 'ThreadCart Bulk Quote Request' : 'ThreadCart Quote Request');

    // Build product context block (for bulk quotes)
    const productBlock = data.productContext
      ? `
PRODUCT DETAILS:
- Product Name: ${data.productContext.productName}
- Product ID: ${data.productContext.productId}
- Part Number: ${data.productContext.partNumber || 'N/A'}
- Listed Price: ${data.productContext.price !== undefined ? `₹${data.productContext.price}` : 'N/A'}
`
      : '';

    // Build email body
    const emailBody = `
${isBulkQuote ? 'NEW BULK QUOTE REQUEST' : 'NEW QUOTE REQUEST'}
==================

Request ID: ${requestId}
${productBlock}
CUSTOMER DETAILS:
- Name: ${data.name}
- Email: ${data.email}
- Phone: ${data.phone || 'Not provided'}

MESSAGE/REQUIREMENTS:
${data.message}

ATTACHMENT:
${attachmentUrl ? `${attachmentMime || 'File'}: ${attachmentUrl}` : 'No file attached'}

---
This ${isBulkQuote ? 'bulk quote' : 'quote'} request was submitted via ThreadCart website.
    `.trim();

    formData.append('message', emailBody);
    formData.append('Customer Name', data.name);
    formData.append('Customer Email', data.email);
    formData.append('Customer Phone', data.phone || 'Not provided');
    formData.append('Request ID', requestId);

    if (data.productContext) {
      formData.append('Product Name', data.productContext.productName);
      formData.append('Product ID', String(data.productContext.productId));
      formData.append('Part Number', data.productContext.partNumber || 'N/A');
      if (data.productContext.price !== undefined) {
        formData.append('Listed Price', `₹${data.productContext.price}`);
      }
      formData.append('Request Type', 'Bulk Quote');
    } else {
      formData.append('Request Type', 'General Quote');
    }

    if (attachmentUrl) {
      formData.append('Attachment URL', attachmentUrl);
      if (attachmentMime) formData.append('Attachment Type', attachmentMime);
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
