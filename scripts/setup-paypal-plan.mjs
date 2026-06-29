#!/usr/bin/env node
// Run once to create the PayPal product + subscription plans (monthly + annual).
// Usage: PAYPAL_CLIENT_SECRET=xxx node scripts/setup-paypal-plan.mjs
// Prints both Plan IDs to paste into .env

const CLIENT_ID     = process.env.PAYPAL_CLIENT_ID     || 'AW7e40ng8NMKkgeoyI1ggMc2YmOVp3puedlkjB-90qSouRCO7OeVc72RaGqifQMLllFjL9AcFjDV4sTX';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'REPLACE_WITH_SECRET';
const BASE          = 'https://api-m.paypal.com'; // live endpoint

async function getToken() {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token error: ' + JSON.stringify(data));
  return data.access_token;
}

async function createProduct(token) {
  const res = await fetch(`${BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': 'olai-pro-product-' + Date.now(),
    },
    body: JSON.stringify({
      name:        'Olai Pro',
      description: 'Ad-free note-taking with unlimited notes, wikilinks, knowledge graph, and cross-device sync.',
      type:        'SERVICE',
      category:    'SOFTWARE',
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error('Product error: ' + JSON.stringify(data));
  console.log('✓ Product created:', data.id, '— Olai Pro');
  return data.id;
}

async function createMonthlyPlan(token, productId) {
  const res = await fetch(`${BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': 'olai-plan-monthly-' + Date.now(),
    },
    body: JSON.stringify({
      product_id:  productId,
      name:        'Olai Pro — Monthly',
      description: '$7.99 per month. All sales final. No refunds.',
      status:      'ACTIVE',
      billing_cycles: [{
        frequency:      { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type:    'REGULAR',
        sequence:       1,
        total_cycles:   0,
        pricing_scheme: { fixed_price: { value: '7.99', currency_code: 'USD' } },
      }],
      payment_preferences: {
        auto_bill_outstanding:     true,
        payment_failure_threshold: 1,
      },
      taxes: { percentage: '0', inclusive: false },
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error('Monthly plan error: ' + JSON.stringify(data));
  console.log('✓ Monthly plan created:', data.id);
  return data.id;
}

async function createAnnualPlan(token, productId) {
  const res = await fetch(`${BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': 'olai-plan-annual-' + Date.now(),
    },
    body: JSON.stringify({
      product_id:  productId,
      name:        'Olai Pro — Annual (Save 37%)',
      description: '$59.99 per year ($5.00/mo). All sales final. Non-refundable. No cancellations.',
      status:      'ACTIVE',
      billing_cycles: [{
        frequency:      { interval_unit: 'YEAR', interval_count: 1 },
        tenure_type:    'REGULAR',
        sequence:       1,
        total_cycles:   0,
        pricing_scheme: { fixed_price: { value: '59.99', currency_code: 'USD' } },
      }],
      payment_preferences: {
        auto_bill_outstanding:     true,
        payment_failure_threshold: 1,
      },
      taxes: { percentage: '0', inclusive: false },
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error('Annual plan error: ' + JSON.stringify(data));
  console.log('✓ Annual plan created:', data.id);
  return data.id;
}

(async () => {
  try {
    if (CLIENT_SECRET === 'REPLACE_WITH_SECRET') {
      throw new Error('Set PAYPAL_CLIENT_SECRET env var before running.');
    }
    console.log('Connecting to PayPal live API…\n');
    const token      = await getToken();
    const productId  = await createProduct(token);
    const monthlyId  = await createMonthlyPlan(token, productId);
    const annualId   = await createAnnualPlan(token, productId);

    console.log('\n✅ Done! Add these to your .env and Hostinger environment variables:\n');
    console.log(`VITE_PAYPAL_CLIENT_ID=${CLIENT_ID}`);
    console.log(`VITE_PAYPAL_PLAN_ID_MONTHLY=${monthlyId}`);
    console.log(`VITE_PAYPAL_PLAN_ID_ANNUAL=${annualId}`);
    console.log('\n⚠️  Rotate your PayPal Client Secret in the developer dashboard now.');
  } catch (err) {
    console.error('\n❌', err.message);
    process.exit(1);
  }
})();
