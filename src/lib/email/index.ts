export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailPayload): Promise<{ success: boolean; id?: string }> {
  const driver = process.env.EMAIL_DRIVER || 'console';

  if (driver === 'console' || process.env.NODE_ENV === 'development') {
    console.log('================ EMAIL TRANSACTIONAL SIMULATOR ================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content HTML:\n${html}`);
    console.log('================================================================');
    return { success: true, id: `mock-${Date.now()}` };
  }

  if (driver === 'resend' && process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Webstore <noreply@webstore.local>',
          to,
          subject,
          html,
          text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email via Resend API');
      }

      return { success: true, id: data.id };
    } catch (err) {
      console.error('Failed sending transactional email via Resend:', err);
      return { success: false };
    }
  }

  return { success: true, id: `fallback-${Date.now()}` };
}
