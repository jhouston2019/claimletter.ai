import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  try {
    // Debug: Check environment variables
    console.log('SITE_URL:', process.env.SITE_URL);
    console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing');
    console.log('STRIPE_PRICE_RESPONSE:', process.env.STRIPE_PRICE_RESPONSE);
    
    const { recordId = null } = JSON.parse(event.body || "{}"); // send from client if available
    const priceId = process.env.STRIPE_PRICE_RESPONSE || "price_79USD_single";
    
    // Validate required environment variables
    if (!process.env.SITE_URL) {
      throw new Error('SITE_URL environment variable is not set');
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ 
        price: priceId, 
        quantity: 1 
      }],
      mode: 'payment',
      success_url: `${process.env.SITE_URL}/thank-you.html`,
      cancel_url: `${process.env.SITE_URL}/pricing.html`,
      metadata: recordId ? { recordId } : { plan: 'single' }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ url: session.url })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to create checkout session',
        details: error.message 
      })
    };
  }
}
