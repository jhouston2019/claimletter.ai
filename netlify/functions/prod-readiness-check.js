import fetch from 'node-fetch';
import OpenAI from 'openai';
import Stripe from 'stripe';
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';

const REQUIRED_VARS = [
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_PUBLIC_KEY', // or STRIPE_PUBLISHABLE_KEY
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_RESPONSE',
  'STRIPE_WEBHOOK_SECRET',
  'SENDGRID_API_KEY',
  'SITE_URL',
  'ENVIRONMENT',
];

function logEnvCheck() {
  const results = {};
  const logs = [];
  for (const key of REQUIRED_VARS) {
    // Check for alternative names (STRIPE_PUBLIC_KEY vs STRIPE_PUBLISHABLE_KEY)
    let present = Boolean(process.env[key] && String(process.env[key]).trim().length > 0);
    if (!present && key === 'STRIPE_PUBLIC_KEY') {
      present = Boolean(process.env.STRIPE_PUBLISHABLE_KEY && String(process.env.STRIPE_PUBLISHABLE_KEY).trim().length > 0);
    }
    results[key] = present;
    logs.push(`${present ? '✅' : '❌'} ${present ? 'Found' : 'Missing'} ${key}`);
  }
  return { results, logs };
}

function hrTimeMs(start) {
  const now = typeof performance !== 'undefined' && performance.now 
    ? performance.now() 
    : Date.now();
  return Math.round(now - start);
}

async function checkOpenAI() {
  const start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Generate a sample sentence.' },
      ],
      max_tokens: 20,
    });
    const ok = Boolean(res && res.choices && res.choices[0]?.message?.content);
    return { ok, ms: hrTimeMs(start), detail: ok ? undefined : 'No content in response' };
  } catch (err) {
    return { ok: false, ms: hrTimeMs(start), detail: err?.message || String(err) };
  }
}

async function checkSupabase() {
  const start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    // Attempt to insert into system_check; if table doesn't exist, fallback to a lightweight select on documents
    const insert = await supabase.from('system_check').insert({ status: 'ok', created_at: new Date().toISOString() }).select();
    if (insert.error) {
      // If missing table, perform a connectivity sanity check
      if (/relation .* does not exist/i.test(insert.error.message) || insert.error.code === '42P01') {
        const probe = await supabase.from('documents').select('*').limit(1);
        if (probe.error) {
          return { ok: false, ms: hrTimeMs(start), detail: `Connectivity ok but table missing and probe failed: ${probe.error.message}` };
        }
        return { ok: true, ms: hrTimeMs(start), detail: 'system_check table missing; connectivity verified via documents' };
      }
      return { ok: false, ms: hrTimeMs(start), detail: insert.error.message };
    }
    return { ok: true, ms: hrTimeMs(start) };
  } catch (err) {
    return { ok: false, ms: hrTimeMs(start), detail: err?.message || String(err) };
  }
}

async function checkStripe() {
  const start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const priceId = process.env.STRIPE_PRICE_RESPONSE;
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    const ok = Boolean(price && price.id === priceId && (price.product && (typeof price.product === 'object')));
    return { ok, ms: hrTimeMs(start), detail: ok ? undefined : 'Price not found or invalid product' };
  } catch (err) {
    return { ok: false, ms: hrTimeMs(start), detail: err?.message || String(err) };
  }
}

async function checkSendGrid() {
  const start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // Use sandbox mode to avoid sending
    const msg = {
      to: 'sandbox@example.com',
      from: 'sandbox@example.com',
      subject: 'Readiness Check',
      text: 'This is a dry-run check.',
      mailSettings: { sandboxMode: { enable: true } },
    };
    await sgMail.send(msg);
    return { ok: true, ms: hrTimeMs(start), detail: 'Email API reachable' };
  } catch (err) {
    return { ok: false, ms: hrTimeMs(start), detail: err?.message || String(err) };
  }
}

async function checkSiteUrl() {
  const start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  try {
    const url = process.env.SITE_URL;
    const res = await fetch(url, { method: 'GET' });
    const ok = res.ok;
    return { ok, ms: hrTimeMs(start), detail: ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, ms: hrTimeMs(start), detail: err?.message || String(err) };
  }
}

function printReport(envStatus, checks) {
  const missingKeys = Object.entries(envStatus)
    .filter(([, present]) => !present)
    .map(([k]) => k);

  const report = {
    summary: {},
    checks: {},
    missingKeys,
    allPassed: false,
  };

  for (const [name, result] of Object.entries(checks)) {
    report.checks[name] = {
      status: result.ok ? '✅' : '❌',
      time: typeof result.ms === 'number' ? `${result.ms} ms` : 'n/a',
      detail: result.detail || undefined,
    };
  }

  report.allPassed = missingKeys.length === 0 && Object.values(checks).every(r => r.ok);

  return report;
}

export async function handler(event) {
  try {
    // 1) Env checks
    const { results: envStatus, logs: envLogs } = logEnvCheck();

    // 3) Integration checks
    const [openai, supabase, stripe, sendgrid, site] = await Promise.all([
      checkOpenAI(),
      checkSupabase(),
      checkStripe(),
      checkSendGrid(),
      checkSiteUrl(),
    ]);

    // 4) Report
    const checks = {
      'OpenAI': openai,
      'Supabase': supabase,
      'Stripe': stripe,
      'SendGrid': sendgrid,
      'SITE_URL': site,
    };
    
    const report = printReport(envStatus, checks);

    // Format console-friendly output
    let consoleOutput = '\n=== Production Readiness Check ===\n\n';
    consoleOutput += 'Environment Variables:\n';
    envLogs.forEach(log => consoleOutput += `  ${log}\n`);
    consoleOutput += '\nIntegration Checks:\n';
    Object.entries(report.checks).forEach(([name, check]) => {
      consoleOutput += `  ${check.status} ${name}: ${check.time}${check.detail ? ` - ${check.detail}` : ''}\n`;
    });
    if (report.missingKeys.length > 0) {
      consoleOutput += `\nMissing or invalid environment keys: ${report.missingKeys.join(', ')}\n`;
    }
    consoleOutput += `\n${report.allPassed 
      ? '✅ All environment variables and integrations are working — ready for production deploy.'
      : '❌ Not ready: See above failures or missing keys.'}\n`;

    return {
      statusCode: report.allPassed ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        envChecks: envLogs,
        integrations: report.checks,
        missingKeys: report.missingKeys,
        allPassed: report.allPassed,
        message: report.allPassed 
          ? '✅ All environment variables and integrations are working — ready for production deploy.'
          : '❌ Not ready: See above failures or missing keys.',
        consoleOutput, // Include formatted console output for easy reading
      }, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Unexpected error running readiness check',
        details: error.message,
      }),
    };
  }
}

