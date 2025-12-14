// ============================================================================
// CONTACT FORM SERVICE
// ============================================================================
// Handles contact form submissions - stores in Supabase and sends email
// ============================================================================

import { supabase } from '../utils/supabase';
import emailjs from '@emailjs/browser';

// ============================================================================
// TYPES
// ============================================================================

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactSubmission extends ContactFormData {
  id: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EMAILJS CONFIGURATION
// ============================================================================
// Sign up at https://www.emailjs.com/ (free: 200 emails/month)
// 1. Create an account
// 2. Add an email service (Gmail, Outlook, etc.)
// 3. Create an email template with these variables:
//    - {{from_name}} - sender's name
//    - {{from_email}} - sender's email
//    - {{phone}} - sender's phone
//    - {{subject}} - message subject
//    - {{message}} - message content
// 4. Get your Public Key, Service ID, and Template ID
// ============================================================================

const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
};

// ============================================================================
// SUBMIT CONTACT FORM
// ============================================================================

export async function submitContactForm(
  data: ContactFormData
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Store in Supabase database
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          subject: data.subject,
          message: data.message,
        },
      ]);

    if (dbError) {
      console.error('Error storing contact submission:', dbError);
      return {
        success: false,
        message: 'Failed to submit your message. Please try again.',
      };
    }

    // 2. Send email notification (if EmailJS is configured)
    if (EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.templateId && EMAILJS_CONFIG.publicKey) {
      try {
        await emailjs.send(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateId,
          {
            from_name: data.name,
            from_email: data.email,
            phone: data.phone || 'Not provided',
            subject: data.subject,
            message: data.message,
          },
          EMAILJS_CONFIG.publicKey
        );
      } catch (emailError) {
        // Log but don't fail - the submission was stored in DB
        console.error('Error sending email notification:', emailError);
      }
    }

    return {
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
    };
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}

// ============================================================================
// ADMIN: GET ALL SUBMISSIONS (requires admin auth)
// ============================================================================

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contact submissions:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// ADMIN: UPDATE SUBMISSION STATUS
// ============================================================================

export async function updateSubmissionStatus(
  id: string,
  status: ContactSubmission['status']
): Promise<boolean> {
  const { error } = await supabase
    .from('contact_submissions')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating submission status:', error);
    return false;
  }

  return true;
}

// ============================================================================
// ADMIN: DELETE SUBMISSION
// ============================================================================

export async function deleteSubmission(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('contact_submissions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting submission:', error);
    return false;
  }

  return true;
}
