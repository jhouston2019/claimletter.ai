import { getSupabaseAdmin } from "./_supabase.js";

export async function handler(event) {
  const authHeader = event.headers.authorization || "";
  const ADMIN_KEY = process.env.ADMIN_KEY;
  if (authHeader !== `Bearer ${ADMIN_KEY}`) {
    return { statusCode: 403, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("cla_letters")
      .select("id, created_at, user_email, stripe_payment_status, price_id, status, summary")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ records: data || [] }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}