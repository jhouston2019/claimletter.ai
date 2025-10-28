import sgMail from '@sendgrid/mail';
import { getSupabaseAdmin } from './_supabase.js';
import PDFDocument from 'pdfkit';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function handler(event) {
  try {
    const { recordId, to } = JSON.parse(event.body || '{}');
    if (!recordId || !to) return { statusCode: 400, body: 'Missing params' };

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('cla_letters').select('ai_response').eq('id', recordId).single();
    if (error || !data) throw error || new Error('No record');

    // Generate PDF buffer
    const doc = new PDFDocument(); 
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.text(data.ai_response, { align: 'left' }); 
    doc.end();
    const pdfBuffer = await new Promise(res => doc.on('end', () => res(Buffer.concat(buffers))));

    const msg = {
      to,
      from: process.env.SUPPORT_EMAIL,
      subject: 'Your Insurance Appeal Letter is Ready',
      text: 'Attached is your AI-generated insurance appeal letter PDF.',
      html: `
        <h2>Your Insurance Appeal Letter is Ready</h2>
        <p>Thank you for using ClaimLetterAI! Your AI-generated appeal letter is attached as a PDF.</p>
        <p>Please review the letter carefully before sending it to your insurance company. Remember to consult with an insurance attorney for complex matters.</p>
        <p>Best regards,<br>The ClaimLetterAI Team</p>
      `,
      attachments: [{
        content: pdfBuffer.toString('base64'),
        filename: 'Insurance_Appeal.pdf',
        type: 'application/pdf',
        disposition: 'attachment'
      }]
    };

    await sgMail.send(msg);
    return { 
      statusCode: 200, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Email sent' 
    };
  } catch (e) { 
    return { 
      statusCode: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: e.message 
    }; 
  }
}
