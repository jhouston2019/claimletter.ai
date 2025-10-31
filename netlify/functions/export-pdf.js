import PDFDocument from 'pdfkit';
import { getSupabaseAdmin } from './_supabase.js';

export async function handler(event) {
  try {
    const { recordId } = JSON.parse(event.body || '{}');
    if (!recordId) return { statusCode: 400, body: 'Missing recordId' };

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('cla_letters').select('ai_response').eq('id', recordId).single();
    if (error || !data) throw error || new Error('No record');

    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});
    doc.fontSize(14).text(data.ai_response, { align: 'left' });
    doc.end();
    const pdfBuffer = await new Promise(res => doc.on('end', () => res(Buffer.concat(buffers))));
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="IRS_Response.pdf"',
        'Access-Control-Allow-Origin': '*'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    return { 
      statusCode: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: e.message 
    };
  }
}
