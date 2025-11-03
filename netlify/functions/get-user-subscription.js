import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  try {
    const { userId } = JSON.parse(event.body);
    
    // Get user's current subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Get usage count for current period
    let usageCount = 0;
    if (subscription) {
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', subscription.current_period_start)
        .lte('created_at', subscription.current_period_end);
      
      usageCount = usage?.length || 0;
    }

    // Get plan limits
    const planLimits = getPlanLimits(subscription?.plan_type || 'FREE');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        subscription: subscription || null,
        usage: {
          current: usageCount,
          limit: planLimits.lettersPerMonth,
          remaining: Math.max(0, planLimits.lettersPerMonth - usageCount)
        },
        planLimits
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to get subscription',
        details: error.message 
      })
    };
  }
}

function getPlanLimits(planType) {
  const limits = {
    'FREE': {
      lettersPerMonth: 0,
      features: ['basic_analysis'],
      price: 0
    },
    'STANDARD': {
      lettersPerMonth: 1,
      features: ['analysis', 'response_generation', 'pdf_download', 'docx_download'],
      price: 79
    },
    'COMPLEX': {
      lettersPerMonth: 1,
      features: ['analysis', 'response_generation', 'pdf_download', 'docx_download', 'priority_processing'],
      price: 99
    },
    'STARTER': {
      lettersPerMonth: 1,
      features: ['analysis', 'response_generation', 'pdf_download'],
      price: 19
    },
    'PRO': {
      lettersPerMonth: 3,
      features: ['analysis', 'response_generation', 'pdf_download', 'docx_download', 'email_support'],
      price: 79
    },
    'PROPLUS': {
      lettersPerMonth: -1, // unlimited
      features: ['analysis', 'response_generation', 'pdf_download', 'docx_download', 'phone_support', 'audit_prep'],
      price: 99
    }
  };
  
  return limits[planType] || limits['FREE'];
}
