export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendMailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log('----------------------------------------------------');
    console.log(`[MOCK MAIL SENDER] (No RESEND_API_KEY configured)`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content HTML:\n${html}`);
    console.log('----------------------------------------------------');
    return { success: true, id: 'mock-mail-' + Math.random().toString(36).substring(2, 9) };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Synap <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Resend API returned an error');
    }

    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('Failed to send email via Resend:', err);
    return { success: false, error: err.message || 'Email sending failed' };
  }
}
