import fetch from 'node-fetch';
import OpenAI from 'openai';
import Stripe from 'stripe';
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';

const REQUIRED_VARS = [
	'OPENAI_API_KEY',
	'SUPABASE_URL',
	'SUPABASE_SERVICE_ROLE_KEY',
	'STRIPE_PUBLISHABLE_KEY',
	'STRIPE_SECRET_KEY',
	'STRIPE_PRICE_RESPONSE',
	'STRIPE_WEBHOOK_SECRET',
	'SENDGRID_API_KEY',
	'SITE_URL',
	'ENVIRONMENT',
];

function logEnvCheck() {
	const results = {};
	for (const key of REQUIRED_VARS) {
		const present = Boolean(process.env[key] && String(process.env[key]).trim().length > 0);
		results[key] = present;
		console.log(`${present ? '✅' : '❌'} ${present ? 'Found' : 'Missing'} ${key}`);
	}
	return results;
}

function hrTimeMs(start) {
	return Math.round((performance.now() - start));
}

async function checkOpenAI() {
	const start = performance.now();
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
	const start = performance.now();
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
	const start = performance.now();
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
	const start = performance.now();
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
	const start = performance.now();
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

	console.log('\n--- Production Readiness Report ---');
	for (const [name, result] of Object.entries(checks)) {
		const status = result.ok ? '✅' : '❌';
		const time = typeof result.ms === 'number' ? `${result.ms} ms` : 'n/a';
		const detail = result.detail ? ` - ${result.detail}` : '';
		console.log(`${status} ${name}: ${time}${detail}`);
	}

	if (missingKeys.length > 0) {
		console.log(`\nMissing or invalid environment keys: ${missingKeys.join(', ')}`);
	}

	const allOk = missingKeys.length === 0 && Object.values(checks).every(r => r.ok);
	if (allOk) {
		console.log('\n✅ All environment variables and integrations are working — ready for production deploy.');
	} else {
		console.log('\n❌ Not ready: See above failures or missing keys.');
	}
}

async function main() {
	// 1) Env checks
	const envStatus = logEnvCheck();

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
	printReport(envStatus, checks);
}

// Node 18+ has global performance; ensure availability
if (typeof globalThis.performance === 'undefined') {
	const { performance } = await import('node:perf_hooks');
	// eslint-disable-next-line no-global-assign
	globalThis.performance = performance;
}

console.log('\n📝 Note: This script checks local environment variables.');
console.log('Since your environment variables are in Netlify, you have two options:\n');
console.log('1. Use the Netlify function endpoint (recommended):');
console.log('   - Deploy to Netlify, then visit:');
console.log('     https://your-site.netlify.app/.netlify/functions/prod-readiness-check');
console.log('   - Or use Netlify CLI:');
console.log('     npx netlify functions:invoke prod-readiness-check\n');
console.log('2. Use Netlify Dev (loads env vars from Netlify):');
console.log('   npx netlify dev');
console.log('   Then visit: http://localhost:8888/.netlify/functions/prod-readiness-check\n');
console.log('--- Running local check (will show missing vars if not in .env) ---\n');

main().catch(err => {
	console.error('Unexpected error running readiness check:', err);
	process.exitCode = 1;
});


