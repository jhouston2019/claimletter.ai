import Stripe from "stripe";
import { buffer } from "micro";
import { getSupabaseAdmin } from "./_supabase.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { path: "/.netlify/functions/stripe-webhook" };

export async function handler(event) {
  try {
    const sig = event.headers["stripe-signature"];
    const rawBody = event.isBase64Encoded ? Buffer.from(event.body, "base64") : Buffer.from(event.body || "");
    let evt;

    try {
      evt = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    if (evt.type === "checkout.session.completed") {
      const session = evt.data.object;
      const recordId = session.metadata?.recordId || null;

      if (recordId) {
        const supabase = getSupabaseAdmin();
        await supabase
          .from("cla_letters")
          .update({
            stripe_session_id: session.id,
            stripe_payment_status: session.payment_status,
          })
          .eq("id", recordId);
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
}