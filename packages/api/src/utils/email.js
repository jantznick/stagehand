import { Resend } from 'resend';
import * as React from 'react';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, react }) => {
  // 1. Input validation
  if (!to || !subject || !react) {
    console.warn('Missing required email parameters:', { to, subject, react });
    return { success: false, error: 'Missing required email parameters: to, subject, or react' };
  }

  // 2. Check for Resend API key
  if (!process.env.RESEND_API_KEY) {
    const errorMessage = `RESEND_API_KEY is not set. Email to "${to}" with subject "${subject}" was not sent.`;
    
    // 3. Environment-based handling
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv === 'production' || nodeEnv === 'prod') {
      console.error(errorMessage);
      throw new Error('Email service is not configured. RESEND_API_KEY is missing in production.');
    } else {
      console.log(errorMessage);
      return { success: false, error: 'Email service not configured. Check logs for details.' };
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Stagehand <donotreply@mail.stagehand.creativeendurancelab.com>', // TODO: This should be a configured domain
      to,
      subject,
      react,
    });

    if (error) {
      console.error('Resend API error sending email:', error);
      // 5. Consistent return structure (already in place)
      return { success: false, error: error.message || 'Unknown Resend API error' };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    // 4. Enhance logging in catch block
    console.error('An unexpected error occurred while sending email to:', to, 'Subject:', subject, error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};